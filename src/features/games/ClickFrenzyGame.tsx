import { memo, useState, useCallback, useRef, useEffect } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const GAME_TIME = 15

interface Dot {
  id: number
  x: number
  y: number
  size: number
  points: number
  color: string
}

const DOT_TYPES = [
  { points: 1, color: '#60a5fa', size: 44 },
  { points: 2, color: '#4ade80', size: 36 },
  { points: 3, color: '#fbbf24', size: 28 },
  { points: 5, color: '#f87171', size: 22 },
]

let _dotId = 0

export const ClickFrenzyGame = memo(function ClickFrenzyGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [dots, setDots] = useState<Dot[]>([])
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_TIME)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_cfz_best') ?? 0))
  const scoreRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const spawnRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const spawnDot = useCallback(() => {
    const type = DOT_TYPES[Math.floor(Math.random() * DOT_TYPES.length)]
    const dot: Dot = {
      id: ++_dotId,
      x: 5 + Math.random() * 85,
      y: 5 + Math.random() * 85,
      size: type.size,
      points: type.points,
      color: type.color,
    }
    setDots(prev => [...prev.slice(-14), dot])
  }, [])

  const start = useCallback(() => {
    scoreRef.current = 0
    setScore(0)
    setDots([])
    setTimeLeft(GAME_TIME)
    setPhase('playing')
    spawnDot()
  }, [spawnDot])

  useEffect(() => {
    if (phase !== 'playing') return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!)
          clearInterval(spawnRef.current!)
          const s = scoreRef.current
          const prev = Number(localStorage.getItem('k0509_cfz_best') ?? 0)
          if (s > prev) localStorage.setItem('k0509_cfz_best', String(s))
          onWin(Math.floor(s * 0.8), Math.floor(s * 2.5))
          setPhase('done')
          audio.achievement()
          return 0
        }
        return t - 1
      })
    }, 1000)
    spawnRef.current = setInterval(spawnDot, 700)
    return () => {
      clearInterval(timerRef.current!)
      clearInterval(spawnRef.current!)
    }
  }, [phase, spawnDot, onWin])

  const clickDot = useCallback((id: number, pts: number) => {
    setDots(prev => prev.filter(d => d.id !== id))
    scoreRef.current += pts
    setScore(scoreRef.current)
    if (pts >= 3) audio.coin()
    else audio.tap()
  }, [])

  const timerColor = timeLeft > 8 ? '#4ade80' : timeLeft > 4 ? '#fbbf24' : '#f87171'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>💥 Klickavansin</span>
        <span className={styles.scoreDisplay}>{score} pt</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>💥</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Klickavansin</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Klicka prickarna så snabbt du kan på 15 sekunder! Röda är mest värda men minst.
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            {DOT_TYPES.map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: t.color }}>
                <div style={{ width: 14, height: 14, borderRadius: '50%', background: t.color }} />
                {t.points}p
              </div>
            ))}
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore} pt</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && (
        <div style={{ padding: '0 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,.08)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(timeLeft / GAME_TIME) * 100}%`, background: timerColor, transition: 'width 1s linear' }} />
            </div>
            <span style={{ fontSize: 14, fontWeight: 900, color: timerColor }}>{timeLeft}s</span>
          </div>
          <div style={{ position: 'relative', height: 260, background: 'rgba(255,255,255,.03)', borderRadius: 14, border: '1px solid rgba(255,255,255,.08)', overflow: 'hidden', touchAction: 'none' }}>
            {dots.map(d => (
              <button
                key={d.id}
                onClick={() => clickDot(d.id, d.points)}
                style={{
                  position: 'absolute',
                  left: `${d.x}%`, top: `${d.y}%`,
                  width: d.size, height: d.size,
                  borderRadius: '50%',
                  background: d.color,
                  border: 'none',
                  cursor: 'pointer',
                  transform: 'translate(-50%,-50%)',
                  boxShadow: `0 0 12px ${d.color}88`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 900, color: 'rgba(0,0,0,.6)',
                }}
              >
                {d.points}
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{score >= 60 ? '🏆' : score >= 35 ? '⭐' : '💥'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{score} poäng</div>
          <div style={{ fontSize: 13, color: score >= 60 ? '#4ade80' : '#fbbf24' }}>
            {score >= 80 ? 'LEGENDARISK! 🏆' : score >= 60 ? 'Utmärkt! ⭐' : score >= 35 ? 'Bra! 👍' : 'Öva mer! 💥'}
          </div>
          {score > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{Math.floor(score * 0.8)}🪙 +{Math.floor(score * 2.5)} XP</div>
          <button className="btn-primary" style={{ padding: '14px 32px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
