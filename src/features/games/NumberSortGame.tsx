import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const ROUNDS = 8
const NUMBERS_COUNT = 8
const ROUND_TIME = 20

function makeRound() {
  const nums = Array.from({ length: NUMBERS_COUNT }, (_, i) => i + 1)
  const shuffled = [...nums].sort(() => Math.random() - 0.5)
  return shuffled
}

export const NumberSortGame = memo(function NumberSortGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [round, setRound] = useState(1)
  const [roundKey, setRoundKey] = useState(0)
  const [nums, setNums] = useState<number[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [swaps, setSwaps] = useState(0)
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME)
  const [score, setScore] = useState(0)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_ns_best') ?? 0))
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const roundRef = useRef(1)
  const scoreRef = useRef(0)

  const isSorted = (arr: number[]) => arr.every((v, i) => i === 0 || v > arr[i - 1])

  const finishRound = useCallback((r: number, completed: boolean) => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (completed) {
      audio.achievement()
      scoreRef.current++; setScore(scoreRef.current)
    }
    const nr = r + 1
    if (nr > ROUNDS) {
      const s = scoreRef.current
      const prev = Number(localStorage.getItem('k0509_ns_best') ?? 0)
      if (s > prev) localStorage.setItem('k0509_ns_best', String(s))
      if (s > 0) onWin(Math.round(s * 15), s * 50)
      setPhase('done')
    } else {
      setTimeout(() => {
        roundRef.current = nr
        setNums(makeRound())
        setSelected(null)
        setSwaps(0)
        setRound(nr)
        setTimeLeft(ROUND_TIME)
        setRoundKey(k => k + 1)
      }, 600)
    }
  }, [onWin])

  useEffect(() => {
    if (phase !== 'playing') return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { finishRound(roundRef.current, false); return 0 }
        return t - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase, roundKey, finishRound])

  const tap = useCallback((idx: number) => {
    if (phase !== 'playing') return
    if (selected === null) {
      setSelected(idx); audio.click()
    } else if (selected === idx) {
      setSelected(null)
    } else {
      setNums(prev => {
        const next = [...prev]
        ;[next[selected], next[idx]] = [next[idx], next[selected]]
        audio.tap()
        setSwaps(s => s + 1)
        setSelected(null)
        if (isSorted(next)) {
          setTimeout(() => finishRound(roundRef.current, true), 200)
        }
        return next
      })
    }
  }, [phase, selected, finishRound])

  const start = useCallback(() => {
    scoreRef.current = 0; setScore(0); roundRef.current = 1
    setNums(makeRound()); setSelected(null); setSwaps(0)
    setRound(1); setTimeLeft(ROUND_TIME); setRoundKey(0); setPhase('playing')
  }, [])

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🔀 Talsortering</span>
        <span className={styles.scoreDisplay}>{score}/{ROUNDS} · {timeLeft}s</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🔀</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Talsortering</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Sortera 8 siffror i stigande ordning genom att byta plats! 8 ronder, 20 sekunder var.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}/{ROUNDS} ronder</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,.08)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(timeLeft / ROUND_TIME) * 100}%`, background: timeLeft <= 5 ? '#f87171' : '#60a5fa', transition: 'width 1s linear' }} />
          </div>
          <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--t3)' }}>
            Rond {round}/{ROUNDS} · Byten: {swaps}
          </div>
          <div style={{ fontSize: 11, color: 'var(--t3)', textAlign: 'center' }}>Mål: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {nums.map((n, i) => (
              <button key={i} onClick={() => tap(i)} style={{
                padding: '20px 0', borderRadius: 14,
                fontFamily: 'var(--ff-head)', fontSize: 26, fontWeight: 900,
                background: selected === i ? 'rgba(96,165,250,.3)' : 'rgba(255,255,255,.08)',
                border: `2px solid ${selected === i ? '#60a5fa' : 'rgba(255,255,255,.12)'}`,
                color: selected === i ? '#60a5fa' : '#fff',
                cursor: 'pointer', transition: 'all .12s',
                transform: selected === i ? 'scale(1.1)' : 'scale(1)',
              }}>{n}</button>
            ))}
          </div>
          <div style={{ fontSize: 11, color: 'var(--t3)', textAlign: 'center' }}>Tryck ett tal, sedan ett annat för att byta!</div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <div style={{ fontWeight: 900, color: '#60a5fa', fontSize: 20 }}>🔀 {score}/{ROUNDS} ronder!</div>
          <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
