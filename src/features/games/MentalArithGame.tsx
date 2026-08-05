import { memo, useState, useCallback, useRef, useEffect } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const ROUNDS = 15
const TIME_LIMIT = 5

type Q = { question: string; answer: number; options: number[] }

function uniqueFourNum(answer: number, gen: () => number): number[] {
  const seen = new Set([answer])
  const opts = [answer]
  let safety = 0
  while (opts.length < 4 && safety++ < 300) {
    const w = gen()
    if (!seen.has(w)) { seen.add(w); opts.push(w) }
  }
  let e = 0
  while (opts.length < 4) { const fb = answer + (++e) * 999; if (!seen.has(fb)) { seen.add(fb); opts.push(fb) } }
  return opts.sort(() => Math.random() - 0.5)
}

function makeQ(difficulty: number): Q {
  const tier = difficulty < 5 ? 0 : difficulty < 10 ? 1 : 2

  let a: number, b: number, answer: number, question: string

  if (tier === 0) {
    // Two-digit + single digit
    a = 10 + Math.floor(Math.random() * 89)
    b = 2 + Math.floor(Math.random() * 8)
    const useAdd = Math.random() < 0.6
    answer = useAdd ? a + b : a - b
    question = useAdd ? `${a} + ${b}` : `${a} - ${b}`
  } else if (tier === 1) {
    // Two-digit × single digit or two-digit + two-digit
    const choice = Math.floor(Math.random() * 3)
    if (choice === 0) {
      a = 11 + Math.floor(Math.random() * 8)
      b = 2 + Math.floor(Math.random() * 8)
      answer = a * b
      question = `${a} × ${b}`
    } else if (choice === 1) {
      a = 15 + Math.floor(Math.random() * 75)
      b = 15 + Math.floor(Math.random() * 75)
      answer = a + b
      question = `${a} + ${b}`
    } else {
      a = 30 + Math.floor(Math.random() * 70)
      b = 10 + Math.floor(Math.random() * (a - 10))
      answer = a - b
      question = `${a} - ${b}`
    }
  } else {
    // Three-digit operations
    const choice = Math.floor(Math.random() * 3)
    if (choice === 0) {
      a = 100 + Math.floor(Math.random() * 400)
      b = 50 + Math.floor(Math.random() * 200)
      answer = a + b
      question = `${a} + ${b}`
    } else if (choice === 1) {
      a = 300 + Math.floor(Math.random() * 400)
      b = 100 + Math.floor(Math.random() * 200)
      answer = a - b
      question = `${a} - ${b}`
    } else {
      a = 12 + Math.floor(Math.random() * 8)
      b = 12 + Math.floor(Math.random() * 8)
      answer = a * b
      question = `${a} × ${b}`
    }
  }

  const range = Math.max(3, Math.floor(Math.abs(answer) * 0.12))
  const makeWrong = () => Math.max(1, answer + (Math.random() < 0.5 ? 1 : -1) * (1 + Math.floor(Math.random() * range)))
  return { question, answer, options: uniqueFourNum(answer, makeWrong) }
}

export const MentalArithGame = memo(function MentalArithGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'play' | 'feedback' | 'done'>('ready')
  const [round, setRound] = useState(0)
  const [q, setQ] = useState(() => makeQ(0))
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT)
  const [score, setScore] = useState(0)
  const [wasCorrect, setWasCorrect] = useState(false)
  const [chosen, setChosen] = useState<number | null>(null)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_mna_best') ?? 0))
  const scoreRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const toRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const answeredRef = useRef(false)

  const nextRound = useCallback((r: number) => {
    if (r >= ROUNDS) {
      const s = scoreRef.current
      const prev = Number(localStorage.getItem('k0509_mna_best') ?? 0)
      if (s > prev) localStorage.setItem('k0509_mna_best', String(s))
      onWin(s * 13, s * 39)
      setPhase('done')
      audio.achievement()
      return
    }
    answeredRef.current = false
    setQ(makeQ(r))
    setChosen(null)
    setTimeLeft(TIME_LIMIT)
    setRound(r)
    setPhase('play')
  }, [onWin])

  useEffect(() => {
    if (phase !== 'play') return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
          if (!answeredRef.current) {
            answeredRef.current = true
            setWasCorrect(false)
            setChosen(-999)
            setPhase('feedback')
            audio.click()
            toRef.current = setTimeout(() => nextRound(round + 1), 800)
          }
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase, round, nextRound])

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (toRef.current) clearTimeout(toRef.current)
  }, [])

  const answer = useCallback((val: number) => {
    if (phase !== 'play' || answeredRef.current) return
    answeredRef.current = true
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    const correct = val === q.answer
    setWasCorrect(correct)
    setChosen(val)
    if (correct) { scoreRef.current++; setScore(scoreRef.current); audio.coin() } else { audio.click() }
    setPhase('feedback')
    toRef.current = setTimeout(() => nextRound(round + 1), 800)
  }, [phase, q, round, nextRound])

  const start = useCallback(() => {
    scoreRef.current = 0
    setScore(0)
    nextRound(0)
  }, [nextRound])

  const accent = '#fb923c'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🧠 Huvudräkning</span>
        <span className={styles.scoreDisplay}>{score}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🧠</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Huvudräkning</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Räkna i huvudet — snabbt! Från enkla 2-siffriga till 3-siffriga tal. {TIME_LIMIT} sek, {ROUNDS} ronder.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}/{ROUNDS}</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'play' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--t3)' }}>Runda {round + 1}/{ROUNDS}</div>
            <div style={{ fontSize: 13, color: timeLeft <= 2 ? '#f87171' : '#4ade80', fontWeight: 900 }}>⏱ {timeLeft}s</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,.05)', borderRadius: 18, padding: '36px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: accent }}>{q.question} = ?</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {q.options.map((opt, i) => (
              <button key={i} onClick={() => answer(opt)} style={{ height: 64, borderRadius: 16, fontSize: 22, fontWeight: 900, background: 'rgba(251,146,60,.1)', color: accent, border: '2px solid rgba(251,146,60,.3)', cursor: 'pointer' }}>{opt}</button>
            ))}
          </div>
        </div>
      )}

      {phase === 'feedback' && (
        <div style={{ padding: '32px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 48 }}>{wasCorrect ? '✅' : '❌'}</div>
          <div style={{ fontSize: 22, color: accent, fontWeight: 900 }}>{q.question} = {q.answer}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: wasCorrect ? '#4ade80' : '#f87171' }}>
            {wasCorrect ? 'Rätt! 🧠' : chosen === -999 ? 'Timeout!' : `Fel! Du valde: ${chosen}`}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{score >= 12 ? '🏆' : score >= 9 ? '⭐' : '🧠'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{score} / {ROUNDS}</div>
          <div style={{ fontSize: 13, color: score >= 12 ? '#4ade80' : '#fbbf24' }}>
            {score === 15 ? 'PERFEKT! 🏆' : score >= 12 ? 'Utmärkt! ⭐' : score >= 9 ? 'Bra! 👍' : 'Öva mer! 🧠'}
          </div>
          {score > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{score * 13}🪙 +{score * 39} XP</div>
          <button className="btn-primary" style={{ padding: '14px 32px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
