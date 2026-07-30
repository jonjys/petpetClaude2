import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const GAME_DURATION = 35
const BALLOON_COLORS = ['#f87171','#60a5fa','#4ade80','#fbbf24','#c084fc','#f97316','#38bdf8']

interface Balloon {
  id: number
  x: number
  size: number
  color: string
  speed: number
  y: number
}

export const BalloonPopGame = memo(function BalloonPopGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [balloons, setBalloons] = useState<Balloon[]>([])
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_bp2_best') ?? 0))
  const idRef = useRef(0)
  const scoreRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const spawnRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const riseRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopAll = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (spawnRef.current) clearInterval(spawnRef.current)
    if (riseRef.current) clearInterval(riseRef.current)
  }, [])

  const start = useCallback(() => {
    scoreRef.current = 0; setScore(0); setBalloons([]); setTimeLeft(GAME_DURATION)
    setPhase('playing')

    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          stopAll()
          const s = scoreRef.current
          const prev = Number(localStorage.getItem('k0509_bp2_best') ?? 0)
          if (s > prev) localStorage.setItem('k0509_bp2_best', String(s))
          if (s > 0) onWin(Math.round(s * 6), s * 25)
          setPhase('done'); return 0
        }
        return t - 1
      })
    }, 1000)

    spawnRef.current = setInterval(() => {
      setBalloons(prev => [...prev, {
        id: idRef.current++,
        x: 5 + Math.random() * 85,
        size: 40 + Math.floor(Math.random() * 25),
        color: BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)],
        speed: 0.6 + Math.random() * 0.8,
        y: 110,
      }])
    }, 700)

    riseRef.current = setInterval(() => {
      setBalloons(prev => prev.map(b => ({ ...b, y: b.y - b.speed })).filter(b => b.y > -15))
    }, 50)
  }, [onWin, stopAll])

  const pop = useCallback((id: number) => {
    setBalloons(prev => {
      if (!prev.find(b => b.id === id)) return prev
      audio.tap(); scoreRef.current++; setScore(scoreRef.current)
      return prev.filter(b => b.id !== id)
    })
  }, [])

  useEffect(() => () => stopAll(), [stopAll])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🎈 Ballongpopp</span>
        <span className={styles.scoreDisplay}>{score}p · {timeLeft}s</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🎈</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Ballongpopp</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Ballonger stiger uppåt — tryck på dem för att poppa! 35 sekunder.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}p</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,.08)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(timeLeft / GAME_DURATION) * 100}%`, background: timeLeft <= 8 ? '#f87171' : '#fbbf24', transition: 'width 1s linear' }} />
          </div>
          <div style={{ position: 'relative', height: 280, background: 'rgba(255,255,255,.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,.07)', overflow: 'hidden' }}>
            {balloons.map(b => (
              <button key={b.id} onClick={() => pop(b.id)} style={{
                position: 'absolute', left: `${b.x}%`, top: `${b.y}%`,
                transform: 'translate(-50%,-50%)',
                width: b.size, height: b.size * 1.2,
                borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
                background: b.color,
                border: 'none', cursor: 'pointer',
                boxShadow: `0 0 ${b.size / 3}px ${b.color}66`,
                fontSize: Math.floor(b.size * 0.45),
              }}>🎈</button>
            ))}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <div style={{ fontWeight: 900, color: '#fbbf24', fontSize: 20 }}>🎈 {score} ballonger!</div>
          <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
