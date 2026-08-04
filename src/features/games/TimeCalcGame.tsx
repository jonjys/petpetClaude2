import { memo, useState, useCallback, useRef, useEffect } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const ROUNDS = 10
const TIME_LIMIT = 8

type Q = { question: string; answer: string; options: string[] }

function pad(n: number) { return String(n).padStart(2, '0') }

function makeQ(difficulty: number): Q {
  const tier = difficulty < 4 ? 0 : difficulty < 7 ? 1 : 2

  if (tier === 0) {
    // Add minutes to a time
    const h = Math.floor(Math.random() * 12) + 1
    const m = Math.floor(Math.random() * 6) * 10
    const addMin = [15, 30, 45, 60][Math.floor(Math.random() * 4)]
    const startTotal = h * 60 + m
    const endTotal = startTotal + addMin
    const endH = Math.floor(endTotal / 60) % 24
    const endM = endTotal % 60
    const answer = `${pad(endH)}:${pad(endM)}`
    const makeWrong = () => {
      const delta = [15, 30, 45][Math.floor(Math.random() * 3)]
      const t = (endTotal + (Math.random() < 0.5 ? delta : -delta) + 1440) % 1440
      return `${pad(Math.floor(t / 60))}:${pad(t % 60)}`
    }
    const opts = Array.from(new Set([answer, makeWrong(), makeWrong(), makeWrong()])).slice(0, 4)
    return { question: `Kl ${pad(h)}:${pad(m)} + ${addMin} min = ?`, answer, options: opts.sort(() => Math.random() - 0.5) }
  } else if (tier === 1) {
    // Duration between two times
    const h1 = Math.floor(Math.random() * 8) + 6
    const m1 = Math.floor(Math.random() * 4) * 15
    const durH = Math.floor(Math.random() * 4) + 1
    const durM = [0, 15, 30, 45][Math.floor(Math.random() * 4)]
    const endTotal = h1 * 60 + m1 + durH * 60 + durM
    const h2 = Math.floor(endTotal / 60) % 24
    const m2 = endTotal % 60
    const answer = durM === 0 ? `${durH} timmar` : `${durH} tim ${durM} min`
    const makeWrong = () => {
      const dH = durH + (Math.random() < 0.5 ? 1 : -1)
      const dM = [0, 15, 30, 45][Math.floor(Math.random() * 4)]
      return Math.max(dH, 0) === 0 ? `${dM} min` : `${Math.max(dH, 0)} tim ${dM} min`
    }
    const opts = Array.from(new Set([answer, makeWrong(), makeWrong(), makeWrong()])).slice(0, 4)
    return { question: `Från ${pad(h1)}:${pad(m1)} till ${pad(h2)}:${pad(m2)} — hur lång tid?`, answer, options: opts.sort(() => Math.random() - 0.5) }
  } else {
    // Convert hours+minutes to minutes
    const h = 1 + Math.floor(Math.random() * 4)
    const m = [0, 15, 30, 45][Math.floor(Math.random() * 4)]
    const answer = `${h * 60 + m} min`
    const makeWrong = () => {
      const delta = [15, 30, 45, 60][Math.floor(Math.random() * 4)]
      return `${h * 60 + m + (Math.random() < 0.5 ? delta : -delta)} min`
    }
    const opts = Array.from(new Set([answer, makeWrong(), makeWrong(), makeWrong()])).slice(0, 4)
    return { question: `${h} timmar${m ? ` och ${m} minuter` : ''} = ? minuter`, answer, options: opts.sort(() => Math.random() - 0.5) }
  }
}

export const TimeCalcGame = memo(function TimeCalcGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'play' | 'feedback' | 'done'>('ready')
  const [round, setRound] = useState(0)
  const [q, setQ] = useState(() => makeQ(0))
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT)
  const [score, setScore] = useState(0)
  const [wasCorrect, setWasCorrect] = useState(false)
  const [chosen, setChosen] = useState<string | null>(null)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_tcl_best') ?? 0))
  const scoreRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const toRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const answeredRef = useRef(false)

  const nextRound = useCallback((r: number) => {
    if (r >= ROUNDS) {
      const s = scoreRef.current
      const prev = Number(localStorage.getItem('k0509_tcl_best') ?? 0)
      if (s > prev) localStorage.setItem('k0509_tcl_best', String(s))
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
            setChosen('--')
            setPhase('feedback')
            audio.click()
            toRef.current = setTimeout(() => nextRound(round + 1), 900)
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

  const answer = useCallback((val: string) => {
    if (phase !== 'play' || answeredRef.current) return
    answeredRef.current = true
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    const correct = val === q.answer
    setWasCorrect(correct)
    setChosen(val)
    if (correct) { scoreRef.current++; setScore(scoreRef.current); audio.coin() } else { audio.click() }
    setPhase('feedback')
    toRef.current = setTimeout(() => nextRound(round + 1), 900)
  }, [phase, q, round, nextRound])

  const start = useCallback(() => {
    scoreRef.current = 0
    setScore(0)
    nextRound(0)
  }, [nextRound])

  const accent = '#38bdf8'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>⏰ Tidsräkning</span>
        <span className={styles.scoreDisplay}>{score}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>⏰</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Tidsräkning</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Räkna med tid! Lägg till minuter, beräkna duration och omvandla. {TIME_LIMIT} sek, {ROUNDS} ronder.
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
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', lineHeight: 1.6 }}>{q.question}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {q.options.map((opt, i) => (
              <button key={i} onClick={() => answer(opt)} style={{ height: 64, borderRadius: 16, fontSize: 14, fontWeight: 700, background: 'rgba(56,189,248,.1)', color: accent, border: '2px solid rgba(56,189,248,.3)', cursor: 'pointer', padding: '0 6px' }}>{opt}</button>
            ))}
          </div>
        </div>
      )}

      {phase === 'feedback' && (
        <div style={{ padding: '32px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 48 }}>{wasCorrect ? '✅' : '❌'}</div>
          <div style={{ fontSize: 14, color: 'var(--t3)', lineHeight: 1.5 }}>{q.question}</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: accent }}>{q.answer}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: wasCorrect ? '#4ade80' : '#f87171' }}>
            {wasCorrect ? 'Rätt! ⏰' : chosen === '--' ? 'Timeout!' : `Fel! Du valde: ${chosen}`}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{score >= 8 ? '🏆' : score >= 6 ? '⭐' : '⏰'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{score} / {ROUNDS}</div>
          <div style={{ fontSize: 13, color: score >= 8 ? '#4ade80' : '#fbbf24' }}>
            {score === 10 ? 'PERFEKT! 🏆' : score >= 8 ? 'Utmärkt! ⭐' : score >= 6 ? 'Bra! 👍' : 'Öva mer! ⏰'}
          </div>
          {score > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{score * 16}🪙 +{score * 48} XP</div>
          <button className="btn-primary" style={{ padding: '14px 32px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
