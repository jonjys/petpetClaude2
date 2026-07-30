import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const GAME_DURATION = 10

export const MultiTapGame = memo(function MultiTapGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [taps, setTaps] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_mt_best') ?? 0))
  const tapsRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([])
  const rippleId = useRef(0)

  const endGame = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    const t = tapsRef.current
    const prev = Number(localStorage.getItem('k0509_mt_best') ?? 0)
    if (t > prev) localStorage.setItem('k0509_mt_best', String(t))
    if (t > 0) onWin(Math.round(t * 0.8), Math.round(t * 3))
    setPhase('done')
  }, [onWin])

  const start = useCallback(() => {
    tapsRef.current = 0; setTaps(0); setTimeLeft(GAME_DURATION); setRipples([])
    setPhase('playing')
    timerRef.current = setInterval(() => {
      setTimeLeft(t => { if (t <= 1) { endGame(); return 0 } return t - 1 })
    }, 1000)
  }, [endGame])

  const handleTap = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (phase !== 'playing') return
    tapsRef.current++; setTaps(tapsRef.current)
    audio.tap()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    let x: number, y: number
    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left
      y = e.touches[0].clientY - rect.top
    } else {
      x = (e as React.MouseEvent).clientX - rect.left
      y = (e as React.MouseEvent).clientY - rect.top
    }
    const id = rippleId.current++
    setRipples(prev => [...prev, { id, x, y }])
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 500)
  }, [phase])

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  const tps = timeLeft < GAME_DURATION ? Math.round(taps / (GAME_DURATION - timeLeft + 0.1)) : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>👆 Multitap</span>
        <span className={styles.scoreDisplay}>{taps} tryck · {timeLeft}s</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>👆</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Multitap</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Tryck så många gånger du kan på 10 sekunder! Använd alla fingrar!
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore} tryck</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,.08)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(timeLeft / GAME_DURATION) * 100}%`, background: timeLeft <= 3 ? '#f87171' : '#4ade80', transition: 'width 1s linear' }} />
          </div>
          <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--t3)' }}>{tps}/s</div>
          <div
            onMouseDown={handleTap}
            onTouchStart={handleTap}
            style={{
              position: 'relative', height: 220,
              background: 'radial-gradient(ellipse at center, rgba(96,165,250,.12), rgba(96,165,250,.04))',
              borderRadius: 16, border: '2px solid rgba(96,165,250,.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', userSelect: 'none', overflow: 'hidden',
            }}
          >
            <div style={{ fontFamily: 'var(--ff-head)', fontSize: 56, fontWeight: 900, color: 'rgba(96,165,250,.6)', pointerEvents: 'none' }}>{taps}</div>
            {ripples.map(r => (
              <div key={r.id} style={{
                position: 'absolute', left: r.x - 20, top: r.y - 20, width: 40, height: 40,
                borderRadius: '50%', background: 'rgba(96,165,250,.4)',
                animation: 'ripple-out 0.5s ease-out forwards',
                pointerEvents: 'none',
              }} />
            ))}
          </div>
          <style>{`@keyframes ripple-out { from { transform: scale(0.3); opacity: 1; } to { transform: scale(3); opacity: 0; } }`}</style>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <div style={{ fontWeight: 900, color: '#60a5fa', fontSize: 20 }}>👆 {taps} tryck!</div>
          <div style={{ fontSize: 12, color: 'var(--t3)' }}>{Math.round(taps / GAME_DURATION * 10) / 10} tryck/sekund</div>
          <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
