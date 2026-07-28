import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const GAME_DURATION = 10

export const SpeedTapGame = memo(function SpeedTapGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [taps, setTaps] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION)
  const [lastTap, setLastTap] = useState(0)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_sptap_best') ?? 0))
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const tapsRef = useRef(0)
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([])
  const rippleId = useRef(0)

  const start = useCallback(() => {
    tapsRef.current = 0; setTaps(0); setTimeLeft(GAME_DURATION); setLastTap(0)
    setPhase('playing')
  }, [])

  useEffect(() => {
    if (phase !== 'playing') return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!)
          const finalTaps = tapsRef.current
          const prev = Number(localStorage.getItem('k0509_sptap_best') ?? 0)
          if (finalTaps > prev) localStorage.setItem('k0509_sptap_best', String(finalTaps))
          const pts = finalTaps * 10
          onWin(Math.round(pts / 5), pts)
          audio.achievement(); setPhase('done')
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current!)
  }, [phase, onWin])

  const handleTap = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (phase !== 'playing') return
    tapsRef.current++
    setTaps(tapsRef.current)
    setLastTap(Date.now())
    audio.tap()
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const id = rippleId.current++
    setRipples(prev => [...prev.slice(-8), { id, x, y }])
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 500)
  }, [phase])

  const tph = taps > 0 ? (taps / (GAME_DURATION - timeLeft || 1)).toFixed(1) : '0'
  const timerColor = timeLeft > 5 ? '#4ade80' : timeLeft > 2 ? '#fbbf24' : '#f87171'
  const intensity = Math.min(taps / 50, 1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>👆 Speed Tap</span>
        <span className={styles.scoreDisplay}>{taps} tryckningar</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>👆</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Speed Tap</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Tryck så många gånger som möjligt på 10 sekunder!<br />Rekord: {bestScore > 0 ? `${bestScore} tryckningar` : 'Inga ännu'}
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore} tryckningar</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontFamily: 'var(--ff-head)', fontSize: 28, fontWeight: 900, color: timerColor }}>{timeLeft}s</div>
            <div style={{ fontSize: 12, color: 'var(--t3)' }}>{tph} /s</div>
            <div style={{ fontFamily: 'var(--ff-head)', fontSize: 28, fontWeight: 900, color: '#818cf8' }}>{taps}</div>
          </div>
          <div style={{ height: 4, background: 'rgba(255,255,255,.08)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(timeLeft / GAME_DURATION) * 100}%`, background: timerColor, transition: 'width 1s linear' }} />
          </div>
          <div
            onPointerDown={handleTap}
            style={{ position: 'relative', height: 200, borderRadius: 16, background: `rgba(${Math.round(129 + intensity * 40)},${Math.round(140 - intensity * 30)},248,${0.1 + intensity * 0.2})`, border: `2px solid rgba(129,140,248,${0.2 + intensity * 0.3})`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', userSelect: 'none', overflow: 'hidden', touchAction: 'none' }}
          >
            <div style={{ textAlign: 'center', pointerEvents: 'none' }}>
              <div style={{ fontSize: 52, transform: `scale(${1 + intensity * 0.2})`, transition: 'transform .1s' }}>👆</div>
              <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#818cf8', marginTop: 8 }}>TRYCK!</div>
            </div>
            {ripples.map(r => (
              <div key={r.id} style={{ position: 'absolute', left: r.x - 20, top: r.y - 20, width: 40, height: 40, borderRadius: '50%', border: '2px solid rgba(129,140,248,.6)', animation: 'none', pointerEvents: 'none', opacity: 0.6 }} />
            ))}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{taps >= bestScore && taps > 0 ? '🏆' : '👆'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 28, fontWeight: 900, color: '#818cf8' }}>{taps}</div>
          <div style={{ fontSize: 14, color: '#e8e8f0' }}>tryckningar på {GAME_DURATION} sekunder</div>
          <div style={{ fontSize: 12, color: 'var(--t3)' }}>{(taps / GAME_DURATION).toFixed(1)} tryckningar/sekund</div>
          {taps >= bestScore && taps > 0 && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{Math.round(taps * 2)}🪙 +{taps * 10} XP</div>
          <button className="btn-primary" style={{ padding: '12px 28px' }} onClick={start}>Försök igen!</button>
        </div>
      )}
    </div>
  )
})
