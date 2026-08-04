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

function makeQ(difficulty: number): Q {
  const tier = difficulty < 4 ? 0 : difficulty < 7 ? 1 : 2

  if (tier === 0) {
    // X% of Y
    const pcts = [10, 25, 50, 75]
    const pct = pcts[Math.floor(Math.random() * pcts.length)]
    const bases = [20, 40, 60, 80, 100, 120, 200, 400]
    const base = bases[Math.floor(Math.random() * bases.length)]
    const ans = (pct * base) / 100
    const answer = `${ans}`
    const makeWrong = () => {
      const delta = [5, 10, 15, 20][Math.floor(Math.random() * 4)]
      return `${Math.max(1, ans + (Math.random() < 0.5 ? delta : -delta))}`
    }
    const opts = Array.from(new Set([answer, makeWrong(), makeWrong(), makeWrong()])).slice(0, 4)
    while (opts.length < 4) opts.push(`${ans + opts.length}`)
    return { question: `${pct}% av ${base} = ?`, answer, options: opts.sort(() => Math.random() - 0.5) }
  } else if (tier === 1) {
    // What percent is X of Y
    const pairs: [number, number, number][] = [
      [10, 100, 10], [25, 100, 25], [50, 100, 50], [1, 4, 25], [1, 2, 50],
      [3, 4, 75], [1, 5, 20], [2, 5, 40], [3, 5, 60], [4, 5, 80],
      [1, 10, 10], [3, 10, 30], [7, 10, 70],
    ]
    const [x, y, pct] = pairs[Math.floor(Math.random() * pairs.length)]
    const answer = `${pct}%`
    const pctWrongs = [5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 75, 80].filter(p => p !== pct)
    const makeWrong = () => `${pctWrongs[Math.floor(Math.random() * pctWrongs.length)]}%`
    const opts = Array.from(new Set([answer, makeWrong(), makeWrong(), makeWrong()])).slice(0, 4)
    return { question: `Hur många procent är ${x} av ${y}?`, answer, options: opts.sort(() => Math.random() - 0.5) }
  } else {
    // X is Y% of what?
    const pcts = [10, 20, 25, 50]
    const pct = pcts[Math.floor(Math.random() * pcts.length)]
    const totals = [40, 60, 80, 100, 120, 200, 400]
    const total = totals[Math.floor(Math.random() * totals.length)]
    const part = (pct * total) / 100
    const answer = `${total}`
    const makeWrong = () => {
      const delta = [10, 20, 40, 50][Math.floor(Math.random() * 4)]
      return `${Math.max(10, total + (Math.random() < 0.5 ? delta : -delta))}`
    }
    const opts = Array.from(new Set([answer, makeWrong(), makeWrong(), makeWrong()])).slice(0, 4)
    while (opts.length < 4) opts.push(`${total + opts.length * 10}`)
    return { question: `${part} är ${pct}% av?`, answer, options: opts.sort(() => Math.random() - 0.5) }
  }
}

export const PercentGame = memo(function PercentGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'play' | 'feedback' | 'done'>('ready')
  const [round, setRound] = useState(0)
  const [q, setQ] = useState(() => makeQ(0))
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT)
  const [score, setScore] = useState(0)
  const [wasCorrect, setWasCorrect] = useState(false)
  const [chosen, setChosen] = useState<string | null>(null)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_pct_best') ?? 0))
  const scoreRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const toRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const answeredRef = useRef(false)

  const nextRound = useCallback((r: number) => {
    if (r >= ROUNDS) {
      const s = scoreRef.current
      const prev = Number(localStorage.getItem('k0509_pct_best') ?? 0)
      if (s > prev) localStorage.setItem('k0509_pct_best', String(s))
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

  const accent = '#f97316'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>% Procent</span>
        <span className={styles.scoreDisplay}>{score}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>%</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Procenträkning</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Räkna procent på {TIME_LIMIT} sek! Från enkla 10% till mer avancerade omvandlingar. {ROUNDS} ronder.
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
          <div style={{ background: 'rgba(255,255,255,.05)', borderRadius: 18, padding: '32px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: accent }}>{q.question}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {q.options.map((opt, i) => (
              <button key={i} onClick={() => answer(opt)} style={{ height: 64, borderRadius: 16, fontSize: 18, fontWeight: 900, background: 'rgba(249,115,22,.1)', color: accent, border: '2px solid rgba(249,115,22,.3)', cursor: 'pointer' }}>{opt}</button>
            ))}
          </div>
        </div>
      )}

      {phase === 'feedback' && (
        <div style={{ padding: '32px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 48 }}>{wasCorrect ? '✅' : '❌'}</div>
          <div style={{ fontSize: 16, color: 'var(--t3)', lineHeight: 1.5 }}>{q.question}</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: accent }}>{q.answer}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: wasCorrect ? '#4ade80' : '#f87171' }}>
            {wasCorrect ? 'Rätt! %' : chosen === '--' ? 'Timeout!' : `Fel! Du valde: ${chosen}`}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{score >= 8 ? '🏆' : score >= 6 ? '⭐' : '%'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{score} / {ROUNDS}</div>
          <div style={{ fontSize: 13, color: score >= 8 ? '#4ade80' : '#fbbf24' }}>
            {score === 10 ? 'PERFEKT! 🏆' : score >= 8 ? 'Utmärkt! ⭐' : score >= 6 ? 'Bra! 👍' : 'Öva mer! %'}
          </div>
          {score > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{score * 16}🪙 +{score * 48} XP</div>
          <button className="btn-primary" style={{ padding: '14px 32px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
