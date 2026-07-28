import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
  petEmoji: string
}

type Ball = { id: number; x: number; y: number; vx: number; vy: number; r: number; emoji: string }

const DANGER = ['⚡','🔥','💥','❄️','☄️']
const SAFE = ['⭐','💰','🪙','💎']

export const DodgeBallGame = memo(function DodgeBallGame({ onExit, onWin, petEmoji }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [playerX, setPlayerX] = useState(50)
  const [balls, setBalls] = useState<Ball[]>([])
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(30)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_dodge_best') ?? 0))
  const stateRef = useRef({ playerX: 50, balls: [] as Ball[], score: 0, nextId: 0, frame: 0 })
  const frameRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const start = useCallback(() => {
    stateRef.current = { playerX: 50, balls: [], score: 0, nextId: 0, frame: 0 }
    setPlayerX(50); setBalls([]); setScore(0); setTimeLeft(30)
    setPhase('playing')
  }, [])

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = ((e.clientX - rect.left) / rect.width) * 100
    const x = Math.max(3, Math.min(97, pct))
    stateRef.current.playerX = x
    setPlayerX(x)
  }, [])

  useEffect(() => {
    if (phase !== 'playing') return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!); clearInterval(frameRef.current!)
          const s = stateRef.current
          const prev = Number(localStorage.getItem('k0509_dodge_best') ?? 0)
          if (s.score > prev) localStorage.setItem('k0509_dodge_best', String(s.score))
          onWin(s.score * 5, s.score * 10)
          audio.achievement()
          setPhase('done')
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current!)
  }, [phase, onWin])

  useEffect(() => {
    if (phase !== 'playing') return
    frameRef.current = setInterval(() => {
      const s = stateRef.current
      s.frame++

      // Spawn balls
      if (s.frame % 20 === 0) {
        const isSafe = Math.random() < 0.3
        s.balls.push({
          id: s.nextId++,
          x: 5 + Math.random() * 90,
          y: -5,
          vx: (Math.random() - 0.5) * 1.5,
          vy: 2 + Math.random() * 2,
          r: 4,
          emoji: isSafe ? SAFE[Math.floor(Math.random() * SAFE.length)] : DANGER[Math.floor(Math.random() * DANGER.length)],
        })
      }

      // Move balls
      s.balls = s.balls.map(b => ({ ...b, x: b.x + b.vx, y: b.y + b.vy })).filter(b => b.y < 110)

      // Collect safe / hit danger
      const px = s.playerX, py = 90
      const toRemove = new Set<number>()
      for (const b of s.balls) {
        if (Math.abs(b.x - px) < 8 && Math.abs(b.y - py) < 8) {
          if (SAFE.includes(b.emoji)) { s.score++; setScore(s.score); audio.coin() }
          else { s.score = Math.max(0, s.score - 2); setScore(s.score); audio.click() }
          toRemove.add(b.id)
        }
      }
      s.balls = s.balls.filter(b => !toRemove.has(b.id))
      setBalls([...s.balls])
    }, 33)
    return () => clearInterval(frameRef.current!)
  }, [phase])

  const timerColor = timeLeft > 15 ? '#4ade80' : timeLeft > 5 ? '#fbbf24' : '#f87171'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>⚡ Dodgeball</span>
        <span className={styles.scoreDisplay}>{score}pt · <span style={{ color: timerColor }}>{timeLeft}s</span></span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>⚡</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Dodgeball</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Rör fingret/musen för att flytta!<br />
            Samla ⭐💰 · Undvik ⚡🔥💥<br />30 sekunder
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}pt</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && (
        <div style={{ padding: '0 14px' }}>
          <div
            onPointerMove={handlePointerMove}
            style={{ position: 'relative', height: 280, background: 'linear-gradient(180deg, #0f172a 0%, #1e1b4b 100%)', border: '2px solid rgba(99,102,241,.3)', borderRadius: 12, overflow: 'hidden', touchAction: 'none', cursor: 'none' }}
          >
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'rgba(255,255,255,.08)' }}>
              <div style={{ height: '100%', width: `${(timeLeft / 30) * 100}%`, background: timerColor, transition: 'width 1s linear' }} />
            </div>
            {balls.map(b => (
              <div key={b.id} style={{ position: 'absolute', left: `${b.x}%`, top: `${b.y}%`, transform: 'translate(-50%,-50%)', fontSize: 16 }}>{b.emoji}</div>
            ))}
            <div style={{ position: 'absolute', left: `${playerX}%`, bottom: '8%', transform: 'translateX(-50%)', fontSize: 26 }}>{petEmoji}</div>
            <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', fontFamily: 'var(--ff-head)', fontSize: 20, fontWeight: 900, color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,.8)' }}>{score}</div>
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{score >= 20 ? '🏆' : score >= 10 ? '⭐' : '⚡'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{score} poäng!</div>
          <div style={{ fontSize: 14, color: score >= 20 ? '#4ade80' : '#fbbf24' }}>
            {score >= 20 ? 'Undvikarmästare! 🏆' : score >= 10 ? 'Riktigt bra! ⭐' : 'Öva mer! ⚡'}
          </div>
          {score > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{score * 5}🪙 +{score * 10} XP</div>
          <button className="btn-primary" style={{ padding: '12px 28px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
