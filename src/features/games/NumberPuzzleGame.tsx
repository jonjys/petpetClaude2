import { memo, useState, useCallback } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const ROUNDS = 10

interface Question {
  numbers: number[]
  target: number
  ops: string[]
}

function makeQuestion(round: number): Question {
  const difficulty = Math.floor(round / 3) + 1
  const a = Math.floor(Math.random() * (5 * difficulty)) + 1
  const b = Math.floor(Math.random() * (5 * difficulty)) + 1
  const ops = ['+', '-', '×']
  const op = ops[Math.floor(Math.random() * ops.length)]
  let target: number
  if (op === '+') target = a + b
  else if (op === '-') target = Math.abs(a - b)
  else target = a * b

  const fakeOps = ['÷', '+', '-', '×']
  const optionOps = [op]
  while (optionOps.length < 3) {
    const fo = fakeOps[Math.floor(Math.random() * fakeOps.length)]
    if (!optionOps.includes(fo)) optionOps.push(fo)
  }

  return { numbers: [Math.max(a, b), Math.min(a, b)], target, ops: optionOps.sort(() => Math.random() - 0.5) }
}

export const NumberPuzzleGame = memo(function NumberPuzzleGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [qi, setQi] = useState(0)
  const [question, setQuestion] = useState<Question | null>(null)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_np_best') ?? 0))

  const nextQ = useCallback((q: number) => {
    setQi(q); setQuestion(makeQuestion(q)); setFeedback(null)
  }, [])

  const start = useCallback(() => {
    setScore(0); setStreak(0); nextQ(0); setPhase('playing')
  }, [nextQ])

  const pick = useCallback((op: string) => {
    if (!question || feedback) return
    const [a, b] = question.numbers
    let result: number
    if (op === '+') result = a + b
    else if (op === '-') result = Math.abs(a - b)
    else if (op === '×') result = a * b
    else result = a % b === 0 ? a / b : -1

    const ok = result === question.target
    const pts = ok ? 50 + streak * 15 : 0
    const ns = ok ? streak + 1 : 0
    setStreak(ns); setScore(s => s + pts)
    setFeedback(ok ? `✅ Rätt! +${pts}p` : `❌ ${question.numbers[0]} ${op} ${question.numbers[1]} = ${result} ≠ ${question.target}`)
    audio[ok ? 'coin' : 'tap']()
    setTimeout(() => {
      const nq = qi + 1
      if (nq >= ROUNDS) {
        const s = score + pts
        const prev = Number(localStorage.getItem('k0509_np_best') ?? 0)
        if (s > prev) localStorage.setItem('k0509_np_best', String(s))
        if (s > 0) onWin(Math.round(s / 7), s)
        setPhase('done')
      } else { nextQ(nq) }
    }, 1200)
  }, [question, feedback, streak, score, qi, onWin, nextQ])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🔣 Taloperatorn</span>
        <span className={styles.scoreDisplay}>{score}p · {qi}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🔣</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Taloperatorn</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Välj rätt operator (+, -, ×, ÷) så att ekvationen stämmer! 10 frågor, streak ger bonus.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}p</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && question && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {streak >= 2 && <div style={{ textAlign: 'center', fontSize: 12, color: '#fbbf24', fontWeight: 700 }}>🔥 ×{streak}</div>}
          <div style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 16, padding: '24px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 32, fontWeight: 900, fontFamily: 'monospace', color: '#fff', letterSpacing: 4 }}>
              {question.numbers[0]} <span style={{ color: 'rgba(255,255,255,.4)', fontSize: 28 }}>?</span> {question.numbers[1]} = {question.target}
            </div>
          </div>
          {feedback
            ? <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: feedback.startsWith('✅') ? '#4ade80' : '#f87171' }}>{feedback}</div>
            : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {question.ops.map((op, i) => (
                  <button key={i} onClick={() => pick(op)} style={{ padding: '22px', borderRadius: 16, fontSize: 28, fontWeight: 900, fontFamily: 'monospace', background: 'rgba(255,255,255,.06)', border: '2px solid rgba(255,255,255,.1)', color: '#e8e8f0', cursor: 'pointer' }}>
                    {op}
                  </button>
                ))}
              </div>
            )
          }
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <div style={{ fontWeight: 900, color: '#4ade80', fontSize: 20 }}>🔣 {score}p!</div>
          <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
