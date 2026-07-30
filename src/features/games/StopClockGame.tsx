import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const ROUNDS = 10
const MAX_TIME = 5.0

function makeTarget(): number {
  return Math.round((0.5 + Math.random() * 4.0) * 100) / 100
}

export const StopClockGame = memo(function StopClockGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'counting' | 'result' | 'done'>('ready')
  const [round, setRound] = useState(1)
  const [target, setTarget] = useState(2.50)
  const [elapsed, setElapsed] = useState(0)
  const [stopped, setStopped] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_stk_best') ?? 0))
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startRef = useRef(0)
  const scoreRef = useRef(0)
  const roundRef = useRef(1)

  const loadRound = useCallback((r: number) => {
    setTarget(makeTarget()); setStopped(null); setElapsed(0)
    roundRef.current = r; setRound(r)
    setPhase('counting')
    startRef.current = Date.now()
    timerRef.current = setInterval(() => {
      const e = Math.min((Date.now() - startRef.current) / 1000, MAX_TIME)
      setElapsed(e)
      if (e >= MAX_TIME) {
        if (timerRef.current) clearInterval(timerRef.current)
      }
    }, 16)
  }, [])

  const start = useCallback(() => {
    scoreRef.current = 0; setScore(0); roundRef.current = 1
    loadRound(1)
  }, [loadRound])

  const stopClock = useCallback(() => {
    if (phase !== 'counting') return
    if (timerRef.current) clearInterval(timerRef.current)
    const e = Math.min((Date.now() - startRef.current) / 1000, MAX_TIME)
    setElapsed(e); setStopped(e)
    setPhase('result')
    const diff = Math.abs(e - target)
    const pts = Math.max(0, Math.round(100 - diff * 200))
    scoreRef.current += pts; setScore(s => s + pts)
    if (pts > 50) audio.coin(); else audio.tap()
    if (roundRef.current >= ROUNDS) {
      setTimeout(() => {
        const s = scoreRef.current
        const prev = Number(localStorage.getItem('k0509_stk_best') ?? 0)
        if (s > prev) localStorage.setItem('k0509_stk_best', String(s))
        if (s > 0) onWin(Math.round(s / 8), s)
        setPhase('done')
      }, 1200)
    } else {
      setTimeout(() => loadRound(roundRef.current + 1), 1200)
    }
  }, [phase, target, onWin, loadRound])

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  const barPct = (elapsed / MAX_TIME) * 100

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>⏱️ Stoppur</span>
        <span className={styles.scoreDisplay}>{score}p · {round}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>⏱️</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Stoppur</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Stoppa klockan exakt vid måltiden! 10 runder. Ju exaktare desto mer poäng (max 100p/rund).
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}p</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {(phase === 'counting' || phase === 'result') && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center' }}>
          <div style={{ fontSize: 13, color: 'var(--t3)' }}>Stoppa vid:</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 42, fontWeight: 900, color: '#fbbf24' }}>{target.toFixed(2)}s</div>
          <div style={{ width: '100%', height: 16, borderRadius: 8, background: 'rgba(255,255,255,.08)', overflow: 'hidden', position: 'relative' }}>
            <div style={{ height: '100%', width: `${barPct}%`, background: phase === 'result' ? (Math.abs(elapsed - target) < 0.15 ? '#4ade80' : Math.abs(elapsed - target) < 0.4 ? '#fbbf24' : '#f87171') : '#60a5fa', transition: phase === 'counting' ? 'none' : 'background .2s', borderRadius: 8 }} />
            <div style={{ position: 'absolute', left: `${(target / MAX_TIME) * 100}%`, top: 0, bottom: 0, width: 3, background: '#fbbf24', transform: 'translateX(-50%)' }} />
          </div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 28, fontWeight: 900, color: '#fff' }}>{elapsed.toFixed(2)}s</div>
          {phase === 'result' && stopped !== null && (
            <div style={{ fontSize: 13, fontWeight: 700, color: Math.abs(stopped - target) < 0.15 ? '#4ade80' : Math.abs(stopped - target) < 0.4 ? '#fbbf24' : '#f87171' }}>
              Diff: {Math.abs(stopped - target).toFixed(2)}s → +{Math.max(0, Math.round(100 - Math.abs(stopped - target) * 200))}p
            </div>
          )}
          {phase === 'counting' && (
            <button onClick={stopClock} style={{ padding: '18px 40px', borderRadius: 16, fontSize: 20, fontWeight: 900, background: 'rgba(248,113,113,.2)', border: '2px solid #f87171', color: '#f87171', cursor: 'pointer' }}>STOPP!</button>
          )}
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <div style={{ fontWeight: 900, color: '#4ade80', fontSize: 20 }}>⏱️ {score}p!</div>
          <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
