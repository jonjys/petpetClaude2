import { memo, useState, useCallback, useRef, useEffect } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const ROUNDS = 12
const TIME_MS = 5000

function getQuestion(r: number) {
  const maxFactor = 5 + Math.floor(r / 3)
  const a = Math.floor(Math.random() * maxFactor) + 2
  const b = Math.floor(Math.random() * maxFactor) + 2
  const correct = a * b
  const opts = new Set([correct])
  while (opts.size < 4) {
    const delta = Math.floor(Math.random() * 8) + 1
    const v = correct + (Math.random() > 0.5 ? delta : -delta)
    if (v > 0) opts.add(v)
  }
  return {
    a, b, correct,
    options: Array.from(opts).sort(() => Math.random() - 0.5),
  }
}

export const SpeedMultiplyGame = memo(function SpeedMultiplyGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'play' | 'feedback' | 'done'>('ready')
  const [round, setRound] = useState(0)
  const [q, setQ] = useState(() => getQuestion(0))
  const [picked, setPicked] = useState<number | null>(null)
  const [timeLeft, setTimeLeft] = useState(TIME_MS)
  const [score, setScore] = useState(0)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_smg_best') ?? 0))
  const scoreRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startRef = useRef(0)

  const clearAll = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }

  const nextRound = useCallback((r: number) => {
    clearAll()
    if (r >= ROUNDS) {
      const s = scoreRef.current
      const prev = Number(localStorage.getItem('k0509_smg_best') ?? 0)
      if (s > prev) localStorage.setItem('k0509_smg_best', String(s))
      onWin(s * 15, s * 50)
      setPhase('done')
      audio.achievement()
      return
    }
    const question = getQuestion(r)
    setQ(question)
    setPicked(null)
    setRound(r)
    setTimeLeft(TIME_MS)
    startRef.current = Date.now()
    setPhase('play')
    intervalRef.current = setInterval(() => {
      setTimeLeft(Math.max(0, TIME_MS - (Date.now() - startRef.current)))
    }, 80)
    timerRef.current = setTimeout(() => {
      clearAll()
      setPicked(-1)
      setPhase('feedback')
      audio.click()
      timerRef.current = setTimeout(() => nextRound(r + 1), 1000)
    }, TIME_MS)
  }, [onWin])

  useEffect(() => () => clearAll(), [])

  const start = useCallback(() => {
    scoreRef.current = 0
    setScore(0)
    nextRound(0)
  }, [nextRound])

  const pick = useCallback((val: number) => {
    clearAll()
    setPicked(val)
    const isCorrect = val === q.correct
    setPhase('feedback')
    if (isCorrect) {
      scoreRef.current++
      setScore(scoreRef.current)
      audio.coin()
    } else {
      audio.click()
    }
    timerRef.current = setTimeout(() => nextRound(round + 1), 900)
  }, [q, round, nextRound])

  const pct = (timeLeft / TIME_MS) * 100

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>✖️ Snabbgångorna</span>
        <span className={styles.scoreDisplay}>{score}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>✖️</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Snabbgångorna</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Besvara multiplikationen innan tiden tar slut! 5 sekunder per fråga — tabellerna växer med varje runda. 12 frågor.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}/{ROUNDS}</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'play' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ height: 6, background: 'rgba(255,255,255,.08)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: pct > 40 ? '#4ade80' : pct > 15 ? '#fbbf24' : '#f87171', transition: 'width .08s linear' }} />
          </div>
          <div style={{ textAlign: 'center', padding: '16px 0', fontFamily: 'var(--ff-head)', fontSize: 42, fontWeight: 900, color: '#fff' }}>
            {q.a} × {q.b} = ?
          </div>
          <div style={{ fontSize: 10, color: 'var(--t3)', textAlign: 'center' }}>({round + 1}/{ROUNDS})</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {q.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => pick(opt)}
                style={{ padding: '18px', borderRadius: 14, fontFamily: 'var(--ff-head)', fontSize: 26, fontWeight: 900, color: '#fff', background: 'rgba(255,255,255,.08)', border: '2px solid rgba(255,255,255,.15)', cursor: 'pointer' }}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === 'feedback' && (
        <div style={{ padding: '32px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 52 }}>{picked === q.correct ? '✅' : '❌'}</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: picked === q.correct ? '#4ade80' : '#f87171' }}>
            {picked === q.correct ? `Rätt! ${q.a} × ${q.b} = ${q.correct}` : picked === -1 ? `Timeout! ${q.a} × ${q.b} = ${q.correct}` : `Fel! ${q.a} × ${q.b} = ${q.correct}`}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{score >= 10 ? '🏆' : score >= 7 ? '⭐' : '✖️'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{score} / {ROUNDS}</div>
          <div style={{ fontSize: 13, color: score >= 10 ? '#4ade80' : '#fbbf24' }}>
            {score === 12 ? 'PERFEKT! 🏆' : score >= 10 ? 'Utmärkt! ⭐' : score >= 7 ? 'Bra! 👍' : 'Öva mer! ✖️'}
          </div>
          {score > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{score * 15}🪙 +{score * 50} XP</div>
          <button className="btn-primary" style={{ padding: '14px 32px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
