import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const ROUNDS = 15
const ROUND_TIME = 4

function makePair(): { a: [number, number]; b: [number, number]; correct: 'a' | 'b' } {
  let an: number, ad: number, bn: number, bd: number
  do {
    ad = 2 + Math.floor(Math.random() * 9)
    an = 1 + Math.floor(Math.random() * (ad - 1))
    bd = 2 + Math.floor(Math.random() * 9)
    bn = 1 + Math.floor(Math.random() * (bd - 1))
  } while (an / ad === bn / bd)
  const correct: 'a' | 'b' = an / ad >= bn / bd ? 'a' : 'b'
  return { a: [an, ad], b: [bn, bd], correct }
}

export const FractionGame = memo(function FractionGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [round, setRound] = useState(1)
  const [roundKey, setRoundKey] = useState(0)
  const [pair, setPair] = useState<ReturnType<typeof makePair> | null>(null)
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME)
  const [picked, setPicked] = useState<'a' | 'b' | null>(null)
  const [score, setScore] = useState(0)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_frac_best') ?? 0))
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const scoreRef = useRef(0)
  const roundRef = useRef(1)
  const correctRef = useRef<'a' | 'b'>('a')

  const loadRound = useCallback((r: number) => {
    const p = makePair()
    setPair(p); correctRef.current = p.correct
    setPicked(null); roundRef.current = r; setRound(r); setTimeLeft(ROUND_TIME)
    setRoundKey(k => k + 1)
  }, [])

  const start = useCallback(() => {
    scoreRef.current = 0; setScore(0); roundRef.current = 1
    loadRound(1); setPhase('playing')
  }, [loadRound])

  useEffect(() => {
    if (phase !== 'playing') return
    timerRef.current = setInterval(() => setTimeLeft(t => {
      if (t <= 1) {
        if (timerRef.current) clearInterval(timerRef.current)
        if (roundRef.current >= ROUNDS) {
          const s = scoreRef.current
          const prev = Number(localStorage.getItem('k0509_frac_best') ?? 0)
          if (s > prev) localStorage.setItem('k0509_frac_best', String(s))
          if (s > 0) onWin(Math.round(s / 7), s)
          setPhase('done')
        } else {
          loadRound(roundRef.current + 1)
        }
        return 0
      }
      return t - 1
    }), 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase, roundKey, onWin, loadRound])

  const pick = useCallback((choice: 'a' | 'b') => {
    if (phase !== 'playing' || picked !== null) return
    if (timerRef.current) clearInterval(timerRef.current)
    setPicked(choice)
    const correct = choice === correctRef.current
    if (correct) {
      audio.tap()
      const bonus = Math.max(0, timeLeft - 1) * 5
      scoreRef.current += 20 + bonus; setScore(s => s + 20 + bonus)
    } else { audio.tap() }
    if (roundRef.current >= ROUNDS) {
      setTimeout(() => {
        const s = scoreRef.current
        const prev = Number(localStorage.getItem('k0509_frac_best') ?? 0)
        if (s > prev) localStorage.setItem('k0509_frac_best', String(s))
        if (s > 0) onWin(Math.round(s / 7), s)
        setPhase('done')
      }, 600)
    } else {
      setTimeout(() => loadRound(roundRef.current + 1), 600)
    }
  }, [phase, picked, timeLeft, onWin, loadRound])

  const timerPct = (timeLeft / ROUND_TIME) * 100

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>➗ Bråkduellen</span>
        <span className={styles.scoreDisplay}>{score}p · {round}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>➗</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Bråkduellen</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Vilket bråk är störst? Tryck snabbt! 15 frågor, 4 sekunder per fråga. +20p + tidbonus.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}p</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && pair && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,.08)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${timerPct}%`, background: timerPct <= 50 ? '#f87171' : '#60a5fa', transition: 'width 1s linear' }} />
          </div>
          <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--t3)' }}>Vilket bråk är STÖRST?</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {(['a', 'b'] as const).map(choice => {
              const [n, d] = choice === 'a' ? pair.a : pair.b
              const isCorrect = choice === pair.correct
              const isPicked = picked === choice
              return (
                <button key={choice} onClick={() => pick(choice)} disabled={picked !== null} style={{
                  padding: '28px 16px', borderRadius: 20, cursor: picked !== null ? 'default' : 'pointer',
                  background: picked !== null
                    ? isCorrect ? 'rgba(74,222,128,.2)' : isPicked ? 'rgba(248,113,113,.2)' : 'rgba(255,255,255,.04)'
                    : 'rgba(255,255,255,.07)',
                  border: `3px solid ${picked !== null
                    ? isCorrect ? '#4ade80' : isPicked ? '#f87171' : 'rgba(255,255,255,.08)'
                    : 'rgba(255,255,255,.15)'}`,
                  transition: 'all .15s',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                }}>
                  <div style={{ fontSize: 28, fontWeight: 900, color: picked !== null ? (isCorrect ? '#4ade80' : isPicked ? '#f87171' : 'var(--t3)') : '#fff', borderBottom: '3px solid currentColor', paddingBottom: 4, minWidth: 40, textAlign: 'center' }}>{n}</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: picked !== null ? (isCorrect ? '#4ade80' : isPicked ? '#f87171' : 'var(--t3)') : '#fff', paddingTop: 4 }}>{d}</div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <div style={{ fontWeight: 900, color: '#4ade80', fontSize: 20 }}>➗ {score}p!</div>
          <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
