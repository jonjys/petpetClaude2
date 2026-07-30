import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const ROUNDS = 10
const START_FROM = 20

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export const SpeedCountdownGame = memo(function SpeedCountdownGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [round, setRound] = useState(1)
  const [numbers, setNumbers] = useState<number[]>([])
  const [next, setNext] = useState(START_FROM)
  const [timeLeft, setTimeLeft] = useState(15)
  const [score, setScore] = useState(0)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_scd_best') ?? 0))
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const scoreRef = useRef(0)
  const roundRef = useRef(1)
  const nextRef = useRef(START_FROM)

  const startRound = useCallback((r: number) => {
    const nums = Array.from({ length: START_FROM }, (_, i) => i + 1)
    setNumbers(shuffle(nums))
    setNext(START_FROM)
    nextRef.current = START_FROM
    setTimeLeft(15)
    roundRef.current = r
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!)
          const nr = roundRef.current + 1
          if (nr > ROUNDS) {
            const s = scoreRef.current
            const prev = Number(localStorage.getItem('k0509_scd_best') ?? 0)
            if (s > prev) localStorage.setItem('k0509_scd_best', String(s))
            if (s > 0) onWin(Math.round(s * 5), s * 30)
            setPhase('done')
          } else {
            setRound(nr)
            startRound(nr)
          }
          return 0
        }
        return t - 1
      })
    }, 1000)
  }, [onWin])

  const start = useCallback(() => {
    scoreRef.current = 0; setScore(0); setRound(1); setPhase('playing')
    startRound(1)
  }, [startRound])

  const tap = useCallback((val: number) => {
    if (nextRef.current !== val) { audio.tap(); return }
    audio.coin()
    const newNext = val - 1
    nextRef.current = newNext
    setNext(newNext)
    setNumbers(prev => prev.filter(n => n !== val))
    if (newNext === 0) {
      if (timerRef.current) clearInterval(timerRef.current)
      scoreRef.current++; setScore(scoreRef.current)
      const nr = roundRef.current + 1
      if (nr > ROUNDS) {
        const s = scoreRef.current
        const prev = Number(localStorage.getItem('k0509_scd_best') ?? 0)
        if (s > prev) localStorage.setItem('k0509_scd_best', String(s))
        if (s > 0) onWin(Math.round(s * 5), s * 30)
        setPhase('done')
      } else {
        audio.achievement()
        setRound(nr)
        startRound(nr)
      }
    }
  }, [startRound, onWin])

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>⏳ Räkna Ner</span>
        <span className={styles.scoreDisplay}>{score}/{ROUNDS} · {timeLeft}s</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>⏳</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Räkna Ner</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Tryck siffrorna från 20 ner till 1 i ordning — så snabbt som möjligt! 10 ronder, 15 sek var.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}/{ROUNDS} ronder</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,.08)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(timeLeft / 15) * 100}%`, background: timeLeft <= 4 ? '#f87171' : '#fbbf24', transition: 'width 1s linear' }} />
          </div>
          <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--t3)', fontWeight: 700 }}>
            Nästa: <span style={{ color: '#fbbf24', fontSize: 18 }}>{next}</span> &nbsp;|&nbsp; Rond {round}/{ROUNDS}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
            {numbers.map(n => (
              <button key={n} onClick={() => tap(n)} style={{
                padding: '14px 0', borderRadius: 10,
                fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900,
                background: n === next ? 'rgba(251,191,36,.25)' : 'rgba(255,255,255,.07)',
                border: `2px solid ${n === next ? '#fbbf24' : 'rgba(255,255,255,.1)'}`,
                color: n === next ? '#fbbf24' : '#fff',
                cursor: 'pointer', transition: 'all .1s',
              }}>{n}</button>
            ))}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <div style={{ fontWeight: 900, color: '#fbbf24', fontSize: 20 }}>⏳ {score}/{ROUNDS} ronder!</div>
          <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
