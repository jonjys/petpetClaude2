import { memo, useState, useCallback, useRef, useEffect } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const ROUNDS = 10

function getTarget(round: number): { min: number; max: number } {
  const width = Math.max(8, 30 - round * 2)
  const center = 20 + Math.floor(Math.random() * 61)
  return { min: Math.max(5, center - width / 2), max: Math.min(95, center + width / 2) }
}

export const PressMeterGame = memo(function PressMeterGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(0)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [target, setTarget] = useState({ min: 35, max: 65 })
  const [meterVal, setMeterVal] = useState(0)
  const [holding, setHolding] = useState(false)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_pm_best') ?? 0))
  const holdRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pendingRef = useRef(false)
  const meterRef = useRef(0)

  const nextRound = useCallback((r: number) => {
    setRound(r); setTarget(getTarget(r)); setMeterVal(0); setFeedback(null); setHolding(false)
    meterRef.current = 0; pendingRef.current = false
  }, [])

  const start = useCallback(() => {
    setScore(0); setLevel(0); setPhase('playing'); nextRound(0)
  }, [nextRound])

  useEffect(() => () => { if (holdRef.current) clearInterval(holdRef.current) }, [])

  const handlePressStart = useCallback(() => {
    if (feedback !== null || pendingRef.current) return
    setHolding(true)
    holdRef.current = setInterval(() => {
      const newVal = Math.min(100, meterRef.current + 1.8)
      meterRef.current = newVal
      setMeterVal(newVal)
      if (newVal >= 100) {
        if (holdRef.current) clearInterval(holdRef.current)
        handleRelease(newVal)
      }
    }, 30)
  }, [feedback])

  const handleRelease = useCallback((val?: number) => {
    if (holdRef.current) clearInterval(holdRef.current)
    setHolding(false)
    if (pendingRef.current) return
    pendingRef.current = true
    const v = val ?? meterRef.current
    const t = target
    const inZone = v >= t.min && v <= t.max
    const center = (t.min + t.max) / 2
    const diff = Math.abs(v - center)
    const pts = inZone ? Math.round(100 * (1 - diff / ((t.max - t.min) / 2))) : 0
    const newScore = score + pts
    const newLevel = inZone ? level + 1 : 0
    setLevel(newLevel)
    setFeedback(inZone
      ? `🎯 ${Math.round(v)}% — зона! +${pts}p ${newLevel >= 3 ? `🔥×${newLevel}` : ''}`
      : `❌ ${Math.round(v)}% — utanför zonen! +0p`)
    audio[inZone ? 'coin' : 'tap']()
    setTimeout(() => {
      const nr = round + 1
      if (nr >= ROUNDS) {
        const prev = Number(localStorage.getItem('k0509_pm_best') ?? 0)
        if (newScore > prev) localStorage.setItem('k0509_pm_best', String(newScore))
        if (newScore > 0) onWin(Math.round(newScore / 8), newScore)
        setScore(newScore); setLevel(newLevel); setPhase('done')
      } else {
        setScore(newScore); setLevel(newLevel); nextRound(nr)
      }
    }, 1100)
  }, [target, score, level, round, nextRound, onWin])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>⚡ Kraftmätare</span>
        <span className={styles.scoreDisplay}>{score}p · {round}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>⚡</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Kraftmätare</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Håll in knappen — släpp när mätaren är i den gröna zonen! Zonen krymper varje runda.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}p</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--t3)' }}>
            Runda {round + 1}/{ROUNDS} — {Math.round(target.max - target.min)}% bred zon
          </div>

          {/* Meter */}
          <div style={{ position: 'relative', height: 280, background: 'rgba(0,0,0,.4)', border: '2px solid rgba(255,255,255,.1)', borderRadius: 16, overflow: 'hidden' }}>
            {/* target zone */}
            <div style={{
              position: 'absolute', bottom: `${target.min}%`, left: 0, right: 0,
              height: `${target.max - target.min}%`,
              background: 'rgba(74,222,128,.25)', borderTop: '2px solid #4ade80', borderBottom: '2px solid #4ade80',
            }} />
            {/* fill */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              height: `${meterVal}%`,
              background: `linear-gradient(0deg, ${meterVal >= target.min && meterVal <= target.max ? '#4ade80' : '#60a5fa'}, rgba(96,165,250,.3))`,
              transition: holding ? 'none' : 'height .1s',
            }} />
            {/* value label */}
            <div style={{ position: 'absolute', bottom: `${Math.min(meterVal + 2, 90)}%`, left: 0, right: 0, textAlign: 'center', fontSize: 20, fontWeight: 900, color: '#fff', transition: holding ? 'none' : 'bottom .1s' }}>
              {Math.round(meterVal)}%
            </div>
            {/* zone label */}
            <div style={{ position: 'absolute', bottom: `${(target.min + target.max) / 2}%`, left: 0, right: 0, transform: 'translateY(50%)', textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#4ade80' }}>
              ← STON →
            </div>
          </div>

          {feedback
            ? <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: feedback.startsWith('🎯') ? '#4ade80' : '#f87171' }}>{feedback}</div>
            : (
              <button
                className="btn-primary"
                style={{ padding: '20px', fontSize: 18, fontWeight: 900, userSelect: 'none' }}
                onMouseDown={handlePressStart}
                onMouseUp={() => handleRelease()}
                onMouseLeave={() => { if (holding) handleRelease() }}
                onTouchStart={e => { e.preventDefault(); handlePressStart() }}
                onTouchEnd={e => { e.preventDefault(); handleRelease() }}
              >
                {holding ? '⚡ HÅLL...' : '⬤ HÅLL IN'}
              </button>
            )
          }
          {level >= 3 && <div style={{ textAlign: 'center', fontSize: 12, color: '#fbbf24', fontWeight: 700 }}>🔥 COMBO ×{level}!</div>}
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <div style={{ fontWeight: 900, color: '#4ade80', fontSize: 20 }}>⚡ {score}p / {ROUNDS * 100}!</div>
          <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
