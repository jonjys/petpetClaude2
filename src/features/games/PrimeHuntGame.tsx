import { memo, useState, useCallback, useRef, useEffect } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const ROUNDS = 15
const TIME_MS = 4500

function isPrime(n: number): boolean {
  if (n < 2) return false
  if (n === 2) return true
  if (n % 2 === 0) return false
  for (let i = 3; i <= Math.sqrt(n); i += 2) if (n % i === 0) return false
  return true
}

function getRound(r: number): { nums: number[]; primes: number[] } {
  const maxVal = 30 + r * 5
  const count = 6 + Math.min(r, 6)
  const nums = new Set<number>()
  while (nums.size < count) nums.add(Math.floor(Math.random() * (maxVal - 2)) + 2)
  const arr = Array.from(nums)
  return { nums: arr.sort(() => Math.random() - 0.5), primes: arr.filter(isPrime) }
}

export const PrimeHuntGame = memo(function PrimeHuntGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'play' | 'feedback' | 'done'>('ready')
  const [round, setRound] = useState(0)
  const [nums, setNums] = useState<number[]>([])
  const [primes, setPrimes] = useState<number[]>([])
  const [tapped, setTapped] = useState<Set<number>>(new Set())
  const [timeLeft, setTimeLeft] = useState(TIME_MS)
  const [score, setScore] = useState(0)
  const [wasCorrect, setWasCorrect] = useState(false)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_ph_best') ?? 0))
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
      const prev = Number(localStorage.getItem('k0509_ph_best') ?? 0)
      if (s > prev) localStorage.setItem('k0509_ph_best', String(s))
      onWin(s * 16, s * 50)
      setPhase('done')
      audio.achievement()
      return
    }
    const rd = getRound(r)
    setNums(rd.nums)
    setPrimes(rd.primes)
    setTapped(new Set())
    setRound(r)
    setTimeLeft(TIME_MS)
    startRef.current = Date.now()
    setPhase('play')
    intervalRef.current = setInterval(() => {
      setTimeLeft(Math.max(0, TIME_MS - (Date.now() - startRef.current)))
    }, 80)
    timerRef.current = setTimeout(() => {
      clearAll()
      setWasCorrect(false)
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

  const tap = useCallback((n: number) => {
    setTapped(prev => {
      const next = new Set(prev)
      if (next.has(n)) { next.delete(n); return next }
      next.add(n)
      if (next.size === primes.length && [...next].every(x => primes.includes(x))) {
        clearAll()
        scoreRef.current++
        setScore(scoreRef.current)
        setWasCorrect(true)
        setPhase('feedback')
        audio.coin()
        timerRef.current = setTimeout(() => nextRound(round + 1), 900)
      }
      return next
    })
  }, [primes, round, nextRound])

  const pct = (timeLeft / TIME_MS) * 100

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🔍 Primtalsjakten</span>
        <span className={styles.scoreDisplay}>{score}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🔍</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Primtalsjakten</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Tryck på alla primtal bland siffrorna! Siffrorna blir större och fler per runda. 15 ronder.
          </div>
          <div style={{ fontSize: 11, color: 'var(--t3)', background: 'rgba(255,255,255,.05)', borderRadius: 10, padding: '6px 14px' }}>Primtal: delbara bara med 1 och sig själva</div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}/{ROUNDS}</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'play' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ height: 6, background: 'rgba(255,255,255,.08)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: pct > 40 ? '#60a5fa' : pct > 15 ? '#fbbf24' : '#f87171', transition: 'width .08s linear' }} />
          </div>
          <div style={{ fontSize: 11, color: 'var(--t3)', textAlign: 'center' }}>
            Välj alla primtal! Hittade: {tapped.size} ({round + 1}/{ROUNDS})
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
            {nums.map((n, i) => {
              const sel = tapped.has(n)
              return (
                <button
                  key={i}
                  onClick={() => tap(n)}
                  style={{
                    width: 58, height: 58, borderRadius: 14,
                    fontFamily: 'var(--ff-head)', fontSize: 20, fontWeight: 900,
                    color: sel ? '#60a5fa' : '#fff',
                    background: sel ? 'rgba(96,165,250,.2)' : 'rgba(255,255,255,.08)',
                    border: sel ? '2px solid #60a5fa' : '2px solid rgba(255,255,255,.15)',
                    cursor: 'pointer', transition: 'all .1s',
                  }}
                >
                  {n}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {phase === 'feedback' && (
        <div style={{ padding: '32px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 52 }}>{wasCorrect ? '✅' : '❌'}</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: wasCorrect ? '#4ade80' : '#f87171' }}>
            {wasCorrect ? 'Rätt primtal!' : `Tid slut! Primtalen var: ${primes.join(', ')}`}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{score >= 12 ? '🏆' : score >= 8 ? '⭐' : '🔍'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{score} / {ROUNDS}</div>
          <div style={{ fontSize: 13, color: score >= 12 ? '#4ade80' : '#fbbf24' }}>
            {score >= 15 ? 'PERFEKT! 🏆' : score >= 12 ? 'Utmärkt! ⭐' : score >= 8 ? 'Bra! 👍' : 'Öva mer! 🔍'}
          </div>
          {score > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{score * 16}🪙 +{score * 50} XP</div>
          <button className="btn-primary" style={{ padding: '14px 32px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
