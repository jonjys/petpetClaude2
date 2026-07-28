import { memo, useState, useEffect, useCallback, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

type Phase = 'ready' | 'playing' | 'done'

interface Question {
  text: string
  answer: number
}

function makeQuestion(level: number): Question {
  const type = Math.floor(Math.random() * (level > 3 ? 4 : 2))
  if (type === 0) {
    const a = Math.floor(Math.random() * (10 + level * 5)) + 1
    const b = Math.floor(Math.random() * (10 + level * 5)) + 1
    return { text: `${a} + ${b}`, answer: a + b }
  }
  if (type === 1) {
    const a = Math.floor(Math.random() * (15 + level * 5)) + 5
    const b = Math.floor(Math.random() * a) + 1
    return { text: `${a} - ${b}`, answer: a - b }
  }
  if (type === 2) {
    const a = Math.floor(Math.random() * 10) + 2
    const b = Math.floor(Math.random() * 10) + 2
    return { text: `${a} × ${b}`, answer: a * b }
  }
  const b = Math.floor(Math.random() * 10) + 2
  const a = b * (Math.floor(Math.random() * 10) + 2)
  return { text: `${a} ÷ ${b}`, answer: a / b }
}

const TOTAL_TIME = 30
const TOTAL_QUESTIONS = 10

export const SpeedMathGame = memo(function SpeedMathGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<Phase>('ready')
  const [question, setQuestion] = useState<Question>(makeQuestion(1))
  const [qIndex, setQIndex] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME)
  const [input, setInput] = useState('')
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [combo, setCombo] = useState(0)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_speedmath_best') ?? 0))
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const finish = useCallback((finalCorrect: number, finalIndex: number) => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    const score = finalCorrect
    const prev = Number(localStorage.getItem('k0509_speedmath_best') ?? 0)
    if (score > prev) localStorage.setItem('k0509_speedmath_best', String(score))
    setPhase('done')
    const coins = score * 5
    const xp = score * 8
    onWin(coins, xp)
    audio.achievement()
  }, [onWin])

  useEffect(() => {
    if (phase !== 'playing') return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          setTimeLeft(0)
          setPhase(p => {
            if (p === 'playing') {
              setCorrect(c => { setQIndex(q => { finish(c, q); return q }); return c })
            }
            return p
          })
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase, finish])

  const submit = useCallback(() => {
    const val = parseInt(input, 10)
    if (isNaN(val)) return
    const isCorrect = val === question.answer
    setFeedback(isCorrect ? 'correct' : 'wrong')
    const newCombo = isCorrect ? combo + 1 : 0
    setCombo(newCombo)
    if (isCorrect) { setCorrect(c => c + 1); audio.coin() } else audio.click()
    setTimeout(() => {
      setFeedback(null)
      setInput('')
      inputRef.current?.focus()
      const newIndex = qIndex + 1
      if (newIndex >= TOTAL_QUESTIONS) {
        finish(isCorrect ? correct + 1 : correct, newIndex)
      } else {
        setQIndex(newIndex)
        setQuestion(makeQuestion(1 + Math.floor(newIndex / 3)))
      }
    }, 400)
  }, [input, question.answer, combo, qIndex, correct, finish])

  const start = useCallback(() => {
    setPhase('playing')
    setTimeLeft(TOTAL_TIME)
    setCorrect(0)
    setQIndex(0)
    setCombo(0)
    setQuestion(makeQuestion(1))
    setInput('')
    setFeedback(null)
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [])

  const timerColor = timeLeft > 15 ? '#4ade80' : timeLeft > 7 ? '#fbbf24' : '#f87171'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🧮 Snabbmatte</span>
        <span className={styles.scoreDisplay}>{correct}/{qIndex}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 52 }}>🧮</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Snabbmatte</div>
          <div style={{ fontSize: 13, color: 'var(--t3)', maxWidth: 280 }}>
            Svara på {TOTAL_QUESTIONS} mattematiska frågor på {TOTAL_TIME} sekunder!
          </div>
          {bestScore > 0 && (
            <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}/{TOTAL_QUESTIONS}</div>
          )}
          <div style={{ fontSize: 12, color: 'var(--t3)' }}>Belöning: {TOTAL_QUESTIONS * 5}🪙 max</div>
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>
            Starta!
          </button>
        </div>
      )}

      {phase === 'playing' && (
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Timer & progress */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: timerColor, fontFamily: 'var(--ff-head)', minWidth: 36 }}>{timeLeft}s</div>
            <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,.1)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${(timeLeft / TOTAL_TIME) * 100}%`,
                background: `linear-gradient(90deg, ${timerColor}, ${timerColor}88)`,
                borderRadius: 3,
                transition: 'width 1s linear, background .5s',
              }} />
            </div>
            <div style={{ fontSize: 11, color: 'var(--t3)', minWidth: 32, textAlign: 'right' }}>{qIndex + 1}/{TOTAL_QUESTIONS}</div>
          </div>

          {/* Question */}
          <div style={{
            background: feedback === 'correct' ? 'rgba(74,222,128,.15)' : feedback === 'wrong' ? 'rgba(248,113,113,.15)' : 'rgba(255,255,255,.05)',
            border: feedback === 'correct' ? '1px solid rgba(74,222,128,.4)' : feedback === 'wrong' ? '1px solid rgba(248,113,113,.4)' : '1px solid rgba(255,255,255,.08)',
            borderRadius: 20, padding: '32px 24px',
            textAlign: 'center',
            transition: 'background .15s, border-color .15s',
          }}>
            <div style={{ fontFamily: 'var(--ff-head)', fontSize: 36, fontWeight: 900, color: '#fff', letterSpacing: 2 }}>
              {question.text} = ?
            </div>
            {combo >= 3 && (
              <div style={{ fontSize: 13, color: '#fbbf24', marginTop: 8 }}>🔥 {combo}× combo!</div>
            )}
          </div>

          {/* Input */}
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              ref={inputRef}
              type="number"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') submit() }}
              style={{
                flex: 1, padding: '14px 16px', borderRadius: 12,
                background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.15)',
                color: '#fff', fontSize: 20, fontFamily: 'var(--ff-head)', fontWeight: 700,
                outline: 'none', textAlign: 'center',
              }}
              placeholder="Svar..."
              autoFocus
            />
            <button className="btn-primary" style={{ padding: '0 20px', fontSize: 18 }} onClick={submit}>
              ✓
            </button>
          </div>

          {/* Number pad for mobile */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {['7','8','9','⌫','4','5','6','-','1','2','3','0'].map(k => (
              <button
                key={k}
                onClick={() => {
                  if (k === '⌫') setInput(p => p.slice(0,-1))
                  else if (k === '-') setInput(p => p.startsWith('-') ? p.slice(1) : '-' + p)
                  else setInput(p => (p.length < 5 ? p + k : p))
                }}
                style={{
                  padding: '14px', borderRadius: 10,
                  background: k === '⌫' ? 'rgba(248,113,113,.15)' : 'rgba(255,255,255,.07)',
                  border: `1px solid rgba(255,255,255,.1)`,
                  color: '#e8e8f0', fontSize: 16, fontWeight: 700, cursor: 'pointer',
                }}
              >
                {k}
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{correct >= 8 ? '🏆' : correct >= 5 ? '🎯' : '📊'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>
            {correct}/{TOTAL_QUESTIONS}
          </div>
          <div style={{ fontSize: 14, color: correct >= 8 ? '#4ade80' : correct >= 5 ? '#fbbf24' : '#888' }}>
            {correct >= 9 ? 'Perfekt! 🌟' : correct >= 7 ? 'Jättebra! ⭐' : correct >= 5 ? 'Bra! 👍' : 'Öva mer! 💪'}
          </div>
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{correct * 5}🪙 +{correct * 8} XP</div>
          {correct > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', marginTop: 8 }} onClick={start}>
            Spela igen!
          </button>
        </div>
      )}
    </div>
  )
})
