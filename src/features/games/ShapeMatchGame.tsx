import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const GAME_TIME = 35
const SHAPES = ['⬛', '🔴', '🔺', '🟣', '🟡', '💠', '⭐', '🔷']

interface Card {
  id: number
  shape: string
  isTarget: boolean
}

function buildRound(target: string): Card[] {
  const cards: Card[] = []
  const targets = new Set<number>()
  while (targets.size < 2) targets.add(Math.floor(Math.random() * 6))
  for (let i = 0; i < 6; i++) {
    const isTarget = targets.has(i)
    const shape = isTarget ? target : SHAPES.filter(s => s !== target)[Math.floor(Math.random() * (SHAPES.length - 1))]
    cards.push({ id: i, shape, isTarget })
  }
  return cards
}

export const ShapeMatchGame = memo(function ShapeMatchGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [target, setTarget] = useState('')
  const [cards, setCards] = useState<Card[]>([])
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_TIME)
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [streak, setStreak] = useState(0)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_shm_best') ?? 0))
  const scoreRef = useRef(0)
  const streakRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const nextRound = useCallback(() => {
    const t = SHAPES[Math.floor(Math.random() * SHAPES.length)]
    setTarget(t)
    setCards(buildRound(t))
    setFeedback(null)
  }, [])

  const end = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    const s = scoreRef.current
    const prev = Number(localStorage.getItem('k0509_shm_best') ?? 0)
    if (s > prev) localStorage.setItem('k0509_shm_best', String(s))
    onWin(s * 6, s * 22)
    setPhase('done')
    audio.achievement()
  }, [onWin])

  const start = useCallback(() => {
    scoreRef.current = 0; streakRef.current = 0
    setScore(0); setStreak(0); setTimeLeft(GAME_TIME)
    const t = SHAPES[Math.floor(Math.random() * SHAPES.length)]
    setTarget(t); setCards(buildRound(t))
    setPhase('playing')
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => { if (prev <= 1) { end(); return 0 } return prev - 1 })
    }, 1000)
  }, [end])

  const pick = useCallback((card: Card) => {
    if (feedback !== null) return
    if (card.isTarget) {
      streakRef.current++
      setStreak(streakRef.current)
      const bonus = streakRef.current >= 5 ? 2 : 1
      scoreRef.current += bonus
      setScore(scoreRef.current)
      setFeedback('correct')
      audio.coin()
    } else {
      streakRef.current = 0
      setStreak(0)
      setFeedback('wrong')
      audio.click()
    }
    setTimeout(nextRound, 300)
  }, [feedback, nextRound])

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  const timerColor = timeLeft > 18 ? '#4ade80' : timeLeft > 8 ? '#fbbf24' : '#f87171'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🔷 Formmatch</span>
        <span className={styles.scoreDisplay}>{score}p</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🔷</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Formmatch</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Tryck på ALLA kort som matchar målformen. Hitta båda matchande formerna! 35 sekunder.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}p</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'rgba(255,255,255,.08)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(timeLeft / GAME_TIME) * 100}%`, background: timerColor, transition: 'width 1s linear' }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 900, color: timerColor }}>{timeLeft}s</span>
            {streak >= 3 && <span style={{ fontSize: 11, color: '#fbbf24' }}>🔥{streak}×</span>}
          </div>

          <div style={{
            textAlign: 'center', padding: '18px', borderRadius: 18,
            background: feedback === 'correct' ? 'rgba(74,222,128,.1)' : feedback === 'wrong' ? 'rgba(248,113,113,.1)' : 'rgba(255,255,255,.04)',
            border: `1px solid ${feedback === 'correct' ? 'rgba(74,222,128,.4)' : feedback === 'wrong' ? 'rgba(248,113,113,.4)' : 'rgba(255,255,255,.1)'}`,
          }}>
            <div style={{ fontSize: 11, color: 'var(--t3)' }}>Hitta formen:</div>
            <div style={{ fontSize: 54, lineHeight: 1.2 }}>{target}</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {cards.map(c => (
              <button
                key={c.id}
                onClick={() => pick(c)}
                disabled={feedback !== null}
                style={{
                  padding: '20px 8px', fontSize: 34, borderRadius: 16,
                  background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)',
                  cursor: 'pointer', transition: 'all .15s',
                  opacity: feedback !== null ? 0.5 : 1,
                }}
              >
                {c.shape}
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{score >= 20 ? '🏆' : score >= 12 ? '⭐' : '🔷'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{score} poäng</div>
          <div style={{ fontSize: 13, color: score >= 20 ? '#4ade80' : '#fbbf24' }}>
            {score >= 25 ? 'PERFEKT! 🏆' : score >= 20 ? 'Utmärkt! ⭐' : score >= 12 ? 'Bra! 👍' : 'Öva mer! 🔷'}
          </div>
          {score > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{score * 6}🪙 +{score * 22} XP</div>
          <button className="btn-primary" style={{ padding: '14px 32px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
