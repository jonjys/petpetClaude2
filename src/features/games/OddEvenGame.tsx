import { memo, useState, useCallback, useRef, useEffect } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const ROUNDS = 20
const TIME_MS = 3000

function getQuestion(r: number) {
  const maxVal = 20 + r * 3
  const n = Math.floor(Math.random() * maxVal) + 1
  return { n, isEven: n % 2 === 0 }
}

export const OddEvenGame = memo(function OddEvenGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'play' | 'feedback' | 'done'>('ready')
  const [round, setRound] = useState(0)
  const [q, setQ] = useState(() => getQuestion(0))
  const [picked, setPicked] = useState<boolean | null>(null)
  const [timeLeft, setTimeLeft] = useState(TIME_MS)
  const [score, setScore] = useState(0)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_oeg_best') ?? 0))
  const scoreRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startRef = useRef(0)
  const pickedRef = useRef<boolean | null>(null)

  const clearAll = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }

  const nextRound = useCallback((r: number) => {
    clearAll()
    if (r >= ROUNDS) {
      const s = scoreRef.current
      const prev = Number(localStorage.getItem('k0509_oeg_best') ?? 0)
      if (s > prev) localStorage.setItem('k0509_oeg_best', String(s))
      onWin(s * 8, s * 26)
      setPhase('done')
      audio.achievement()
      return
    }
    const question = getQuestion(r)
    setQ(question)
    setPicked(null)
    pickedRef.current = null
    setRound(r)
    setTimeLeft(TIME_MS)
    startRef.current = Date.now()
    setPhase('play')
    intervalRef.current = setInterval(() => {
      setTimeLeft(Math.max(0, TIME_MS - (Date.now() - startRef.current)))
    }, 50)
    timerRef.current = setTimeout(() => {
      clearAll()
      if (pickedRef.current === null) {
        setPicked(null)
        setPhase('feedback')
        audio.click()
        timerRef.current = setTimeout(() => nextRound(r + 1), 700)
      }
    }, TIME_MS)
  }, [onWin])

  useEffect(() => () => clearAll(), [])

  const start = useCallback(() => {
    scoreRef.current = 0
    setScore(0)
    nextRound(0)
  }, [nextRound])

  const pick = useCallback((isEven: boolean) => {
    clearAll()
    pickedRef.current = isEven
    setPicked(isEven)
    const isCorrect = isEven === q.isEven
    setPhase('feedback')
    if (isCorrect) {
      scoreRef.current++
      setScore(scoreRef.current)
      audio.tap()
    } else {
      audio.click()
    }
    timerRef.current = setTimeout(() => nextRound(round + 1), 500)
  }, [q, round, nextRound])

  const pct = (timeLeft / TIME_MS) * 100

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🔢 Jämnt eller Udda</span>
        <span className={styles.scoreDisplay}>{score}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🔢</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Jämnt eller Udda</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Är talet jämnt eller udda? 3 sekunder per tal — 20 tal totalt! Siffrorna växer med varje runda.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}/{ROUNDS}</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'play' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ height: 5, background: 'rgba(255,255,255,.08)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: pct > 40 ? '#60a5fa' : '#f87171', transition: 'width .05s linear' }} />
          </div>
          <div style={{ textAlign: 'center', padding: '20px 0', fontFamily: 'var(--ff-head)', fontSize: 64, fontWeight: 900, color: '#fff' }}>
            {q.n}
          </div>
          <div style={{ fontSize: 10, color: 'var(--t3)', textAlign: 'center' }}>({round + 1}/{ROUNDS})</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <button onClick={() => pick(true)} style={{ padding: '22px', borderRadius: 16, fontFamily: 'var(--ff-head)', fontSize: 20, fontWeight: 900, color: '#4ade80', background: 'rgba(74,222,128,.1)', border: '2px solid rgba(74,222,128,.3)', cursor: 'pointer' }}>
              JÄMNT
            </button>
            <button onClick={() => pick(false)} style={{ padding: '22px', borderRadius: 16, fontFamily: 'var(--ff-head)', fontSize: 20, fontWeight: 900, color: '#f87171', background: 'rgba(248,113,113,.1)', border: '2px solid rgba(248,113,113,.3)', cursor: 'pointer' }}>
              UDDA
            </button>
          </div>
        </div>
      )}

      {phase === 'feedback' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 40 }}>{picked === q.isEven ? '✅' : picked === null ? '⏱️' : '❌'}</div>
          <div style={{ fontSize: 14, fontWeight: 900, color: picked === q.isEven ? '#4ade80' : '#f87171' }}>
            {picked === null ? 'För långsamt!' : picked === q.isEven ? 'Rätt!' : `Fel! ${q.n} är ${q.isEven ? 'jämnt' : 'udda'}`}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{score >= 17 ? '🏆' : score >= 13 ? '⭐' : '🔢'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{score} / {ROUNDS}</div>
          <div style={{ fontSize: 13, color: score >= 17 ? '#4ade80' : '#fbbf24' }}>
            {score === 20 ? 'PERFEKT! 🏆' : score >= 17 ? 'Utmärkt! ⭐' : score >= 13 ? 'Bra! 👍' : 'Öva mer! 🔢'}
          </div>
          {score > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{score * 8}🪙 +{score * 26} XP</div>
          <button className="btn-primary" style={{ padding: '14px 32px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
