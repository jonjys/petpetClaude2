import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

type Enemy = { id: number; hp: number; maxHp: number; pos: number; speed: number; emoji: string }
type Tower = { col: number; level: number; emoji: string }

const COLS = 5
const WAVES = 6
const ENEMY_EMOJIS = ['🐛','🐞','🐜','🦗','🦟','🐝']
const TOWER_UPGRADES = [
  { emoji: '🗡️', dmg: 1, cost: 0 },
  { emoji: '⚔️', dmg: 2, cost: 30 },
  { emoji: '🪃', dmg: 3, cost: 60 },
  { emoji: '🏹', dmg: 5, cost: 100 },
]

export const TowerDefenseGame = memo(function TowerDefenseGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [wave, setWave] = useState(0)
  const [gold, setGold] = useState(80)
  const [lives, setLives] = useState(5)
  const [score, setScore] = useState(0)
  const [towers, setTowers] = useState<Tower[]>([])
  const [enemies, setEnemies] = useState<Enemy[]>([])
  const [waveActive, setWaveActive] = useState(false)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_td_best') ?? 0))
  const counterRef = useRef(0)
  const frameRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const spawnRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const start = useCallback(() => {
    setWave(0); setGold(80); setLives(5); setScore(0); setTowers([]); setEnemies([]); setWaveActive(false)
    setPhase('playing')
  }, [])

  const buyTower = useCallback((col: number) => {
    setTowers(prev => {
      const existing = prev.find(t => t.col === col)
      if (existing) {
        const nextLevel = existing.level + 1
        if (nextLevel >= TOWER_UPGRADES.length) return prev
        const cost = TOWER_UPGRADES[nextLevel].cost
        if (gold < cost) { audio.click(); return prev }
        setGold(g => g - cost)
        return prev.map(t => t.col === col ? { ...t, level: nextLevel, emoji: TOWER_UPGRADES[nextLevel].emoji } : t)
      }
      if (gold < 20) { audio.click(); return prev }
      setGold(g => g - 20)
      return [...prev, { col, level: 0, emoji: TOWER_UPGRADES[0].emoji }]
    })
    audio.coin()
  }, [gold])

  const startWave = useCallback(() => {
    if (waveActive) return
    setWaveActive(true)
    const waveNum = wave + 1
    let spawned = 0
    const count = 3 + waveNum * 2
    spawnRef.current = setInterval(() => {
      if (spawned >= count) { clearInterval(spawnRef.current!); return }
      const id = ++counterRef.current
      const hp = waveNum * 3
      const emoji = ENEMY_EMOJIS[Math.min(waveNum - 1, ENEMY_EMOJIS.length - 1)]
      setEnemies(prev => [...prev, { id, hp, maxHp: hp, pos: 0, speed: 0.8 + waveNum * 0.1, emoji }])
      spawned++
    }, 800)
  }, [waveActive, wave])

  useEffect(() => {
    if (phase !== 'playing' || !waveActive) return
    frameRef.current = setInterval(() => {
      setEnemies(prev => {
        const surviving: Enemy[] = []
        let livesLost = 0
        let killed = 0
        const next = prev.map(e => {
          let newHp = e.hp
          setTowers(ts => {
            ts.forEach(t => {
              const inRange = Math.abs(t.col * 20 + 10 - e.pos) < 18
              if (inRange) newHp -= TOWER_UPGRADES[t.level].dmg * 0.15
            })
            return ts
          })
          if (newHp <= 0) { killed++; return null }
          if (e.pos >= 100) { livesLost++; return null }
          return { ...e, hp: newHp, pos: e.pos + e.speed }
        }).filter(Boolean) as Enemy[]
        if (livesLost > 0) setLives(l => { const nl = l - livesLost; if (nl <= 0) setPhase('done'); return Math.max(0, nl) })
        if (killed > 0) { setScore(s => s + killed * 10); setGold(g => g + killed * 8) }
        if (next.length === 0 && !spawnRef.current) {
          clearInterval(frameRef.current!)
          setWave(w => {
            const nw = w + 1
            if (nw >= WAVES) setPhase('done')
            return nw
          })
          setWaveActive(false)
          setGold(g => g + 30)
        }
        return next
      })
    }, 100)
    return () => clearInterval(frameRef.current!)
  }, [phase, waveActive])

  useEffect(() => {
    if (phase === 'done') {
      const prev = Number(localStorage.getItem('k0509_td_best') ?? 0)
      if (score > prev) localStorage.setItem('k0509_td_best', String(score))
      onWin(score * 2 + lives * 50, score * 3)
      audio.achievement()
    }
  }, [phase, score, lives, onWin])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🏰 Tower Defense</span>
        <span className={styles.scoreDisplay}>❤️{lives} 🪙{gold}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🏰</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Tower Defense</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Bygg torn för att stoppa fiender!<br />{WAVES} vågor · 5 liv · Tryck tornceller för att bygga/uppgradera
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore} poäng</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
            <span style={{ color: '#f87171' }}>{'❤️'.repeat(lives)}</span>
            <span style={{ color: 'var(--t3)' }}>Våg {wave}/{WAVES} · {score}p</span>
            <span style={{ color: '#fbbf24' }}>🪙{gold}</span>
          </div>

          <div style={{ position: 'relative', height: 80, background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 12, overflow: 'hidden' }}>
            {enemies.map(e => (
              <div key={e.id} style={{ position: 'absolute', left: `${e.pos}%`, top: '50%', transform: 'translate(-50%,-50%)', fontSize: 20, transition: 'left .1s' }}>
                {e.emoji}
                <div style={{ height: 3, background: '#f87171', width: `${(e.hp/e.maxHp)*20}px`, margin: '2px auto 0', borderRadius: 2 }} />
              </div>
            ))}
            {enemies.length === 0 && !waveActive && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'var(--t3)' }}>Tryck "Nästa våg" för att starta →</div>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${COLS},1fr)`, gap: 6 }}>
            {Array.from({ length: COLS }, (_, col) => {
              const tower = towers.find(t => t.col === col)
              const nextCost = tower ? TOWER_UPGRADES[tower.level + 1]?.cost ?? null : 20
              return (
                <button key={col} onClick={() => buyTower(col)} style={{
                  padding: '10px 0', borderRadius: 10, fontSize: tower ? 22 : 18, fontWeight: 900,
                  background: tower ? 'rgba(74,222,128,.12)' : 'rgba(255,255,255,.05)',
                  border: `1px solid ${tower ? 'rgba(74,222,128,.3)' : 'rgba(255,255,255,.1)'}`,
                  color: '#e8e8f0', cursor: 'pointer',
                }}>
                  {tower ? tower.emoji : '+'}
                  <div style={{ fontSize: 9, color: 'var(--t3)', marginTop: 2 }}>
                    {nextCost !== null ? `${nextCost}🪙` : 'MAX'}
                  </div>
                </button>
              )
            })}
          </div>

          {!waveActive && wave < WAVES && (
            <button className="btn-primary" style={{ padding: '12px', fontSize: 14 }} onClick={startWave}>
              ▶ Nästa våg ({wave + 1}/{WAVES})
            </button>
          )}
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{lives > 0 ? '🏰' : '💀'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>
            {lives > 0 ? `Klart! Våg ${wave}/${WAVES}` : 'Försvaret föll!'}
          </div>
          <div style={{ fontSize: 14, color: lives > 0 ? '#4ade80' : '#fbbf24' }}>{score} poäng</div>
          {score > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{score * 2 + lives * 50}🪙</div>
          <button className="btn-primary" style={{ padding: '12px 28px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
