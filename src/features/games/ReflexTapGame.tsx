import { memo, useState, useCallback, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const ROUNDS = 12
const TARGET_COLOR = '#4ade80'
const DECOY_COLORS = ['#f87171', '#60a5fa', '#fbbf24', '#c084fc', '#fb923c']

interface Circle {
  id: number
  x: number
  y: number
  size: number
  isTarget: boolean
  color: string
}

function makeCircles(round: number): Circle[] {
  const count = 4 + Math.min(round, 8)
  const targetIdx = Math.floor(Math.random() * count)
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: 8 + Math.random() * 80,
    y: 8 + Math.random() * 80,
    size: 32 + Math.floor(Math.random() * 22),
    isTarget: i === targetIdx,
    color: i === targetIdx ? TARGET_COLOR : DECOY_COLORS[Math.floor(Math.random() * DECOY_COLORS.length)],
  }))
}

export const ReflexTapGame = memo(function ReflexTapGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'wait' | 'go' | 'feedback' | 'done'>('ready')
  const [round, setRound] = useState(0)
  const [circles, setCircles] = useState<Circle[]>([])
  const [tapped, setTapped] = useState<boolean | null>(null)
  const [reactionMs, setReactionMs] = useState(0)
  const [score, setScore] = useState(0)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_rtg_best') ?? 0))
  const scoreRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const showTimeRef = useRef(0)

  const nextRound = useCallback((r: number) => {
    if (r >= ROUNDS) {
      const s = scoreRef.current
      const prev = Number(localStorage.getItem('k0509_rtg_best') ?? 0)
      if (s > prev) localStorage.setItem('k0509_rtg_best', String(s))
      onWin(s * 14, s * 45)
      setPhase('done')
      audio.achievement()
      return
    }
    setRound(r)
    setTapped(null)
    setPhase('wait')
    const delay = 600 + Math.random() * 1200
    timerRef.current = setTimeout(() => {
      setCircles(makeCircles(r))
      showTimeRef.current = Date.now()
      setPhase('go')
      timerRef.current = setTimeout(() => {
        setTapped(false)
        setPhase('feedback')
        audio.click()
        timerRef.current = setTimeout(() => nextRound(r + 1), 1000)
      }, 2200)
    }, delay)
  }, [onWin])

  const start = useCallback(() => {
    scoreRef.current = 0
    setScore(0)
    nextRound(0)
  }, [nextRound])

  const tapCircle = useCallback((isTarget: boolean) => {
    if (phase !== 'go') return
    if (timerRef.current) clearTimeout(timerRef.current)
    const ms = Date.now() - showTimeRef.current
    setReactionMs(ms)
    setTapped(isTarget)
    setPhase('feedback')
    if (isTarget) {
      scoreRef.current++
      setScore(scoreRef.current)
      audio.coin()
    } else {
      audio.click()
    }
    timerRef.current = setTimeout(() => nextRound(round + 1), 900)
  }, [phase, round, nextRound])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🎯 Reflextapp</span>
        <span className={styles.scoreDisplay}>{score}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🎯</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Reflextapp</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Cirklar dyker upp — tryck på den <span style={{ color: TARGET_COLOR, fontWeight: 700 }}>GRÖNA</span> så snabbt du kan! Undvik de andra. 12 ronder.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}/{ROUNDS}</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'wait' && (
        <div style={{ padding: '40px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 32, color: 'var(--t3)' }}>Vänta... ({round + 1}/{ROUNDS})</div>
          <div style={{ fontSize: 12, color: 'var(--t3)' }}>Tryck grönt när det dyker upp!</div>
        </div>
      )}

      {phase === 'go' && (
        <div style={{ padding: '0 14px' }}>
          <div style={{ fontSize: 11, color: 'var(--t3)', textAlign: 'center', marginBottom: 8 }}>Tryck GRÖNT! ({round + 1}/{ROUNDS})</div>
          <div style={{ position: 'relative', height: 240, background: 'rgba(255,255,255,.03)', borderRadius: 14, border: '1px solid rgba(255,255,255,.08)', overflow: 'hidden' }}>
            {circles.map(c => (
              <button
                key={c.id}
                onClick={() => tapCircle(c.isTarget)}
                style={{
                  position: 'absolute',
                  left: `${c.x}%`, top: `${c.y}%`,
                  width: c.size, height: c.size,
                  borderRadius: '50%',
                  background: c.color,
                  border: c.isTarget ? '3px solid #fff' : 'none',
                  cursor: 'pointer',
                  transform: 'translate(-50%,-50%)',
                  boxShadow: `0 0 10px ${c.color}88`,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {phase === 'feedback' && (
        <div style={{ padding: '32px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 52 }}>{tapped === true ? '✅' : tapped === false && reactionMs === 0 ? '⏱️' : '❌'}</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: tapped === true ? '#4ade80' : '#f87171' }}>
            {tapped === true ? `Rätt! ${reactionMs}ms` : tapped === null ? 'För långsamt!' : 'Fel färg!'}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{score >= 10 ? '🏆' : score >= 7 ? '⭐' : '🎯'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{score} / {ROUNDS}</div>
          <div style={{ fontSize: 13, color: score >= 10 ? '#4ade80' : '#fbbf24' }}>
            {score === 12 ? 'PERFEKT! 🏆' : score >= 10 ? 'Utmärkt! ⭐' : score >= 7 ? 'Bra! 👍' : 'Öva mer! 🎯'}
          </div>
          {score > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{score * 14}🪙 +{score * 45} XP</div>
          <button className="btn-primary" style={{ padding: '14px 32px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
