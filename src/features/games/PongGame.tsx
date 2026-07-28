import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const W = 320, H = 200, BALL = 8, PAD_H = 48, PAD_W = 8

export const PongGame = memo(function PongGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [playerScore, setPlayerScore] = useState(0)
  const [aiScore, setAiScore] = useState(0)
  const [ballPos, setBallPos] = useState({ x: W / 2, y: H / 2 })
  const [playerY, setPlayerY] = useState(H / 2 - PAD_H / 2)
  const [aiY, setAiY] = useState(H / 2 - PAD_H / 2)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_pong_best') ?? 0))

  const stateRef = useRef({
    ball: { x: W / 2, y: H / 2, vx: 3, vy: 2 },
    playerY: H / 2 - PAD_H / 2,
    aiY: H / 2 - PAD_H / 2,
    playerScore: 0, aiScore: 0, running: false,
  })
  const frameRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const start = useCallback(() => {
    stateRef.current = { ball: { x: W / 2, y: H / 2, vx: 3.5, vy: 2 }, playerY: H / 2 - PAD_H / 2, aiY: H / 2 - PAD_H / 2, playerScore: 0, aiScore: 0, running: true }
    setPlayerScore(0); setAiScore(0)
    setBallPos({ x: W / 2, y: H / 2 })
    setPlayerY(H / 2 - PAD_H / 2); setAiY(H / 2 - PAD_H / 2)
    setPhase('playing')
  }, [])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const relY = e.clientY - rect.top
    const py = Math.max(0, Math.min(H - PAD_H, relY - PAD_H / 2))
    stateRef.current.playerY = py
    setPlayerY(py)
  }, [])

  useEffect(() => {
    if (phase !== 'playing') return
    frameRef.current = setInterval(() => {
      const s = stateRef.current
      if (!s.running) return
      const b = s.ball

      // AI tracks ball
      const aiCenter = s.aiY + PAD_H / 2
      if (aiCenter < b.y - 4) s.aiY = Math.min(H - PAD_H, s.aiY + 3)
      else if (aiCenter > b.y + 4) s.aiY = Math.max(0, s.aiY - 3)

      b.x += b.vx; b.y += b.vy

      // Wall bounce
      if (b.y < BALL / 2) { b.y = BALL / 2; b.vy = Math.abs(b.vy) }
      if (b.y > H - BALL / 2) { b.y = H - BALL / 2; b.vy = -Math.abs(b.vy) }

      // Player paddle (left)
      if (b.x - BALL / 2 <= PAD_W + 4 && b.y >= s.playerY && b.y <= s.playerY + PAD_H) {
        b.vx = Math.abs(b.vx) * 1.05
        b.vy += (b.y - (s.playerY + PAD_H / 2)) * 0.1
        b.vx = Math.min(b.vx, 8)
        audio.tap()
      }
      // AI paddle (right)
      if (b.x + BALL / 2 >= W - PAD_W - 4 && b.y >= s.aiY && b.y <= s.aiY + PAD_H) {
        b.vx = -Math.abs(b.vx) * 1.02
        b.vx = Math.max(b.vx, -8)
        audio.tap()
      }

      // Score
      if (b.x < 0) {
        s.aiScore++
        setAiScore(s.aiScore)
        Object.assign(b, { x: W / 2, y: H / 2, vx: 3.5, vy: (Math.random() > 0.5 ? 1 : -1) * 2 })
        if (s.aiScore >= 7) { s.running = false; clearInterval(frameRef.current!); audio.click(); setPhase('done') }
      }
      if (b.x > W) {
        s.playerScore++
        setPlayerScore(s.playerScore)
        Object.assign(b, { x: W / 2, y: H / 2, vx: -3.5, vy: (Math.random() > 0.5 ? 1 : -1) * 2 })
        if (s.playerScore >= 7) {
          s.running = false; clearInterval(frameRef.current!)
          audio.achievement()
          const pts = s.playerScore * 50
          const prev = Number(localStorage.getItem('k0509_pong_best') ?? 0)
          if (pts > prev) localStorage.setItem('k0509_pong_best', String(pts))
          onWin(Math.round(pts / 5), pts); setPhase('done')
        }
      }

      setAiY(s.aiY)
      setBallPos({ x: b.x, y: b.y })
    }, 16)
    return () => clearInterval(frameRef.current!)
  }, [phase, onWin])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🏓 Pong</span>
        <span className={styles.scoreDisplay}>{playerScore} - {aiScore}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🏓</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Pong</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Rör musen/fingret för att styra racket!<br />Först till 7 poäng vinner.
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
            style={{ position: 'relative', width: W, height: H, background: 'rgba(0,10,20,.9)', border: '2px solid rgba(255,255,255,.1)', borderRadius: 12, overflow: 'hidden', touchAction: 'none', cursor: 'none', margin: '0 auto' }}
          >
            {/* Center line */}
            <div style={{ position: 'absolute', left: W/2 - 1, top: 0, bottom: 0, borderLeft: '2px dashed rgba(255,255,255,.1)' }} />
            {/* Player paddle */}
            <div style={{ position: 'absolute', left: 4, top: playerY, width: PAD_W, height: PAD_H, background: '#818cf8', borderRadius: 4 }} />
            {/* AI paddle */}
            <div style={{ position: 'absolute', right: 4, top: aiY, width: PAD_W, height: PAD_H, background: '#f87171', borderRadius: 4 }} />
            {/* Ball */}
            <div style={{ position: 'absolute', left: ballPos.x - BALL/2, top: ballPos.y - BALL/2, width: BALL, height: BALL, background: '#fff', borderRadius: '50%' }} />
            {/* Score */}
            <div style={{ position: 'absolute', top: 8, left: 0, right: 0, display: 'flex', justifyContent: 'space-around', fontSize: 20, fontFamily: 'var(--ff-head)', fontWeight: 900, color: 'rgba(255,255,255,.4)' }}>
              <span>{playerScore}</span><span>{aiScore}</span>
            </div>
          </div>
          {phase === 'done' && (
            <div style={{ textAlign: 'center', marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontWeight: 900, fontSize: 16, color: playerScore > aiScore ? '#4ade80' : '#f87171' }}>
                {playerScore > aiScore ? '🏆 Du vann!' : '😅 Datorn vann!'}
              </div>
              <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Spela igen!</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
})
