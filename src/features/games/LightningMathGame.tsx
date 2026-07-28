import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const GAME_TIME = 60

function makeQuestion() {
  const type = Math.floor(Math.random() * 4)
  if (type === 0) {
    const a = Math.floor(Math.random() * 20) + 1
    const b = Math.floor(Math.random() * 20) + 1
    return { q: `${a} + ${b}`, answer: a + b }
  } else if (type === 1) {
    const a = Math.floor(Math.random() * 20) + 10
    const b = Math.floor(Math.random() * a) + 1
    return { q: `${a} - ${b}`, answer: a - b }
  } else if (type === 2) {
    const a = Math.floor(Math.random() * 10) + 2
    const b = Math.floor(Math.random() * 10) + 2
    return { q: `${a} × ${b}`, answer: a * b }
  } else {
    const b = [2, 3, 4, 5, 6, 7, 8, 9, 10][Math.floor(Math.random() * 9)]
    const a = b * (Math.floor(Math.random() * 10) + 1)
    return { q: `${a} ÷ ${b}`, answer: a / b }
  }
}

function makeChoices(answer: number): number[] {
  const choices = new Set([answer])
  while (choices.size < 4) {
    const offset = Math.floor(Math.random() * 10) - 5
    const c = answer + offset
    if (c !== answer && c > 0) choices.add(c)
  }
  return Array.from(choices).sort(() => Math.random() - 0.5)
}

export const LightningMathGame = memo(function LightningMathGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [question, setQuestion] = useState({ q: '', answer: 0 })
  const [choices, setChoices] = useState<number[]>([])
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_TIME)
  const [flash, setFlash] = useState<'correct' | 'wrong' | null>(null)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_lmath_best') ?? 0))
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const scoreRef = useRef(0)

  const nextQ = useCallback(() => {
    const q = makeQuestion()
    setQuestion(q); setChoices(makeChoices(q.answer))
  }, [])

  const start = useCallback(() => {
    scoreRef.current = 0
    setScore(0); setStreak(0); setTimeLeft(GAME_TIME); setFlash(null)
    nextQ(); setPhase('playing')
  }, [nextQ])

  useEffect(() => {
    if (phase !== 'playing') return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!)
          const s = scoreRef.current
          const prev = Number(localStorage.getItem('k0509_lmath_best') ?? 0)
          if (s > prev) localStorage.setItem('k0509_lmath_best', String(s))
          onWin(s * 5, s * 8)
          audio.achievement()
          setPhase('done')
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current!)
  }, [phase, onWin])

  const handleAnswer = useCallback((choice: number) => {
    if (choice === question.answer) {
      const newStreak = streak + 1
      const points = 1 + (newStreak >= 5 ? 2 : newStreak >= 3 ? 1 : 0)
      const newScore = scoreRef.current + points
      scoreRef.current = newScore
      setScore(newScore); setStreak(newStreak)
      setFlash('correct'); audio.coin()
    } else {
      setStreak(0); setFlash('wrong'); audio.click()
    }
    setTimeout(() => { setFlash(null); nextQ() }, 250)
  }, [question, streak, nextQ])

  const timerColor = timeLeft > 30 ? '#4ade80' : timeLeft > 10 ? '#fbbf24' : '#f87171'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>⚡ Blixttabell</span>
        <span className={styles.scoreDisplay}>{score}p {streak >= 3 ? `🔥×${streak}` : ''}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>⚡</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Blixttabell</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Välj rätt svar så snabbt du kan!<br />60 sekunder · Streak ger bonuspoäng
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}p</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,.08)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(timeLeft / GAME_TIME) * 100}%`, background: timerColor, transition: 'width 1s linear', borderRadius: 2 }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 900, color: timerColor }}>{timeLeft}s</span>
          </div>
          <div style={{ textAlign: 'center', padding: '20px 0', background: flash === 'correct' ? 'rgba(74,222,128,.08)' : flash === 'wrong' ? 'rgba(248,113,113,.08)' : 'rgba(255,255,255,.03)', borderRadius: 16, border: `2px solid ${flash === 'correct' ? 'rgba(74,222,128,.3)' : flash === 'wrong' ? 'rgba(248,113,113,.3)' : 'rgba(255,255,255,.06)'}`, transition: 'all .1s' }}>
            <div style={{ fontFamily: 'var(--ff-head)', fontSize: 36, fontWeight: 900, color: '#e8e8f0' }}>{question.q} = ?</div>
            {streak >= 3 && <div style={{ fontSize: 12, color: '#fbbf24', marginTop: 6 }}>🔥 {streak}× streak! +{streak >= 5 ? 3 : 2}p</div>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {choices.map((c, i) => (
              <button key={i} onClick={() => handleAnswer(c)} style={{ padding: '18px 0', borderRadius: 14, fontSize: 22, fontWeight: 900, background: 'rgba(99,102,241,.1)', border: '2px solid rgba(99,102,241,.2)', color: '#e8e8f0', cursor: 'pointer' }}>
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{score >= 40 ? '🏆' : score >= 20 ? '⭐' : '⚡'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{score} poäng!</div>
          <div style={{ fontSize: 14, color: score >= 40 ? '#4ade80' : '#fbbf24' }}>
            {score >= 40 ? 'Mattegeni! 🏆' : score >= 20 ? 'Riktigt bra! ⭐' : 'Öva mer! ⚡'}
          </div>
          {score > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{score * 5}🪙 +{score * 8} XP</div>
          <button className="btn-primary" style={{ padding: '12px 28px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
