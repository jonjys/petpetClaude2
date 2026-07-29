import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

type Op = '+' | '-' | '×' | '÷'

function makeQuestion(level: number): { q: string; answer: number; choices: number[] } {
  const ops: Op[] = level < 3 ? ['+', '-'] : level < 6 ? ['+', '-', '×'] : ['+', '-', '×', '÷']
  const op = ops[Math.floor(Math.random() * ops.length)]
  let a: number, b: number, answer: number
  if (op === '+') { a = Math.floor(Math.random() * (10 + level * 5)) + 1; b = Math.floor(Math.random() * (10 + level * 5)) + 1; answer = a + b }
  else if (op === '-') { a = Math.floor(Math.random() * (20 + level * 5)) + 10; b = Math.floor(Math.random() * a) + 1; answer = a - b }
  else if (op === '×') { a = Math.floor(Math.random() * (5 + level)) + 2; b = Math.floor(Math.random() * (5 + level)) + 2; answer = a * b }
  else { b = Math.floor(Math.random() * 10) + 2; answer = Math.floor(Math.random() * 10) + 2; a = b * answer }
  const wrong = new Set<number>()
  while (wrong.size < 3) {
    const off = Math.floor(Math.random() * 10) + 1
    const w = answer + (Math.random() < 0.5 ? off : -off)
    if (w !== answer && w > 0) wrong.add(w)
  }
  const choices = [answer, ...wrong].sort(() => Math.random() - 0.5)
  return { q: `${a} ${op} ${b}`, answer, choices }
}

const ROUNDS = 12

export const MathDuelGame = memo(function MathDuelGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [question, setQuestion] = useState<ReturnType<typeof makeQuestion> | null>(null)
  const [timeLeft, setTimeLeft] = useState(8)
  const [selected, setSelected] = useState<number | null>(null)
  const [correct, setCorrect] = useState<boolean | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_md_best') ?? 0))

  const level = Math.floor(round / 3)

  const advanceRound = useCallback((nextR: number, newScore: number, newStreak: number) => {
    setSelected(null); setCorrect(null)
    setQuestion(makeQuestion(Math.floor(nextR / 3)))
    setTimeLeft(Math.max(3, 8 - Math.floor(nextR / 4)))
    setRound(nextR)
  }, [])

  const start = useCallback(() => {
    setScore(0); setStreak(0); setPhase('playing')
    setSelected(null); setCorrect(null)
    setQuestion(makeQuestion(0))
    setTimeLeft(8); setRound(0)
  }, [])

  useEffect(() => {
    if (phase !== 'playing' || selected !== null) return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          setCorrect(false); setSelected(-1)
          audio.tap()
          setTimeout(() => {
            const nextR = round + 1
            setStreak(0)
            if (nextR >= ROUNDS) {
              const prev = Number(localStorage.getItem('k0509_md_best') ?? 0)
              if (score > prev) localStorage.setItem('k0509_md_best', String(score))
              onWin(Math.round(score / 5), score)
              setPhase('done')
            } else advanceRound(nextR, score, 0)
          }, 900)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase, round, selected, score, advanceRound, onWin])

  const handleChoice = useCallback((choice: number) => {
    if (!question || selected !== null) return
    if (timerRef.current) clearInterval(timerRef.current)
    const isCorrect = choice === question.answer
    const newStreak = isCorrect ? streak + 1 : 0
    const pts = isCorrect ? (50 + timeLeft * 10) * Math.min(newStreak, 5) : 0
    const newScore = score + pts
    setSelected(choice); setCorrect(isCorrect)
    setStreak(newStreak); setScore(newScore)
    isCorrect ? audio.coin() : audio.tap()
    setTimeout(() => {
      const nextR = round + 1
      if (nextR >= ROUNDS) {
        const prev = Number(localStorage.getItem('k0509_md_best') ?? 0)
        if (newScore > prev) localStorage.setItem('k0509_md_best', String(newScore))
        onWin(Math.round(newScore / 5), newScore)
        setPhase('done')
      } else advanceRound(nextR, newScore, newStreak)
    }, 900)
  }, [question, selected, streak, score, timeLeft, round, advanceRound, onWin])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>⚔️ Matteduel</span>
        <span className={styles.scoreDisplay}>{score}p · {round}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>⚔️</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Matteduel</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Svara rätt på matteuppgifter mot klockan!<br />Streak ger bonuspoäng. Svårare med varje runda.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}p</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {(phase === 'playing' || phase === 'done') && question && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--t3)' }}>Nivå {level + 1} · Runda {round + 1}/{ROUNDS}</div>
            <div style={{ display: 'flex', gap: 4 }}>
              {Array.from({ length: timeLeft }, (_, i) => (
                <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: timeLeft <= 2 ? '#f87171' : '#4ade80' }} />
              ))}
            </div>
            {streak > 1 && <div style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b' }}>🔥×{streak}</div>}
          </div>

          <div style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 16, padding: '20px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--ff-head)', fontSize: 36, fontWeight: 900, color: '#fff', letterSpacing: 2 }}>{question.q} = ?</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {question.choices.map(c => {
              const isSelected = selected === c
              const bg = isSelected
                ? correct ? 'rgba(74,222,128,.2)' : 'rgba(248,113,113,.2)'
                : selected !== null && c === question.answer ? 'rgba(74,222,128,.2)' : 'rgba(255,255,255,.06)'
              const border = isSelected
                ? correct ? '#4ade80' : '#f87171'
                : selected !== null && c === question.answer ? '#4ade80' : 'rgba(255,255,255,.1)'
              return (
                <button
                  key={c}
                  onClick={() => handleChoice(c)}
                  style={{ padding: '16px', borderRadius: 14, border: `2px solid ${border}`, background: bg, fontFamily: 'var(--ff-head)', fontSize: 24, fontWeight: 900, color: '#fff', cursor: selected === null ? 'pointer' : 'default', transition: 'all .15s' }}
                >
                  {c}
                </button>
              )
            })}
          </div>

          {phase === 'done' && (
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', marginTop: 8 }}>
              <div style={{ fontWeight: 900, color: '#4ade80', fontSize: 16 }}>🎉 {score}p på {ROUNDS} frågor!</div>
              <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Spela igen!</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
})
