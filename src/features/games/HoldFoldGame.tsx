import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const ROUNDS = 5
const TICK_MS = 600

export const HoldFoldGame = memo(function HoldFoldGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'round' | 'held' | 'exploded' | 'done'>('ready')
  const [round, setRound] = useState(1)
  const [current, setCurrent] = useState(100)
  const [multiplier, setMultiplier] = useState(1.2)
  const [score, setScore] = useState(0)
  const [roundBanked, setRoundBanked] = useState(0)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_hf_best') ?? 0))
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const bombRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const currentRef = useRef(100)
  const scoreRef = useRef(0)
  const roundRef = useRef(1)
  const heldRef = useRef(false)

  const startRound = useCallback((r: number) => {
    heldRef.current = false
    const rate = 1.1 + Math.random() * 0.4
    const bombSecs = 4 + Math.floor(Math.random() * 9)
    const base = 100
    currentRef.current = base
    setCurrent(base); setMultiplier(rate); roundRef.current = r; setRound(r)
    setPhase('round')

    tickRef.current = setInterval(() => {
      if (heldRef.current) return
      currentRef.current = Math.round(currentRef.current * rate)
      setCurrent(currentRef.current)
    }, TICK_MS)

    bombRef.current = setTimeout(() => {
      if (heldRef.current) return
      if (tickRef.current) clearInterval(tickRef.current)
      audio.tap()
      setPhase('exploded')
      setTimeout(() => {
        const nr = roundRef.current + 1
        if (nr > ROUNDS) {
          const s = scoreRef.current
          const prev = Number(localStorage.getItem('k0509_hf_best') ?? 0)
          if (s > prev) localStorage.setItem('k0509_hf_best', String(s))
          if (s > 0) onWin(Math.round(s / 15), s)
          setPhase('done')
        } else {
          startRound(nr)
        }
      }, 1200)
    }, bombSecs * 1000)
  }, [onWin])

  const hold = useCallback(() => {
    if (phase !== 'round' || heldRef.current) return
    heldRef.current = true
    if (tickRef.current) clearInterval(tickRef.current)
    if (bombRef.current) clearTimeout(bombRef.current)
    const banked = currentRef.current
    scoreRef.current += banked; setScore(scoreRef.current)
    setRoundBanked(banked)
    audio.coin()
    setPhase('held')
    setTimeout(() => {
      const nr = roundRef.current + 1
      if (nr > ROUNDS) {
        const s = scoreRef.current
        const prev = Number(localStorage.getItem('k0509_hf_best') ?? 0)
        if (s > prev) localStorage.setItem('k0509_hf_best', String(s))
        if (s > 0) onWin(Math.round(s / 15), s)
        setPhase('done')
      } else {
        startRound(nr)
      }
    }, 1000)
  }, [phase, startRound])

  const start = useCallback(() => {
    scoreRef.current = 0; setScore(0)
    startRound(1)
  }, [startRound])

  useEffect(() => () => {
    if (tickRef.current) clearInterval(tickRef.current)
    if (bombRef.current) clearTimeout(bombRef.current)
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>💣 Hold or Fold</span>
        <span className={styles.scoreDisplay}>{score}p · {round}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>💣</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Hold or Fold</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Värdet multipliceras varje sekund! Tryck HOLD för att ta hem ditt värde — men bomben kan explodera när som helst. 5 rundor.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}p</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {(phase === 'round' || phase === 'held' || phase === 'exploded') && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center' }}>
          <div style={{ fontSize: 12, color: 'var(--t3)' }}>×{multiplier.toFixed(2)} per {TICK_MS / 1000}s</div>
          <div style={{
            width: 160, height: 160, borderRadius: '50%',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: phase === 'exploded' ? 'rgba(248,113,113,.2)' : phase === 'held' ? 'rgba(74,222,128,.15)' : 'rgba(251,191,36,.12)',
            border: `4px solid ${phase === 'exploded' ? '#f87171' : phase === 'held' ? '#4ade80' : '#fbbf24'}`,
            transition: 'all .15s',
          }}>
            {phase === 'exploded' ? (
              <>
                <div style={{ fontSize: 40 }}>💥</div>
                <div style={{ fontSize: 13, color: '#f87171', fontWeight: 700 }}>BOOM!</div>
              </>
            ) : phase === 'held' ? (
              <>
                <div style={{ fontFamily: 'var(--ff-head)', fontSize: 34, fontWeight: 900, color: '#4ade80' }}>{roundBanked}</div>
                <div style={{ fontSize: 12, color: '#4ade80' }}>p bankat!</div>
              </>
            ) : (
              <>
                <div style={{ fontFamily: 'var(--ff-head)', fontSize: 40, fontWeight: 900, color: '#fbbf24' }}>{current}</div>
                <div style={{ fontSize: 11, color: 'var(--t3)' }}>p</div>
              </>
            )}
          </div>
          {phase === 'round' && (
            <button onClick={hold} style={{
              padding: '18px 50px', borderRadius: 20, fontSize: 20, fontWeight: 900,
              background: 'rgba(74,222,128,.2)', border: '3px solid #4ade80', color: '#4ade80',
              cursor: 'pointer', letterSpacing: 2,
            }}>HOLD!</button>
          )}
          <div style={{ fontSize: 12, color: 'var(--t3)' }}>Total: {score}p</div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <div style={{ fontWeight: 900, color: '#4ade80', fontSize: 20 }}>💣 {score}p!</div>
          <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
