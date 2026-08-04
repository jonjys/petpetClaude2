import { memo, useState, useCallback, useRef, useEffect } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const ROUNDS = 12
const TIME_LIMIT = 7

type Q = { display: string; question: string; answer: number; options: number[] }

function makeQ(difficulty: number): Q {
  const tier = difficulty < 4 ? 0 : difficulty < 8 ? 1 : 2

  let display: string, question: string, answer: number

  if (tier === 0) {
    // rectangle
    const w = 2 + Math.floor(Math.random() * 9)
    const h = 2 + Math.floor(Math.random() * 9)
    display = `▭ ${w} × ${h}`
    question = 'Rektangelns area?'
    answer = w * h
  } else if (tier === 1) {
    // square or triangle
    if (Math.random() < 0.5) {
      const s = 2 + Math.floor(Math.random() * 8)
      display = `◻ ${s} × ${s}`
      question = 'Kvadratens area?'
      answer = s * s
    } else {
      const b = 2 + Math.floor(Math.random() * 8) * 2
      const h = 2 + Math.floor(Math.random() * 6) * 2
      display = `△ bas=${b}, h=${h}`
      question = 'Triangelns area? (b×h÷2)'
      answer = (b * h) / 2
    }
  } else {
    // perimeter of rectangle
    const w = 3 + Math.floor(Math.random() * 8)
    const h = 3 + Math.floor(Math.random() * 8)
    display = `▭ ${w} × ${h}`
    question = 'Rektangelns omkrets? (2×(b+h))'
    answer = 2 * (w + h)
  }

  const makeWrong = () => {
    const delta = 1 + Math.floor(Math.random() * Math.max(2, Math.floor(answer * 0.2)))
    return Math.max(1, answer + (Math.random() < 0.5 ? delta : -delta))
  }
  const opts = Array.from(new Set([answer, makeWrong(), makeWrong(), makeWrong()])).slice(0, 4)
  while (opts.length < 4) opts.push(opts[opts.length - 1] + 1)
  return { display, question, answer, options: opts.sort(() => Math.random() - 0.5) }
}

export const AreaGame = memo(function AreaGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'play' | 'feedback' | 'done'>('ready')
  const [round, setRound] = useState(0)
  const [q, setQ] = useState(() => makeQ(0))
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT)
  const [score, setScore] = useState(0)
  const [wasCorrect, setWasCorrect] = useState(false)
  const [chosen, setChosen] = useState<number | null>(null)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_are_best') ?? 0))
  const scoreRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const toRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const answeredRef = useRef(false)

  const nextRound = useCallback((r: number) => {
    if (r >= ROUNDS) {
      const s = scoreRef.current
      const prev = Number(localStorage.getItem('k0509_are_best') ?? 0)
      if (s > prev) localStorage.setItem('k0509_are_best', String(s))
      onWin(s * 16, s * 48)
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
            setChosen(-1)
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
        <span className={styles.gameTitle}>📐 Area & Omkrets</span>
        <span className={styles.scoreDisplay}>{score}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>📐</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Area & Omkrets</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Beräkna area och omkrets! {TIME_LIMIT} sek per uppgift, {ROUNDS} ronder. Trianglar tillkommer!
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
          <div style={{ background: 'rgba(255,255,255,.05)', borderRadius: 18, padding: '28px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: accent, marginBottom: 8 }}>{q.display}</div>
            <div style={{ fontSize: 13, color: 'var(--t3)' }}>{q.question}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {q.options.map((opt, i) => (
              <button key={i} onClick={() => answer(opt)} style={{ height: 64, borderRadius: 16, fontSize: 20, fontWeight: 900, background: 'rgba(251,146,60,.1)', color: accent, border: '2px solid rgba(251,146,60,.3)', cursor: 'pointer' }}>{opt}</button>
            ))}
          </div>
        </div>
      )}

      {phase === 'feedback' && (
        <div style={{ padding: '32px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 48 }}>{wasCorrect ? '✅' : '❌'}</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: accent }}>{q.display}</div>
          <div style={{ fontSize: 14, color: 'var(--t3)' }}>{q.question}</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#fff' }}>{q.answer}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: wasCorrect ? '#4ade80' : '#f87171' }}>
            {wasCorrect ? 'Rätt! 📐' : chosen === -1 ? 'Timeout!' : `Fel! Du valde ${chosen}`}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{score >= 10 ? '🏆' : score >= 7 ? '⭐' : '📐'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{score} / {ROUNDS}</div>
          <div style={{ fontSize: 13, color: score >= 10 ? '#4ade80' : '#fbbf24' }}>
            {score === 12 ? 'PERFEKT! 🏆' : score >= 10 ? 'Utmärkt! ⭐' : score >= 7 ? 'Bra! 👍' : 'Öva mer! 📐'}
          </div>
          {score > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{score * 16}🪙 +{score * 48} XP</div>
          <button className="btn-primary" style={{ padding: '14px 32px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
