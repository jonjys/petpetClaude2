import { memo, useState, useCallback, useRef, useEffect } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const GAME_TIME = 45

interface Problem {
  question: string
  answer: number
}

function makeProblem(): Problem {
  const ops = ['+', '-', '×']
  const op = ops[Math.floor(Math.random() * ops.length)]
  let a: number, b: number, answer: number
  if (op === '+') { a = 2 + Math.floor(Math.random() * 49); b = 2 + Math.floor(Math.random() * 49); answer = a + b }
  else if (op === '-') { a = 10 + Math.floor(Math.random() * 90); b = 1 + Math.floor(Math.random() * (a - 1)); answer = a - b }
  else { a = 2 + Math.floor(Math.random() * 12); b = 2 + Math.floor(Math.random() * 12); answer = a * b }
  return { question: `${a} ${op} ${b}`, answer }
}

export const MathSprintGame = memo(function MathSprintGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [problem, setProblem] = useState<Problem | null>(null)
  const [input, setInput] = useState('')
  const [score, setScore] = useState(0)
  const [errors, setErrors] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_TIME)
  const [shake, setShake] = useState(false)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_ms2_best') ?? 0))
  const scoreRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const end = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    const s = scoreRef.current
    const prev = Number(localStorage.getItem('k0509_ms2_best') ?? 0)
    if (s > prev) localStorage.setItem('k0509_ms2_best', String(s))
    onWin(s * 10, s * 35)
    setPhase('done')
    audio.achievement()
  }, [onWin])

  const start = useCallback(() => {
    scoreRef.current = 0
    setScore(0); setErrors(0); setInput(''); setTimeLeft(GAME_TIME)
    setProblem(makeProblem())
    setPhase('playing')
    timerRef.current = setInterval(() => {
      setTimeLeft(t => { if (t <= 1) { end(); return 0 } return t - 1 })
    }, 1000)
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [end])

  const submit = useCallback(() => {
    if (!problem) return
    const val = parseInt(input, 10)
    if (isNaN(val)) return
    if (val === problem.answer) {
      scoreRef.current++
      setScore(scoreRef.current)
      audio.coin()
      setProblem(makeProblem())
      setInput('')
    } else {
      setErrors(e => e + 1)
      setShake(true)
      audio.click()
      setTimeout(() => setShake(false), 400)
      setInput('')
    }
    inputRef.current?.focus()
  }, [problem, input])

  const onKey = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') submit()
  }, [submit])

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  const timerColor = timeLeft > 20 ? '#4ade80' : timeLeft > 10 ? '#fbbf24' : '#f87171'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>⚡ Math Sprint</span>
        <span className={styles.scoreDisplay}>{score}p</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>⚡</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Math Sprint</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Lös mattetal så snabbt som möjligt! Skriv svaret och tryck Enter. 45 sekunder.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}p</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && problem && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'rgba(255,255,255,.08)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(timeLeft / GAME_TIME) * 100}%`, background: timerColor, transition: 'width 1s linear' }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 900, color: timerColor }}>{timeLeft}s</span>
          </div>

          <div style={{
            textAlign: 'center', padding: '28px 16px',
            background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)',
            borderRadius: 20,
            animation: shake ? 'none' : undefined,
            outline: shake ? '2px solid #f87171' : undefined,
          }}>
            <div style={{ fontFamily: 'var(--ff-head)', fontSize: 44, fontWeight: 900, color: '#60a5fa', letterSpacing: 2 }}>
              {problem.question} =
            </div>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 6 }}>Rätt: {score} · Fel: {errors}</div>
          </div>

          <input
            ref={inputRef}
            type="number"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKey}
            placeholder="Svar..."
            style={{
              fontSize: 28, fontWeight: 900, textAlign: 'center', padding: '14px',
              background: 'rgba(255,255,255,.06)', border: '2px solid rgba(255,255,255,.15)',
              borderRadius: 14, color: '#fff', width: '100%', boxSizing: 'border-box',
            }}
          />
          <button className="btn-primary" style={{ padding: '14px' }} onClick={submit}>Svara (Enter)</button>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{score >= 20 ? '🏆' : score >= 12 ? '⭐' : '⚡'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{score} rätt</div>
          <div style={{ fontSize: 12, color: '#aaa' }}>Fel: {errors}</div>
          <div style={{ fontSize: 13, color: score >= 20 ? '#4ade80' : '#fbbf24' }}>
            {score >= 25 ? 'MATTEGENI! 🧠' : score >= 20 ? 'Utmärkt! ⭐' : score >= 12 ? 'Bra! 👍' : 'Öva mer! ⚡'}
          </div>
          {score > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{score * 10}🪙 +{score * 35} XP</div>
          <button className="btn-primary" style={{ padding: '14px 32px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
