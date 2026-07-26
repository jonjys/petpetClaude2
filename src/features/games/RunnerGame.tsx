import { memo, useEffect, useRef, useState, useCallback } from 'react'
import styles from './GamesView.module.css'

interface Props { onExit: () => void; onWin: (coins: number, xp: number, score: number) => void }

const W = 320
const H = 200
const GROUND = 160
const GRAVITY = 0.6
const JUMP = -12
const SPEED_START = 4
const OBSTACLE_GAP = 220

export const RunnerGame = memo(function RunnerGame({ onExit, onWin }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [score, setScore] = useState(0)
  const [dead, setDead] = useState(false)
  const [started, setStarted] = useState(false)
  const gameRef = useRef({
    y: GROUND - 40, vy: 0, score: 0, speed: SPEED_START,
    obstacles: [] as { x: number; h: number }[],
    nextObs: OBSTACLE_GAP, alive: true, frame: 0,
  })
  const rafRef = useRef<number>()

  const jump = useCallback(() => {
    const g = gameRef.current
    if (!started) { setStarted(true); return }
    if (!g.alive) return
    if (g.y >= GROUND - 40) g.vy = JUMP
  }, [started])

  const loop = useCallback(() => {
    const g = gameRef.current
    const canvas = canvasRef.current
    if (!canvas || !g.alive) return
    const ctx = canvas.getContext('2d')!
    g.frame++
    g.speed = SPEED_START + Math.floor(g.score / 200) * 0.5

    // Physics
    g.vy += GRAVITY
    g.y += g.vy
    if (g.y >= GROUND - 40) { g.y = GROUND - 40; g.vy = 0 }

    // Obstacles
    g.nextObs -= g.speed
    if (g.nextObs <= 0) {
      const h = 25 + Math.random() * 30
      g.obstacles.push({ x: W + 20, h })
      g.nextObs = OBSTACLE_GAP + Math.random() * 80
    }
    g.obstacles = g.obstacles.filter(o => o.x > -40)
    g.obstacles.forEach(o => o.x -= g.speed)

    // Score
    g.score++
    if (g.frame % 6 === 0) setScore(g.score)

    // Collision
    const px = 50, pw = 32, ph = 36
    for (const o of g.obstacles) {
      if (px + pw - 6 > o.x && px < o.x + 20 && g.y + ph > GROUND - o.h) {
        g.alive = false
        setDead(true)
        const coins = Math.min(100, 5 + Math.floor(g.score / 50))
        const xp = Math.min(200, 10 + Math.floor(g.score / 25))
        onWin(coins, xp, g.score)
        return
      }
    }

    // Draw
    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = '#0a0a14'
    ctx.fillRect(0, 0, W, H)
    // Ground
    ctx.strokeStyle = 'rgba(168,85,247,0.3)'
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(0, GROUND); ctx.lineTo(W, GROUND); ctx.stroke()
    // Pet runner
    ctx.font = '32px serif'
    ctx.fillText('🐉', px - 4, g.y + ph - 4)
    // Obstacles
    ctx.fillStyle = '#f87171'
    g.obstacles.forEach(o => {
      ctx.fillRect(o.x, GROUND - o.h, 20, o.h)
    })
    // Score
    ctx.fillStyle = '#a855f7'
    ctx.font = 'bold 14px monospace'
    ctx.fillText(`${g.score}m`, 8, 20)

    rafRef.current = requestAnimationFrame(loop)
  }, [onWin])

  useEffect(() => {
    if (!started || dead) return
    rafRef.current = requestAnimationFrame(loop)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [started, dead, loop])

  useEffect(() => {
    // Draw waiting screen
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#0a0a14'; ctx.fillRect(0, 0, W, H)
    ctx.strokeStyle = 'rgba(168,85,247,0.3)'; ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(0, GROUND); ctx.lineTo(W, GROUND); ctx.stroke()
    ctx.font = '32px serif'; ctx.fillText('🐉', 46, GROUND - 8)
    ctx.fillStyle = '#888'; ctx.font = '14px sans-serif'; ctx.textAlign = 'center'
    ctx.fillText('Tryck för att starta!', W / 2, H / 2)
    ctx.textAlign = 'left'
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={() => { if (rafRef.current) cancelAnimationFrame(rafRef.current); onExit() }}>←</button>
        <span className={styles.gameTitle}>🏃 Runner</span>
        <span className={styles.scoreDisplay}>{score}m</span>
      </div>
      {dead && <div style={{ textAlign: 'center', color: '#f87171', fontWeight: 700, padding: '4px' }}>Game over! {score}m — Belöning tillagd!</div>}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '0 16px' }}>
        <canvas ref={canvasRef} width={W} height={H} onClick={jump}
          style={{ borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', maxWidth: '100%', cursor: 'pointer' }} />
      </div>
      <div style={{ textAlign: 'center', fontSize: 13, color: '#888', padding: '0 16px 8px' }}>
        {dead ? <button className="btn-primary" style={{ margin: '8px auto', display: 'block' }} onClick={onExit}>Tillbaka</button>
          : started ? 'Tryck/klicka för att hoppa!' : 'Tryck för att starta'}
      </div>
    </div>
  )
})
