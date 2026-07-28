import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const W = 300, H = 180, BALL_R = 10, PAD_W = 80, PAD_H = 10

export const BalanceBallGame = memo(function BalanceBallGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [ballPos, setBallPos] = useState({ x: W / 2, y: H / 2 - 20 })
  const [padX, setPadX] = useState(W / 2)
  const [score, setScore] = useState(0)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_bal_best') ?? 0))

  const stateRef = useRef({ ball: { x: W / 2, y: H / 2 - 20, vx: 1.5, vy: 0 }, padX: W / 2, score: 0, running: false })
  const frameRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const start = useCallback(() => {
    stateRef.current = { ball: { x: W / 2, y: H / 2 - 20, vx: 1.5, vy: 0 }, padX: W / 2, score: 0, running: true }
    setBallPos({ x: W / 2, y: H / 2 - 20 }); setPadX(W / 2); setScore(0)
    setPhase('playing')
  }, [])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const px = Math.max(PAD_W / 2, Math.min(W - PAD_W / 2, e.clientX - rect.left))
    stateRef.current.padX = px
    setPadX(px)
  }, [])

  useEffect(() => {
    if (phase !== 'playing') return
    frameRef.current = setInterval(() => {
      const s = stateRef.current
      if (!s.running) return
      const b = s.ball

      b.vy += 0.3
      b.x += b.vx; b.y += b.vy

      // Wall bounces
      if (b.x - BALL_R < 0) { b.x = BALL_R; b.vx = Math.abs(b.vx) }
      if (b.x + BALL_R > W) { b.x = W - BALL_R; b.vx = -Math.abs(b.vx) }

      // Paddle collision
      const padY = H - PAD_H - 8
      if (b.y + BALL_R >= padY && b.y + BALL_R <= padY + PAD_H + 4 && b.x >= s.padX - PAD_W / 2 && b.x <= s.padX + PAD_W / 2) {
        b.vy = -Math.abs(b.vy) * 0.95 - 2
        b.vx += (b.x - s.padX) * 0.08
        b.vx = Math.max(-5, Math.min(5, b.vx))
        s.score++
        setScore(s.score)
        audio.tap()
      }

      // Ceiling bounce
      if (b.y - BALL_R < 0) { b.y = BALL_R; b.vy = Math.abs(b.vy) }

      // Fell off
      if (b.y > H + 20) {
        s.running = false
        clearInterval(frameRef.current!)
        const pts = s.score * 30
        const prev = Number(localStorage.getItem('k0509_bal_best') ?? 0)
        if (pts > prev) localStorage.setItem('k0509_bal_best', String(pts))
        if (pts > 0) { audio.achievement(); onWin(Math.round(pts / 5), pts) } else audio.click()
        setPhase('done')
      }

      setBallPos({ x: b.x, y: b.y })
    }, 16)
    return () => clearInterval(frameRef.current!)
  }, [phase, onWin])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>⚖️ Balans</span>
        <span className={styles.scoreDisplay}>{score} studsar</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>⚖️</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Balans</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Rör musen/fingret för att flytta racket!<br />Håll bollen i luften så länge som möjligt.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}p</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {(phase === 'playing' || phase === 'done') && (
        <div style={{ padding: '0 14px' }}>
          <div
            ref={containerRef}
            onPointerMove={handlePointerMove}
            style={{ position: 'relative', width: W, height: H, background: 'rgba(0,10,20,.85)', border: '2px solid rgba(255,255,255,.1)', borderRadius: 12, overflow: 'hidden', touchAction: 'none', cursor: 'none', margin: '0 auto' }}
          >
            {/* Ball */}
            <div style={{ position: 'absolute', left: ballPos.x - BALL_R, top: ballPos.y - BALL_R, width: BALL_R * 2, height: BALL_R * 2, background: '#818cf8', borderRadius: '50%', boxShadow: '0 0 8px rgba(129,140,248,.6)' }} />
            {/* Paddle */}
            <div style={{ position: 'absolute', bottom: 8, left: padX - PAD_W / 2, width: PAD_W, height: PAD_H, background: '#4ade80', borderRadius: 6, boxShadow: '0 0 8px rgba(74,222,128,.4)' }} />
            {/* Score */}
            <div style={{ position: 'absolute', top: 8, left: 0, right: 0, textAlign: 'center', fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: 'rgba(255,255,255,.3)' }}>{score}</div>
            {phase === 'done' && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.4)', fontSize: 16, fontWeight: 900, color: '#f87171' }}>💥 Tappat!</div>
            )}
          </div>
          <div style={{ textAlign: 'center', marginTop: 8, fontSize: 11, color: 'var(--t3)' }}>Rör musen/fingret</div>
          {phase === 'done' && (
            <div style={{ textAlign: 'center', marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#fbbf24' }}>{score} studsar · +{score * 6}🪙</div>
              <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Försök igen!</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
})
