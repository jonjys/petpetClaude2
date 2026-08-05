import { memo, useState, useCallback, useRef, useEffect } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const ROUNDS = 12
const TIME_LIMIT = 6

type Q = { question: string; answer: string; options: string[] }

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b)
}

function fracStr(n: number, d: number): string {
  const g = gcd(Math.abs(n), Math.abs(d))
  const rn = n / g, rd = d / g
  return rd === 1 ? `${rn}` : `${rn}/${rd}`
}

function uniqueFour(answer: string, candidates: string[]): string[] {
  const seen = new Set([answer])
  const opts = [answer]
  for (const c of candidates) {
    if (opts.length === 4) break
    if (!seen.has(c)) { seen.add(c); opts.push(c) }
  }
  let i = 1
  while (opts.length < 4) {
    const fallback = fracStr(i + 1, 12)
    if (!seen.has(fallback)) { seen.add(fallback); opts.push(fallback) }
    i++
  }
  return opts.sort(() => Math.random() - 0.5)
}

function makeQ(difficulty: number): Q {
  const tier = difficulty < 4 ? 0 : difficulty < 8 ? 1 : 2

  if (tier === 0) {
    // Pick 4 distinct fractions, ask which is biggest
    const denoms = [2, 3, 4, 5, 6, 8]
    const seen = new Set<string>()
    const fracs: { str: string; val: number }[] = []
    let safety = 0
    while (fracs.length < 4 && safety++ < 200) {
      const d = denoms[Math.floor(Math.random() * denoms.length)]
      const n = 1 + Math.floor(Math.random() * (d - 1))
      const str = fracStr(n, d)
      if (!seen.has(str)) { seen.add(str); fracs.push({ str, val: n / d }) }
    }
    const answer = fracs.reduce((best, f) => f.val > best.val ? f : best).str
    return { question: 'Vilket bråk är störst?', answer, options: fracs.map(f => f.str).sort(() => Math.random() - 0.5) }
  } else if (tier === 1) {
    // Add fractions with same denominator
    const d = [2, 3, 4, 5, 6][Math.floor(Math.random() * 5)]
    const n1 = 1 + Math.floor(Math.random() * (d - 1))
    const n2 = 1 + Math.floor(Math.random() * (d - 1))
    const sumN = n1 + n2
    const answer = fracStr(sumN, d)
    const candidates = [
      fracStr(sumN + 1, d), fracStr(Math.max(1, sumN - 1), d),
      fracStr(sumN + 2, d), fracStr(Math.max(1, sumN - 2), d),
      fracStr(sumN, d + 1), fracStr(sumN + 1, d + 1),
    ]
    return { question: `${fracStr(n1, d)} + ${fracStr(n2, d)} = ?`, answer, options: uniqueFour(answer, candidates) }
  } else {
    // Multiply fraction by whole number
    const d = [2, 3, 4, 5][Math.floor(Math.random() * 4)]
    const n = 1 + Math.floor(Math.random() * (d - 1))
    const whole = 2 + Math.floor(Math.random() * 4)
    const res = n * whole
    const answer = fracStr(res, d)
    const candidates = [
      fracStr(res + 1, d), fracStr(Math.max(1, res - 1), d),
      fracStr(res + 2, d), fracStr(Math.max(1, res - 2), d),
      fracStr(res, d + 1), fracStr(res + whole, d),
    ]
    return { question: `${fracStr(n, d)} × ${whole} = ?`, answer, options: uniqueFour(answer, candidates) }
  }
}

export const FractionDuelGame = memo(function FractionDuelGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'play' | 'feedback' | 'done'>('ready')
  const [round, setRound] = useState(0)
  const [q, setQ] = useState(() => makeQ(0))
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT)
  const [score, setScore] = useState(0)
  const [wasCorrect, setWasCorrect] = useState(false)
  const [chosen, setChosen] = useState<string | null>(null)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_frd_best') ?? 0))
  const scoreRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const toRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const answeredRef = useRef(false)

  const nextRound = useCallback((r: number) => {
    if (r >= ROUNDS) {
      const s = scoreRef.current
      const prev = Number(localStorage.getItem('k0509_frd_best') ?? 0)
      if (s > prev) localStorage.setItem('k0509_frd_best', String(s))
      onWin(s * 15, s * 45)
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

  const accent = '#e879f9'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>➗ Bråkduellen</span>
        <span className={styles.scoreDisplay}>{score}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>➗</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Bråkduellen</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Jämför, addera och multiplicera bråk! {TIME_LIMIT} sek per fråga, {ROUNDS} ronder.
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
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', lineHeight: 1.7 }}>{q.question}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {q.options.map((opt, i) => (
              <button key={i} onClick={() => answer(opt)} style={{ height: 64, borderRadius: 16, fontSize: 18, fontWeight: 900, background: 'rgba(232,121,249,.1)', color: accent, border: '2px solid rgba(232,121,249,.3)', cursor: 'pointer' }}>{opt}</button>
            ))}
          </div>
        </div>
      )}

      {phase === 'feedback' && (
        <div style={{ padding: '32px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 48 }}>{wasCorrect ? '✅' : '❌'}</div>
          <div style={{ fontSize: 14, color: 'var(--t3)', lineHeight: 1.5 }}>{q.question}</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: accent }}>{q.answer}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: wasCorrect ? '#4ade80' : '#f87171' }}>
            {wasCorrect ? 'Rätt! ➗' : chosen === '--' ? 'Timeout!' : `Fel! Du valde: ${chosen}`}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{score >= 10 ? '🏆' : score >= 7 ? '⭐' : '➗'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{score} / {ROUNDS}</div>
          <div style={{ fontSize: 13, color: score >= 10 ? '#4ade80' : '#fbbf24' }}>
            {score === 12 ? 'PERFEKT! 🏆' : score >= 10 ? 'Utmärkt! ⭐' : score >= 7 ? 'Bra! 👍' : 'Öva mer! ➗'}
          </div>
          {score > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{score * 15}🪙 +{score * 45} XP</div>
          <button className="btn-primary" style={{ padding: '14px 32px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
