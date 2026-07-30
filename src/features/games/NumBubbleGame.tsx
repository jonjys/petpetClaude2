import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const GAME_DURATION = 35
const BUBBLE_COUNT = 6

interface Bubble {
  id: number
  value: number
  popped: boolean
  wrong: boolean
}

function makeBubbles(offset: number): Bubble[] {
  const vals: number[] = []
  while (vals.length < BUBBLE_COUNT) {
    const v = 1 + Math.floor(Math.random() * 30)
    if (!vals.includes(v)) vals.push(v)
  }
  return vals.map((v, i) => ({ id: offset + i, value: v, popped: false, wrong: false }))
}

export const NumBubbleGame = memo(function NumBubbleGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [bubbles, setBubbles] = useState<Bubble[]>([])
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION)
  const [score, setScore] = useState(0)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_nbub_best') ?? 0))
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const scoreRef = useRef(0)
  const idRef = useRef(0)
  const feedbackRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const nextTarget = (bs: Bubble[]) => {
    const active = bs.filter(b => !b.popped).map(b => b.value)
    return active.length > 0 ? Math.min(...active) : null
  }

  const start = useCallback(() => {
    scoreRef.current = 0; setScore(0)
    idRef.current = 0
    const initial = makeBubbles(0); idRef.current = BUBBLE_COUNT
    setBubbles(initial)
    setTimeLeft(GAME_DURATION)
    setPhase('playing')
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          const s = scoreRef.current
          const prev = Number(localStorage.getItem('k0509_nbub_best') ?? 0)
          if (s > prev) localStorage.setItem('k0509_nbub_best', String(s))
          if (s > 0) onWin(Math.round(s / 5), s)
          setPhase('done')
          return 0
        }
        return t - 1
      })
    }, 1000)
  }, [onWin])

  const popBubble = useCallback((b: Bubble) => {
    if (phase !== 'playing' || b.popped) return
    setBubbles(prev => {
      const target = nextTarget(prev)
      if (b.value !== target) {
        audio.tap()
        scoreRef.current = Math.max(0, scoreRef.current - 5)
        setScore(scoreRef.current)
        setFeedback(`-5p`)
        if (feedbackRef.current) clearTimeout(feedbackRef.current)
        feedbackRef.current = setTimeout(() => setFeedback(null), 500)
        return prev.map(x => x.id === b.id ? { ...x, wrong: true } : x)
      }
      audio.coin()
      scoreRef.current += 10; setScore(scoreRef.current)
      const updated = prev.map(x => x.id === b.id ? { ...x, popped: true, wrong: false } : x)
      const allPopped = updated.every(x => x.popped)
      if (allPopped) {
        const fresh = makeBubbles(idRef.current); idRef.current += BUBBLE_COUNT
        return fresh
      }
      return updated.map(x => x.id === b.id ? x : { ...x, wrong: false })
    })
  }, [phase])

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (feedbackRef.current) clearTimeout(feedbackRef.current)
  }, [])

  const timerPct = (timeLeft / GAME_DURATION) * 100

  const POSITIONS = [
    { left: '8%', top: '10%' }, { left: '42%', top: '5%' }, { left: '72%', top: '12%' },
    { left: '12%', top: '50%' }, { left: '46%', top: '52%' }, { left: '74%', top: '48%' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🫧 Talbubblan</span>
        <span className={styles.scoreDisplay}>{score}p · {timeLeft}s</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🫧</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Talbubblan</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Poppa bubblorna i stigande ordning! +10p rätt, -5p fel. 35 sekunder.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}p</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,.08)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${timerPct}%`, background: timerPct <= 40 ? '#f87171' : '#60a5fa', transition: 'width 1s linear' }} />
          </div>
          {feedback && <div style={{ textAlign: 'center', fontSize: 13, color: '#f87171', fontWeight: 700 }}>{feedback}</div>}
          <div style={{ fontSize: 11, color: 'var(--t3)', textAlign: 'center' }}>
            Nästa: <span style={{ color: '#fbbf24', fontWeight: 900 }}>{nextTarget(bubbles) ?? '?'}</span>
          </div>
          <div style={{ position: 'relative', height: 200 }}>
            {bubbles.map((b, idx) => (
              <button
                key={b.id}
                onClick={() => popBubble(b)}
                disabled={b.popped}
                style={{
                  position: 'absolute',
                  ...POSITIONS[idx % 6],
                  width: 68, height: 68, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900,
                  cursor: b.popped ? 'default' : 'pointer',
                  opacity: b.popped ? 0.15 : 1,
                  background: b.popped ? 'rgba(255,255,255,.04)' : b.wrong ? 'rgba(248,113,113,.3)' : 'rgba(96,165,250,.2)',
                  border: `3px solid ${b.popped ? 'rgba(255,255,255,.08)' : b.wrong ? '#f87171' : '#60a5fa'}`,
                  color: b.popped ? 'var(--t3)' : b.wrong ? '#f87171' : '#fff',
                  transition: 'all .15s',
                  transform: b.wrong ? 'scale(1.1)' : 'scale(1)',
                }}
              >{b.popped ? '' : b.value}</button>
            ))}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <div style={{ fontWeight: 900, color: '#4ade80', fontSize: 20 }}>🫧 {score}p!</div>
          <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
