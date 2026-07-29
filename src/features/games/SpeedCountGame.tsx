import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const ROUNDS = 10
const TIME_PER_Q = 6

function makeQuestion(): { emojis: string[]; count: number; options: number[] } {
  const emoji = ['⭐', '🔵', '🟡', '🔴', '🟢', '💎', '🔶', '🌸'][Math.floor(Math.random() * 8)]
  const count = Math.floor(Math.random() * 12) + 3
  const emojis = Array(count).fill(emoji)
  const options = new Set<number>([count])
  while (options.size < 4) {
    options.add(Math.max(1, count + (Math.floor(Math.random() * 7) - 3)))
  }
  return { emojis, count, options: [...options].sort(() => Math.random() - 0.5) }
}

export const SpeedCountGame = memo(function SpeedCountGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [qi, setQi] = useState(0)
  const [question, setQuestion] = useState<ReturnType<typeof makeQuestion> | null>(null)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [timeLeft, setTimeLeft] = useState(TIME_PER_Q)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_sc_best') ?? 0))
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const scoreRef = useRef(0)
  const streakRef = useRef(0)

  const nextQ = useCallback((q: number) => {
    setQi(q); setQuestion(makeQuestion()); setFeedback(null); setTimeLeft(TIME_PER_Q)
  }, [])

  const finalize = useCallback((s: number) => {
    const prev = Number(localStorage.getItem('k0509_sc_best') ?? 0)
    if (s > prev) localStorage.setItem('k0509_sc_best', String(s))
    if (s > 0) onWin(Math.round(s / 7), s)
    setPhase('done')
  }, [onWin])

  const start = useCallback(() => {
    scoreRef.current = 0; streakRef.current = 0
    setScore(0); setStreak(0); setPhase('playing'); nextQ(0)
  }, [nextQ])

  useEffect(() => {
    if (phase !== 'playing' || feedback !== null) return
    timerRef.current = setInterval(() => setTimeLeft(t => {
      if (t <= 1) {
        if (timerRef.current) clearInterval(timerRef.current)
        streakRef.current = 0; setStreak(0)
        setFeedback(`⏰ Rätt: ${question?.count}`)
        audio.tap()
        setTimeout(() => {
          const nq = qi + 1
          if (nq >= ROUNDS) { finalize(scoreRef.current); return }
          nextQ(nq)
        }, 1300)
        return 0
      }
      return t - 1
    }), 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase, qi, feedback, question, finalize, nextQ])

  const pick = useCallback((opt: number) => {
    if (!question || feedback !== null) return
    if (timerRef.current) clearInterval(timerRef.current)
    const ok = opt === question.count
    const pts = ok ? Math.max(20, timeLeft * 15) + streakRef.current * 15 : 0
    if (ok) { streakRef.current++; setStreak(streakRef.current) } else { streakRef.current = 0; setStreak(0) }
    scoreRef.current += pts; setScore(s => s + pts)
    setFeedback(ok ? `✅ Rätt! +${pts}p` : `❌ Rätt: ${question.count}`)
    audio[ok ? 'coin' : 'tap']()
    setTimeout(() => {
      const nq = qi + 1
      if (nq >= ROUNDS) { finalize(scoreRef.current); return }
      nextQ(nq)
    }, 1200)
  }, [question, feedback, timeLeft, qi, finalize, nextQ])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🔢 Snabbräknaren</span>
        <span className={styles.scoreDisplay}>{score}p · {qi}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🔢</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Snabbräknaren</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Räkna emojis snabbt och välj rätt antal bland 4 alternativ. 10 runder, 6 sekunder vardera.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}p</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && question && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 3 }}>
            {Array.from({ length: TIME_PER_Q }, (_, i) => (
              <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i < timeLeft ? (timeLeft <= 2 ? '#f87171' : '#60a5fa') : 'rgba(255,255,255,.08)' }} />
            ))}
          </div>
          {streak >= 2 && <div style={{ textAlign: 'center', fontSize: 12, color: '#fbbf24', fontWeight: 700 }}>🔥 ×{streak}</div>}
          <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 14, padding: '14px', minHeight: 100, display: 'flex', flexWrap: 'wrap', gap: 3, justifyContent: 'center', alignContent: 'center' }}>
            {question.emojis.map((e, i) => (
              <span key={i} style={{ fontSize: 22 }}>{e}</span>
            ))}
          </div>
          {feedback
            ? <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: feedback.startsWith('✅') ? '#4ade80' : '#f87171' }}>{feedback}</div>
            : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {question.options.map((opt, i) => (
                  <button key={i} onClick={() => pick(opt)} style={{ padding: '16px', borderRadius: 14, fontSize: 20, fontWeight: 900, background: 'rgba(255,255,255,.06)', border: '2px solid rgba(255,255,255,.1)', color: '#e8e8f0', cursor: 'pointer' }}>
                    {opt}
                  </button>
                ))}
              </div>
            )
          }
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <div style={{ fontWeight: 900, color: '#4ade80', fontSize: 20 }}>🔢 {score}p!</div>
          <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
