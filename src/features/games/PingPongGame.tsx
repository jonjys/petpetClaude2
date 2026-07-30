import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const W = 320
const H = 220
const PADDLE_H = 50
const PADDLE_W = 10
const BALL_R = 8
const CPU_SPEED = 2.8

export const PingPongGame = memo(function PingPongGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [score, setScore] = useState(0)
  const [cpuScore, setCpuScore] = useState(0)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_pp2_best') ?? 0))
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef({
    ballX: W / 2, ballY: H / 2,
    vx: 3.5, vy: 2.5,
    playerY: H / 2 - PADDLE_H / 2,
    cpuY: H / 2 - PADDLE_H / 2,
    score: 0, cpuScore: 0,
    running: false,
  })
  const rafRef = useRef<number>(0)
  const scoreRef = useRef(0)
  const cpuScoreRef = useRef(0)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const s = stateRef.current
    ctx.fillStyle = '#0f0f1a'
    ctx.fillRect(0, 0, W, H)
    ctx.setLineDash([6, 6])
    ctx.strokeStyle = 'rgba(255,255,255,.1)'
    ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = '#60a5fa'
    ctx.fillRect(8, s.playerY, PADDLE_W, PADDLE_H)
    ctx.fillStyle = '#f87171'
    ctx.fillRect(W - 8 - PADDLE_W, s.cpuY, PADDLE_W, PADDLE_H)
    ctx.fillStyle = '#fff'
    ctx.beginPath(); ctx.arc(s.ballX, s.ballY, BALL_R, 0, Math.PI * 2); ctx.fill()
  }, [])

  const loop = useCallback(() => {
    const s = stateRef.current
    if (!s.running) return
    s.ballX += s.vx; s.ballY += s.vy
    if (s.ballY - BALL_R < 0) { s.ballY = BALL_R; s.vy = Math.abs(s.vy) }
    if (s.ballY + BALL_R > H) { s.ballY = H - BALL_R; s.vy = -Math.abs(s.vy) }
    if (s.ballX - BALL_R < 8 + PADDLE_W && s.ballY > s.playerY && s.ballY < s.playerY + PADDLE_H) {
      s.ballX = 8 + PADDLE_W + BALL_R; s.vx = Math.abs(s.vx) * 1.04; audio.tap()
    }
    if (s.ballX + BALL_R > W - 8 - PADDLE_W && s.ballY > s.cpuY && s.ballY < s.cpuY + PADDLE_H) {
      s.ballX = W - 8 - PADDLE_W - BALL_R; s.vx = -Math.abs(s.vx) * 1.02; audio.tap()
    }
    const cpuCenter = s.cpuY + PADDLE_H / 2
    if (cpuCenter < s.ballY - 4) s.cpuY = Math.min(H - PADDLE_H, s.cpuY + CPU_SPEED)
    else if (cpuCenter > s.ballY + 4) s.cpuY = Math.max(0, s.cpuY - CPU_SPEED)
    if (s.ballX < 0) {
      s.cpuScore++; cpuScoreRef.current = s.cpuScore; setCpuScore(s.cpuScore)
      if (s.cpuScore >= 7) { s.running = false; audio.tap(); const sc = s.score; const prev = Number(localStorage.getItem('k0509_pp2_best') ?? 0); if (sc > prev) localStorage.setItem('k0509_pp2_best', String(sc)); if (sc > 0) onWin(Math.round(sc * 20), sc * 60); setPhase('done'); return }
      s.ballX = W / 2; s.ballY = H / 2; s.vx = -3.5; s.vy = (Math.random() - 0.5) * 5
    }
    if (s.ballX > W) {
      s.score++; scoreRef.current = s.score; setScore(s.score); audio.coin()
      if (s.score >= 7) { s.running = false; audio.achievement(); const sc = s.score; const prev = Number(localStorage.getItem('k0509_pp2_best') ?? 0); if (sc > prev) localStorage.setItem('k0509_pp2_best', String(sc)); onWin(Math.round(sc * 20), sc * 60); setPhase('done'); return }
      s.ballX = W / 2; s.ballY = H / 2; s.vx = 3.5; s.vy = (Math.random() - 0.5) * 5
    }
    draw()
    rafRef.current = requestAnimationFrame(loop)
  }, [draw, onWin])

  const start = useCallback(() => {
    const s = stateRef.current
    s.ballX = W / 2; s.ballY = H / 2; s.vx = 3.5; s.vy = 2.5
    s.playerY = H / 2 - PADDLE_H / 2; s.cpuY = H / 2 - PADDLE_H / 2
    s.score = 0; s.cpuScore = 0; s.running = true
    scoreRef.current = 0; cpuScoreRef.current = 0
    setScore(0); setCpuScore(0); setPhase('playing')
    rafRef.current = requestAnimationFrame(loop)
  }, [loop])

  const handleMove = useCallback((clientY: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const relY = clientY - rect.top
    stateRef.current.playerY = Math.max(0, Math.min(H - PADDLE_H, relY - PADDLE_H / 2))
  }, [])

  useEffect(() => () => { stateRef.current.running = false; cancelAnimationFrame(rafRef.current) }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🏓 Pingis</span>
        <span className={styles.scoreDisplay}>{score} – {cpuScore}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🏓</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Pingis</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Dra fingret upp/ner på vänster sida för att styra racket! Vinn 7 poäng!
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}p vunna</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
          <div style={{ fontSize: 11, color: 'var(--t3)' }}>Du (blå) vs Dator (röd) — bäst av 7</div>
          <canvas
            ref={canvasRef}
            width={W} height={H}
            style={{ borderRadius: 12, border: '1px solid rgba(255,255,255,.1)', touchAction: 'none', maxWidth: '100%' }}
            onTouchMove={e => { e.preventDefault(); handleMove(e.touches[0].clientY) }}
            onMouseMove={e => handleMove(e.clientY)}
          />
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <div style={{ fontWeight: 900, color: score > cpuScore ? '#4ade80' : '#f87171', fontSize: 20 }}>
            {score > cpuScore ? '🏓 Du vann!' : '🏓 Dator vann!'} {score}–{cpuScore}
          </div>
          <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
