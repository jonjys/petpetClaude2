import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
  petEmoji: string
}

type Guard = { id: number; x: number; dir: number; sight: number }

const LEVELS = [
  { guards: [{ id: 1, x: 40, dir: 1, sight: 15 }], treasure: { x: 85, y: 50 }, time: 20 },
  { guards: [{ id: 1, x: 30, dir: 1, sight: 15 }, { id: 2, x: 70, dir: -1, sight: 15 }], treasure: { x: 85, y: 50 }, time: 25 },
  { guards: [{ id: 1, x: 20, dir: 1, sight: 18 }, { id: 2, x: 50, dir: 1, sight: 15 }, { id: 3, x: 80, dir: -1, sight: 18 }], treasure: { x: 85, y: 50 }, time: 30 },
]

export const StealthGame = memo(function StealthGame({ onExit, onWin, petEmoji }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done' | 'caught'>('ready')
  const [level, setLevel] = useState(0)
  const [playerX, setPlayerX] = useState(10)
  const [guards, setGuards] = useState<Guard[]>([])
  const [timeLeft, setTimeLeft] = useState(20)
  const [score, setScore] = useState(0)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_stealth_best') ?? 0))
  const stateRef = useRef({ guards: [] as Guard[], playerX: 10, caught: false })
  const frameRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startLevel = useCallback((lvl: number, currentScore: number) => {
    const ld = LEVELS[lvl]
    stateRef.current = { guards: ld.guards.map(g => ({ ...g })), playerX: 10, caught: false }
    setGuards(ld.guards.map(g => ({ ...g }))); setPlayerX(10); setTimeLeft(ld.time)
    setLevel(lvl)
  }, [])

  const start = useCallback(() => {
    setScore(0); startLevel(0, 0); setPhase('playing')
  }, [startLevel])

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = ((e.clientX - rect.left) / rect.width) * 100
    const x = Math.max(3, Math.min(90, pct))
    stateRef.current.playerX = x
    setPlayerX(x)
  }, [])

  useEffect(() => {
    if (phase !== 'playing') return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!); clearInterval(frameRef.current!)
          setPhase('caught'); audio.click()
          return 0
        }
        return t - 1
      })
    }, 1000)
    frameRef.current = setInterval(() => {
      const s = stateRef.current
      if (s.caught) return

      // Move guards
      s.guards = s.guards.map(g => {
        let nx = g.x + g.dir * 0.8
        let nd = g.dir
        if (nx > 90) { nx = 90; nd = -1 }
        if (nx < 10) { nx = 10; nd = 1 }
        return { ...g, x: nx, dir: nd }
      })
      setGuards([...s.guards])

      // Check detection: guard detects player if within sight and on same row (y ~ 50)
      for (const g of s.guards) {
        const dx = Math.abs(g.x - s.playerX)
        if (dx < g.sight) {
          s.caught = true
          clearInterval(frameRef.current!); clearInterval(timerRef.current!)
          setPhase('caught'); audio.click()
          return
        }
      }

      // Check treasure reached
      const ld = LEVELS[level]
      if (Math.abs(s.playerX - ld.treasure.x) < 8) {
        clearInterval(frameRef.current!); clearInterval(timerRef.current!)
        const newScore = score + 100
        setScore(newScore); audio.achievement()
        if (level + 1 < LEVELS.length) {
          setTimeout(() => startLevel(level + 1, newScore), 500)
        } else {
          const prev = Number(localStorage.getItem('k0509_stealth_best') ?? 0)
          if (newScore > prev) localStorage.setItem('k0509_stealth_best', String(newScore))
          onWin(Math.round(newScore / 5), newScore)
          setPhase('done')
        }
      }
    }, 50)
    return () => { clearInterval(frameRef.current!); clearInterval(timerRef.current!) }
  }, [phase, level, score, startLevel, onWin])

  const timerColor = timeLeft > 15 ? '#4ade80' : timeLeft > 7 ? '#fbbf24' : '#f87171'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🕵️ Smygare</span>
        <span className={styles.scoreDisplay}>{score}p · Niv {level + 1}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🕵️</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Smygare</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Rör fingret för att flytta husdjuret!<br />Undvik vakternas synfält · Nå skatten 💎<br />3 nivåer med fler och fler vakter
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}p</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {(phase === 'playing' || phase === 'caught') && (
        <div style={{ padding: '0 14px' }}>
          <div
            onPointerMove={handlePointerMove}
            style={{ position: 'relative', height: 200, background: 'rgba(0,10,0,.8)', border: `2px solid ${phase === 'caught' ? 'rgba(248,113,113,.5)' : 'rgba(74,222,128,.2)'}`, borderRadius: 12, overflow: 'hidden', touchAction: 'none', cursor: 'none' }}
          >
            {/* Guard sight cones */}
            {guards.map(g => (
              <div key={g.id} style={{ position: 'absolute', top: '30%', left: `${g.x}%`, transform: 'translateX(-50%)', width: `${g.sight * 2}%`, height: '40%', background: 'rgba(255,200,0,.15)', border: '1px solid rgba(255,200,0,.2)', borderRadius: 4 }} />
            ))}
            {/* Guards */}
            {guards.map(g => (
              <div key={g.id} style={{ position: 'absolute', top: '50%', left: `${g.x}%`, transform: 'translate(-50%,-50%)', fontSize: 22 }}>👮</div>
            ))}
            {/* Treasure */}
            <div style={{ position: 'absolute', top: '50%', left: `${LEVELS[level]?.treasure.x ?? 85}%`, transform: 'translate(-50%,-50%)', fontSize: 22 }}>💎</div>
            {/* Player */}
            <div style={{ position: 'absolute', top: '50%', left: `${playerX}%`, transform: 'translate(-50%,-50%)', fontSize: 22 }}>{petEmoji}</div>
            {/* Timer bar */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'rgba(255,255,255,.08)' }}>
              <div style={{ height: '100%', width: `${(timeLeft / LEVELS[level]?.time) * 100}%`, background: timerColor }} />
            </div>
            {phase === 'caught' && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(248,113,113,.3)', fontSize: 18, fontWeight: 900, color: '#f87171' }}>🚨 UPPTÄCKT!</div>
            )}
          </div>
          <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--t3)', marginTop: 4 }}>Rör musen/fingret för att smyga</div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>🕵️</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>Alla nivåer klara! 🎉</div>
          <div style={{ fontSize: 14, color: '#4ade80' }}>{score} poäng</div>
          {score > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{Math.round(score / 5)}🪙 +{score} XP</div>
          <button className="btn-primary" style={{ padding: '12px 28px' }} onClick={start}>Spela igen!</button>
        </div>
      )}

      {phase === 'caught' && (
        <div style={{ padding: '16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 36 }}>🚨</div>
          <div style={{ fontSize: 15, fontWeight: 900, color: '#f87171' }}>Uppäckt på nivå {level + 1}!</div>
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{Math.round(score / 5)}🪙 +{score} XP</div>
          <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Försök igen!</button>
        </div>
      )}
    </div>
  )
})
