import { memo, useState, useCallback, useRef, useEffect } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const ROUNDS = 20
const TIME_LIMIT = 2

function makeQ(difficulty: number) {
  const max = difficulty < 7 ? 20 : difficulty < 14 ? 100 : 999
  const n = 1 + Math.floor(Math.random() * max)
  return { n, isEven: n % 2 === 0 }
}

export const OddOrEvenBlitzGame = memo(function OddOrEvenBlitzGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'play' | 'feedback' | 'done'>('ready')
  const [round, setRound] = useState(0)
  const [q, setQ] = useState(() => makeQ(0))
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT)
  const [score, setScore] = useState(0)
  const [wasCorrect, setWasCorrect] = useState(false)
  const [chosen, setChosen] = useState<boolean | null>(null)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_oeb_best') ?? 0))
  const scoreRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const toRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const answeredRef = useRef(false)

  const nextRound = useCallback((r: number) => {
    if (r >= ROUNDS) {
      const s = scoreRef.current
      const prev = Number(localStorage.getItem('k0509_oeb_best') ?? 0)
      if (s > prev) localStorage.setItem('k0509_oeb_best', String(s))
      onWin(s * 10, s * 30)
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
            setChosen(null)
            setPhase('feedback')
            audio.click()
            toRef.current = setTimeout(() => nextRound(round + 1), 700)
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

  const answer = useCallback((pickedEven: boolean) => {
    if (phase !== 'play' || answeredRef.current) return
    answeredRef.current = true
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    const correct = pickedEven === q.isEven
    setWasCorrect(correct)
    setChosen(pickedEven)
    if (correct) { scoreRef.current++; setScore(scoreRef.current); audio.coin() } else { audio.click() }
    setPhase('feedback')
    toRef.current = setTimeout(() => nextRound(round + 1), 700)
  }, [phase, q, round, nextRound])

  const start = useCallback(() => {
    scoreRef.current = 0
    setScore(0)
    nextRound(0)
  }, [nextRound])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>⚡ Jämn/Udda Blitz</span>
        <span className={styles.scoreDisplay}>{score}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>⚡</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Jämn/Udda Blitz</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Är talet jämnt eller udda? Svara på {TIME_LIMIT} sekunder! {ROUNDS} ronder, siffror ökar.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}/{ROUNDS}</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'play' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--t3)' }}>{round + 1}/{ROUNDS}</div>
            <div style={{ fontSize: 13, color: timeLeft <= 1 ? '#f87171' : '#4ade80', fontWeight: 900 }}>⏱ {timeLeft}s</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,.05)', borderRadius: 18, padding: '36px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 56, fontWeight: 900, color: '#fff' }}>{q.n}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <button onClick={() => answer(true)} style={{ height: 70, borderRadius: 16, fontSize: 18, fontWeight: 900, background: 'rgba(74,222,128,.12)', color: '#4ade80', border: '2px solid rgba(74,222,128,.35)', cursor: 'pointer' }}>JÄMN</button>
            <button onClick={() => answer(false)} style={{ height: 70, borderRadius: 16, fontSize: 18, fontWeight: 900, background: 'rgba(248,113,113,.12)', color: '#f87171', border: '2px solid rgba(248,113,113,.35)', cursor: 'pointer' }}>UDDA</button>
          </div>
        </div>
      )}

      {phase === 'feedback' && (
        <div style={{ padding: '32px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 48 }}>{wasCorrect ? '✅' : '❌'}</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#fff' }}>{q.n}</div>
          <div style={{ fontSize: 13, color: q.isEven ? '#4ade80' : '#f87171', fontWeight: 700 }}>
            {q.n} är {q.isEven ? 'JÄMNT' : 'UDDA'}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{score >= 18 ? '🏆' : score >= 14 ? '⭐' : '⚡'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{score} / {ROUNDS}</div>
          <div style={{ fontSize: 13, color: score >= 18 ? '#4ade80' : '#fbbf24' }}>
            {score === 20 ? 'PERFEKT! 🏆' : score >= 18 ? 'Utmärkt! ⭐' : score >= 14 ? 'Bra! 👍' : 'Öva mer! ⚡'}
          </div>
          {score > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{score * 10}🪙 +{score * 30} XP</div>
          <button className="btn-primary" style={{ padding: '14px 32px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
