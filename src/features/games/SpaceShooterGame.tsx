import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

type Enemy = { id: number; x: number; y: number; alive: boolean; emoji: string }
type Bullet = { id: number; x: number; y: number }

const ENEMY_EMOJIS = ['👾','🤖','💀','🦠','🐛','🕷️']
const W = 100

export const SpaceShooterGame = memo(function SpaceShooterGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [shipX, setShipX] = useState(50)
  const [enemies, setEnemies] = useState<Enemy[]>([])
  const [bullets, setBullets] = useState<Bullet[]>([])
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [wave, setWave] = useState(1)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_ss_best') ?? 0))
  const stateRef = useRef({ shipX: 50, enemies: [] as Enemy[], bullets: [] as Bullet[], score: 0, lives: 3, wave: 1, frame: 0, nextId: 0, active: true })
  const frameRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const areaRef = useRef<HTMLDivElement | null>(null)

  const spawnWave = useCallback((waveNum: number) => {
    const count = 6 + waveNum * 2
    const s = stateRef.current
    const newEnemies: Enemy[] = []
    for (let i = 0; i < count; i++) {
      newEnemies.push({ id: s.nextId++, x: 5 + (i % 8) * 11, y: 5 + Math.floor(i / 8) * 12, alive: true, emoji: ENEMY_EMOJIS[Math.floor(Math.random() * ENEMY_EMOJIS.length)] })
    }
    s.enemies = newEnemies
    setEnemies([...newEnemies])
  }, [])

  const start = useCallback(() => {
    stateRef.current = { shipX: 50, enemies: [], bullets: [], score: 0, lives: 3, wave: 1, frame: 0, nextId: 0, active: true }
    setShipX(50); setBullets([]); setScore(0); setLives(3); setWave(1)
    spawnWave(1)
    setPhase('playing')
  }, [spawnWave])

  const shoot = useCallback(() => {
    const s = stateRef.current
    s.bullets.push({ id: s.nextId++, x: s.shipX, y: 90 })
    setBullets([...s.bullets])
    audio.tap()
  }, [])

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = ((e.clientX - rect.left) / rect.width) * 100
    const x = Math.max(3, Math.min(97, pct))
    stateRef.current.shipX = x
    setShipX(x)
  }, [])

  useEffect(() => {
    if (phase !== 'playing') return
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') shoot()
      if (e.code === 'ArrowLeft') { stateRef.current.shipX = Math.max(3, stateRef.current.shipX - 5); setShipX(stateRef.current.shipX) }
      if (e.code === 'ArrowRight') { stateRef.current.shipX = Math.min(97, stateRef.current.shipX + 5); setShipX(stateRef.current.shipX) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, shoot])

  useEffect(() => {
    if (phase !== 'playing') return
    frameRef.current = setInterval(() => {
      const s = stateRef.current
      if (!s.active) return
      s.frame++

      // Move bullets up
      s.bullets = s.bullets.map(b => ({ ...b, y: b.y - 4 })).filter(b => b.y > 0)

      // Move enemies (oscillate)
      const shift = Math.sin(s.frame * 0.03) * 8
      const drop = Math.floor(s.frame / 180) * 3
      s.enemies = s.enemies.map(e => ({ ...e, x: e.x + shift * 0.1, y: e.y + drop * 0.01 }))

      // Auto-fire from enemy
      if (s.frame % 90 === 0) {
        const alive = s.enemies.filter(e => e.alive)
        if (alive.length > 0) {
          const shooter = alive[Math.floor(Math.random() * alive.length)]
          void shooter
          // No return fire mechanic — too complex; just keep enemies moving
        }
      }

      // Bullet-enemy collisions
      let newScore = s.score
      const hitEnemyIds = new Set<number>()
      const hitBulletIds = new Set<number>()
      for (const b of s.bullets) {
        for (const e of s.enemies) {
          if (!e.alive || hitEnemyIds.has(e.id)) continue
          if (Math.abs(b.x - e.x) < 6 && Math.abs(b.y - e.y) < 6) {
            hitEnemyIds.add(e.id); hitBulletIds.add(b.id)
            newScore += 10 + s.wave * 5
            audio.coin()
          }
        }
      }
      if (hitEnemyIds.size > 0) {
        s.enemies = s.enemies.map(e => hitEnemyIds.has(e.id) ? { ...e, alive: false } : e)
        s.bullets = s.bullets.filter(b => !hitBulletIds.has(b.id))
        s.score = newScore; setScore(newScore)
      }

      // Enemy reaches bottom
      const reachBottom = s.enemies.some(e => e.alive && e.y > 80)
      if (reachBottom) {
        s.lives--; setLives(s.lives)
        s.enemies = s.enemies.map(e => ({ ...e, y: 5 + Math.floor(s.enemies.indexOf(e) / 8) * 12 }))
        audio.click()
        if (s.lives <= 0) {
          endGame(s.score); return
        }
      }

      // All enemies dead → next wave
      if (s.enemies.every(e => !e.alive)) {
        s.wave++; setWave(s.wave)
        s.score += s.wave * 50; setScore(s.score)
        s.bullets = []
        setBullets([])
        spawnWave(s.wave)
        if (s.wave > 5) { endGame(s.score); return }
      }

      setEnemies([...s.enemies]); setBullets([...s.bullets])
    }, 50)
    return () => clearInterval(frameRef.current!)
  }, [phase, spawnWave])

  function endGame(sc: number) {
    clearInterval(frameRef.current!)
    const prev = Number(localStorage.getItem('k0509_ss_best') ?? 0)
    if (sc > prev) localStorage.setItem('k0509_ss_best', String(sc))
    onWin(Math.round(sc / 5), sc)
    audio.achievement()
    setPhase('done')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🚀 Space Shooter</span>
        <span className={styles.scoreDisplay}>{score} · ❤️×{lives}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🚀</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Space Shooter</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Rör musen för att sikta · Tryck för att skjuta<br />Mellanslag/piltangenter fungerar också · 5 vågor
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}p</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && (
        <div style={{ padding: '0 14px' }}>
          <div
            ref={areaRef}
            onPointerMove={handlePointerMove}
            onPointerDown={shoot}
            style={{ position: 'relative', height: 280, background: 'linear-gradient(180deg, #020617 0%, #0f172a 100%)', border: '2px solid rgba(99,102,241,.3)', borderRadius: 12, overflow: 'hidden', touchAction: 'none', cursor: 'crosshair' }}
          >
            {/* Stars */}
            {[20,40,60,80,15,55,75,35].map((x, i) => (
              <div key={i} style={{ position: 'absolute', left: `${x}%`, top: `${[10,25,40,55,70,15,35,65][i]}%`, width: 2, height: 2, borderRadius: '50%', background: 'rgba(255,255,255,.4)' }} />
            ))}
            {/* Enemies */}
            {enemies.filter(e => e.alive).map(e => (
              <div key={e.id} style={{ position: 'absolute', left: `${e.x}%`, top: `${e.y / 100 * 280}px`, transform: 'translate(-50%,-50%)', fontSize: 16 }}>{e.emoji}</div>
            ))}
            {/* Bullets */}
            {bullets.map(b => (
              <div key={b.id} style={{ position: 'absolute', left: `${b.x}%`, top: `${b.y / 100 * 280}px`, transform: 'translate(-50%,-50%)', width: 3, height: 10, background: '#fbbf24', borderRadius: 2, boxShadow: '0 0 4px #fbbf24' }} />
            ))}
            {/* Ship */}
            <div style={{ position: 'absolute', left: `${shipX}%`, bottom: 12, transform: 'translateX(-50%)', fontSize: 22 }}>🚀</div>
            {/* Score overlay */}
            <div style={{ position: 'absolute', top: 8, right: 10, fontFamily: 'var(--ff-head)', fontSize: 14, fontWeight: 900, color: '#fbbf24' }}>W{wave}</div>
          </div>
          <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--t3)', marginTop: 4 }}>Rör för att sikta · Tryck för att skjuta</div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{score >= 500 ? '🏆' : score >= 200 ? '⭐' : '🚀'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{score} poäng</div>
          <div style={{ fontSize: 14, color: score >= 500 ? '#4ade80' : '#fbbf24' }}>
            {score >= 500 ? 'Rymdfighter! 🏆' : score >= 200 ? 'Riktigt bra! ⭐' : 'Öva mer! 🚀'}
          </div>
          {score > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{Math.round(score / 5)}🪙 +{score} XP</div>
          <button className="btn-primary" style={{ padding: '12px 28px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
