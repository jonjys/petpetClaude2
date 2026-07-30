import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const GAME_DURATION = 45
const QUESTIONS = 20

function makeQ() {
  const ops = ['+', '-', '×'] as const
  const op = ops[Math.floor(Math.random() * ops.length)]
  let a: number, b: number, answer: number
  if (op === '+') { a = Math.floor(Math.random() * 50) + 1; b = Math.floor(Math.random() * 50) + 1; answer = a + b }
  else if (op === '-') { a = Math.floor(Math.random() * 50) + 20; b = Math.floor(Math.random() * a) + 1; answer = a - b }
  else { a = Math.floor(Math.random() * 12) + 1; b = Math.floor(Math.random() * 12) + 1; answer = a * b }
  const wrongs = new Set<number>()
  while (wrongs.size < 3) {
    const w = answer + (Math.floor(Math.random() * 10) - 5)
    if (w !== answer && w >= 0) wrongs.add(w)
  }
  const choices = [...Array.from(wrongs), answer].sort(() => Math.random() - 0.5)
  return { a, b, op, answer, choices }
}

type Q = ReturnType<typeof makeQ>

export const MathBlitzGame = memo(function MathBlitzGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [q, setQ] = useState<Q | null>(null)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [qNum, setQNum] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION)
  const [feedback, setFeedback] = useState<'right' | 'wrong' | null>(null)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_mb_best') ?? 0))
  const scoreRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const endGame = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    const s = scoreRef.current
    const prev = Number(localStorage.getItem('k0509_mb_best') ?? 0)
    if (s > prev) localStorage.setItem('k0509_mb_best', String(s))
    if (s > 0) onWin(Math.round(s * 12), s * 40)
    setPhase('done')
  }, [onWin])

  const start = useCallback(() => {
    scoreRef.current = 0; setScore(0); setStreak(0); setQNum(0); setTimeLeft(GAME_DURATION)
    setQ(makeQ()); setFeedback(null); setPhase('playing')
    timerRef.current = setInterval(() => {
      setTimeLeft(t => { if (t <= 1) { endGame(); return 0 } return t - 1 })
    }, 1000)
  }, [endGame])

  const answer = useCallback((val: number) => {
    if (!q || feedback) return
    if (val === q.answer) {
      audio.coin(); setFeedback('right')
      scoreRef.current++; setScore(scoreRef.current)
      setStreak(s => s + 1)
    } else {
      audio.tap(); setFeedback('wrong'); setStreak(0)
    }
    setTimeout(() => {
      const nq = qNum + 1
      setQNum(nq)
      if (nq >= QUESTIONS) { endGame(); return }
      setQ(makeQ()); setFeedback(null)
    }, 350)
  }, [q, feedback, qNum, endGame])

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>⚡ Math Blitz</span>
        <span className={styles.scoreDisplay}>{score}/{QUESTIONS} · {timeLeft}s</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>⚡</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Math Blitz</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Svara snabbt på 20 mattetal! Räkna +, − och × på 45 sekunder.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}/{QUESTIONS}</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && q && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,.08)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(timeLeft / GAME_DURATION) * 100}%`, background: timeLeft <= 10 ? '#f87171' : '#fbbf24', transition: 'width 1s linear' }} />
          </div>
          <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--t3)' }}>Fråga {qNum + 1}/{QUESTIONS} · Streak: {streak}</div>
          <div style={{
            textAlign: 'center', padding: '24px 16px', borderRadius: 16,
            background: feedback === 'right' ? 'rgba(74,222,128,.12)' : feedback === 'wrong' ? 'rgba(248,113,113,.12)' : 'rgba(255,255,255,.05)',
            border: `2px solid ${feedback === 'right' ? '#4ade80' : feedback === 'wrong' ? '#f87171' : 'rgba(255,255,255,.1)'}`,
            transition: 'all .2s',
          }}>
            <div style={{ fontFamily: 'var(--ff-head)', fontSize: 32, fontWeight: 900, color: '#fff' }}>
              {q.a} {q.op} {q.b} = ?
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {q.choices.map((c, i) => (
              <button key={i} onClick={() => answer(c)} style={{
                padding: '18px 0', borderRadius: 14,
                fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900,
                background: 'rgba(255,255,255,.08)', border: '2px solid rgba(255,255,255,.12)',
                color: '#fff', cursor: 'pointer',
              }}>{c}</button>
            ))}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <div style={{ fontWeight: 900, color: '#fbbf24', fontSize: 20 }}>⚡ {score}/{QUESTIONS} rätt!</div>
          <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
