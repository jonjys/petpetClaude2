import { memo, useState, useCallback, useRef, useEffect } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const ROUNDS = 12
const TIME_LIMIT = 10

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
  while (opts.length < 4) { const fb = answer + (++e) * 991; if (!seen.has(fb)) { seen.add(fb); opts.push(fb) } }
  return opts.sort(() => Math.random() - 0.5)
}

function makeQ(difficulty: number): Q {
  const tier = difficulty < 4 ? 0 : difficulty < 8 ? 1 : 2

  if (tier === 0) {
    // x + a = b  →  x = b - a
    const a = 2 + Math.floor(Math.random() * 9)
    const x = 1 + Math.floor(Math.random() * 15)
    const b = x + a
    const answer = x
    const cands = [x + 1, x - 1, x + 2, x - 2, b, a].filter(v => v > 0 && v !== x)
    return { question: `x + ${a} = ${b}, vad är x?`, answer, options: uniqueFourNum(answer, () => cands[Math.floor(Math.random() * cands.length)]) }
  } else if (tier === 1) {
    // ax = b  →  x = b / a
    const a = 2 + Math.floor(Math.random() * 8)
    const x = 1 + Math.floor(Math.random() * 10)
    const b = a * x
    const answer = x
    const cands = [x + 1, x - 1, x + 2, b, a, b - a].filter(v => v > 0 && v !== x)
    return { question: `${a}x = ${b}, vad är x?`, answer, options: uniqueFourNum(answer, () => cands[Math.floor(Math.random() * cands.length)]) }
  } else {
    // ax + b = c  →  x = (c - b) / a
    const a = 2 + Math.floor(Math.random() * 5)
    const x = 1 + Math.floor(Math.random() * 8)
    const b = 1 + Math.floor(Math.random() * 10)
    const c = a * x + b
    const answer = x
    const cands = [x + 1, x - 1, x + 2, c, b, c - b].filter(v => v > 0 && v !== x)
    return { question: `${a}x + ${b} = ${c}, vad är x?`, answer, options: uniqueFourNum(answer, () => cands[Math.floor(Math.random() * cands.length)]) }
  }
}

export const AlgebraWordGame = memo(function AlgebraWordGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'play' | 'feedback' | 'done'>('ready')
  const [round, setRound] = useState(0)
  const [q, setQ] = useState(() => makeQ(0))
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT)
  const [score, setScore] = useState(0)
  const [wasCorrect, setWasCorrect] = useState(false)
  const [chosen, setChosen] = useState<number | null>(null)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_algword_best') ?? 0))
  const scoreRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const toRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const answeredRef = useRef(false)

  const nextRound = useCallback((r: number) => {
    if (r >= ROUNDS) {
      const s = scoreRef.current
      const prev = Number(localStorage.getItem('k0509_algword_best') ?? 0)
      if (s > prev) localStorage.setItem('k0509_algword_best', String(s))
      onWin(s * 17, s * 51)
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

  const answer = useCallback((val: number) => {
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

  const accent = '#f59e0b'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🔣 Algebra</span>
        <span className={styles.scoreDisplay}>{score}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🔣</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Algebraekvationer</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Lös för x! x+a=b, ax=b och ax+b=c. {TIME_LIMIT} sek, {ROUNDS} ronder.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}/{ROUNDS}</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'play' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--t3)' }}>Runda {round + 1}/{ROUNDS}</div>
            <div style={{ fontSize: 13, color: timeLeft <= 3 ? '#f87171' : '#4ade80', fontWeight: 900 }}>⏱ {timeLeft}s</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,.05)', borderRadius: 18, padding: '36px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: accent }}>{q.question}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {q.options.map((opt, i) => (
              <button key={i} onClick={() => answer(opt)} style={{ height: 64, borderRadius: 16, fontSize: 22, fontWeight: 900, background: 'rgba(245,158,11,.1)', color: accent, border: '2px solid rgba(245,158,11,.3)', cursor: 'pointer' }}>{opt}</button>
            ))}
          </div>
        </div>
      )}

      {phase === 'feedback' && (
        <div style={{ padding: '32px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 48 }}>{wasCorrect ? '✅' : '❌'}</div>
          <div style={{ fontSize: 16, color: 'var(--t3)', lineHeight: 1.6 }}>{q.question}</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: accent }}>x = {q.answer}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: wasCorrect ? '#4ade80' : '#f87171' }}>
            {wasCorrect ? 'Rätt! 🔣' : chosen === -999 ? 'Timeout!' : `Fel! Du valde: ${chosen}`}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{score >= 10 ? '🏆' : score >= 7 ? '⭐' : '🔣'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{score} / {ROUNDS}</div>
          <div style={{ fontSize: 13, color: score >= 10 ? '#4ade80' : '#fbbf24' }}>
            {score === 12 ? 'PERFEKT! 🏆' : score >= 10 ? 'Utmärkt! ⭐' : score >= 7 ? 'Bra! 👍' : 'Öva mer! 🔣'}
          </div>
          {score > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{score * 17}🪙 +{score * 51} XP</div>
          <button className="btn-primary" style={{ padding: '14px 32px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
