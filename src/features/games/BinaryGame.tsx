import { memo, useState, useCallback, useRef, useEffect } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const ROUNDS = 10
const TIME_LIMIT = 9

function makeQ(difficulty: number) {
  const max = difficulty < 4 ? 15 : difficulty < 7 ? 63 : 255
  const n = 1 + Math.floor(Math.random() * max)
  const bin = n.toString(2)
  const makeWrong = () => {
    let w: number
    do { w = Math.max(1, n + (Math.random() < 0.5 ? 1 : -1) * (1 << Math.floor(Math.random() * bin.length))) } while (w === n)
    return w
  }
  const w1 = makeWrong(), w2 = makeWrong(), w3 = makeWrong()
  const options = [n, w1, w2, w3].map((v, i) => ({ val: v, id: i })).sort(() => Math.random() - 0.5)
  return { binary: bin, answer: n, options }
}

export const BinaryGame = memo(function BinaryGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'play' | 'feedback' | 'done'>('ready')
  const [round, setRound] = useState(0)
  const [q, setQ] = useState(() => makeQ(0))
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT)
  const [score, setScore] = useState(0)
  const [wasCorrect, setWasCorrect] = useState(false)
  const [chosen, setChosen] = useState<number | null>(null)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_bin_best') ?? 0))
  const scoreRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const toRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const answeredRef = useRef(false)

  const nextRound = useCallback((r: number) => {
    if (r >= ROUNDS) {
      const s = scoreRef.current
      const prev = Number(localStorage.getItem('k0509_bin_best') ?? 0)
      if (s > prev) localStorage.setItem('k0509_bin_best', String(s))
      onWin(s * 20, s * 60)
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

  const accent = '#22d3ee'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>01 Binärt</span>
        <span className={styles.scoreDisplay}>{score}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>💻</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Binärt</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Konvertera binära tal till decimaler! {TIME_LIMIT} sek per fråga, {ROUNDS} ronder. Talen ökar!
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
            <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 6 }}>Binärt → Decimal</div>
            <div style={{ fontSize: 42, fontWeight: 900, color: accent, fontFamily: 'monospace', letterSpacing: 4 }}>{q.binary}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {q.options.map((opt) => (
              <button key={opt.id} onClick={() => answer(opt.val)} style={{ height: 64, borderRadius: 16, fontSize: 22, fontWeight: 900, background: 'rgba(34,211,238,.1)', color: accent, border: '2px solid rgba(34,211,238,.3)', cursor: 'pointer' }}>{opt.val}</button>
            ))}
          </div>
        </div>
      )}

      {phase === 'feedback' && (
        <div style={{ padding: '32px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 48 }}>{wasCorrect ? '✅' : '❌'}</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: accent, fontFamily: 'monospace' }}>{q.binary}</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#fff' }}>= {q.answer}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: wasCorrect ? '#4ade80' : '#f87171' }}>
            {wasCorrect ? 'Rätt! 💻' : chosen === -1 ? 'Timeout!' : `Fel! Du valde ${chosen}`}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{score >= 8 ? '🏆' : score >= 5 ? '⭐' : '💻'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{score} / {ROUNDS}</div>
          <div style={{ fontSize: 13, color: score >= 8 ? '#4ade80' : '#fbbf24' }}>
            {score === 10 ? 'PERFEKT! 🏆' : score >= 8 ? 'Utmärkt! ⭐' : score >= 5 ? 'Bra! 👍' : 'Öva mer! 💻'}
          </div>
          {score > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{score * 20}🪙 +{score * 60} XP</div>
          <button className="btn-primary" style={{ padding: '14px 32px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
