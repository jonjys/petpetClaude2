import { memo, useEffect, useRef, useState, useCallback } from 'react'
import styles from './GamesView.module.css'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number, score: number) => void
  petEmoji?: string
  runnerBest?: number
}

const W = 320
const H = 200
const GROUND = 162
const GRAVITY = 0.6
const JUMP = -12
const SPEED_START = 4
const OBSTACLE_GAP = 220

type Star = { x: number; y: number; speed: number; r: number }

function makeStars(): Star[] {
  return Array.from({ length: 30 }, () => ({
    x: Math.random() * W,
    y: Math.random() * (GROUND - 10),
    speed: 0.3 + Math.random() * 0.8,
    r: 0.5 + Math.random() * 1.2,
  }))
}

export const RunnerGame = memo(function RunnerGame({ onExit, onWin, petEmoji = '🏃', runnerBest = 0 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [score, setScore] = useState(0)
  const [dead, setDead] = useState(false)
  const [started, setStarted] = useState(false)
  const [newRecord, setNewRecord] = useState(false)
  const petEmojiRef = useRef(petEmoji)
  const runnerBestRef = useRef(runnerBest)

  useEffect(() => { petEmojiRef.current = petEmoji }, [petEmoji])
  useEffect(() => { runnerBestRef.current = runnerBest }, [runnerBest])

  const gameRef = useRef({
    y: GROUND - 40, vy: 0, score: 0, speed: SPEED_START,
    obstacles: [] as { x: number; h: number; kind: number }[],
    nextObs: OBSTACLE_GAP, alive: true, frame: 0,
    stars: makeStars(),
    coins: [] as { x: number; y: number; collected: boolean }[],
    nextCoin: 160,
  })
  const rafRef = useRef<number>()

  const jump = useCallback(() => {
    const g = gameRef.current
    if (!started) { setStarted(true); return }
    if (!g.alive) return
    if (g.y >= GROUND - 42) g.vy = JUMP
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

    // Stars parallax
    g.stars.forEach(s => {
      s.x -= s.speed
      if (s.x < 0) { s.x = W; s.y = Math.random() * (GROUND - 10) }
    })

    // Obstacles
    g.nextObs -= g.speed
    if (g.nextObs <= 0) {
      const kind = Math.floor(Math.random() * 3) // 0=short, 1=tall, 2=floating
      const h = kind === 1 ? 50 : kind === 2 ? 22 : 28 + Math.random() * 20
      g.obstacles.push({ x: W + 20, h, kind })
      g.nextObs = OBSTACLE_GAP + Math.random() * 80
    }
    g.obstacles = g.obstacles.filter(o => o.x > -40)
    g.obstacles.forEach(o => o.x -= g.speed)

    // Floating coins
    g.nextCoin -= g.speed
    if (g.nextCoin <= 0) {
      const coinY = GROUND - 70 - Math.random() * 50
      g.coins.push({ x: W + 10, y: coinY, collected: false })
      g.nextCoin = 280 + Math.random() * 120
    }
    g.coins = g.coins.filter(c => c.x > -30)
    g.coins.forEach(c => { c.x -= g.speed })

    // Score
    g.score++
    if (g.frame % 6 === 0) setScore(g.score)

    // Collision — obstacles
    const px = 50, pw = 30, ph = 34
    for (const o of g.obstacles) {
      const oTop = o.kind === 2 ? GROUND - o.h - 40 : GROUND - o.h
      const oBot = GROUND
      if (px + pw - 6 > o.x && px < o.x + 18 && g.y + ph > oTop && g.y + 8 < oBot) {
        g.alive = false
        setDead(true)
        const coins = Math.min(100, 5 + Math.floor(g.score / 50))
        const xp = Math.min(200, 10 + Math.floor(g.score / 25))
        if (g.score > runnerBestRef.current) setNewRecord(true)
        onWin(coins, xp, g.score)
        return
      }
    }

    // Coin collect
    g.coins.forEach(c => {
      if (!c.collected && Math.abs(c.x - px) < 28 && Math.abs(c.y - (g.y + ph / 2)) < 28) {
        c.collected = true
      }
    })

    // ── Draw ──
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H)
    bgGrad.addColorStop(0, '#06060f')
    bgGrad.addColorStop(1, '#0d0d1e')
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, W, H)

    // Stars
    ctx.fillStyle = 'rgba(200,180,255,.7)'
    g.stars.forEach(s => {
      ctx.beginPath()
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
      ctx.fill()
    })

    // Ground neon line
    ctx.strokeStyle = 'rgba(168,85,247,0.5)'
    ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.moveTo(0, GROUND); ctx.lineTo(W, GROUND); ctx.stroke()
    // Ground glow
    ctx.strokeStyle = 'rgba(168,85,247,0.12)'
    ctx.lineWidth = 6
    ctx.beginPath(); ctx.moveTo(0, GROUND); ctx.lineTo(W, GROUND); ctx.stroke()

    // Coins (not collected)
    g.coins.forEach(c => {
      if (c.collected) return
      ctx.font = '14px serif'
      ctx.fillText('🪙', c.x - 7, c.y + 5)
    })

    // Obstacles
    g.obstacles.forEach(o => {
      const oTop = o.kind === 2 ? GROUND - o.h - 40 : GROUND - o.h
      const oH = o.kind === 2 ? o.h : o.h
      // Glow
      ctx.shadowColor = '#f87171'
      ctx.shadowBlur = 8
      ctx.fillStyle = o.kind === 1 ? '#dc2626' : o.kind === 2 ? '#fb923c' : '#f87171'
      ctx.fillRect(o.x, oTop, 18, oH)
      ctx.shadowBlur = 0
      // Top spike
      ctx.fillStyle = '#fca5a5'
      ctx.fillRect(o.x + 4, oTop - 4, 10, 4)
    })

    // Player pet emoji
    ctx.font = '32px serif'
    ctx.fillText(petEmojiRef.current, px - 4, g.y + ph - 2)

    // Score overlay
    ctx.fillStyle = 'rgba(168,85,247,0.85)'
    ctx.font = 'bold 13px monospace'
    ctx.textAlign = 'left'
    ctx.fillText(`${g.score}m`, 8, 18)
    if (runnerBestRef.current > 0) {
      ctx.fillStyle = 'rgba(255,204,0,.7)'
      ctx.font = '9px monospace'
      ctx.fillText(`REKORD ${runnerBestRef.current}m`, 8, 30)
    }

    rafRef.current = requestAnimationFrame(loop)
  }, [onWin])

  useEffect(() => {
    if (!started || dead) return
    rafRef.current = requestAnimationFrame(loop)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [started, dead, loop])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#06060f'; ctx.fillRect(0, 0, W, H)
    ctx.strokeStyle = 'rgba(168,85,247,0.4)'; ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.moveTo(0, GROUND); ctx.lineTo(W, GROUND); ctx.stroke()
    ctx.font = '32px serif'; ctx.fillText(petEmoji, 46, GROUND - 8)
    ctx.fillStyle = 'rgba(168,85,247,.8)'; ctx.font = '14px sans-serif'; ctx.textAlign = 'center'
    ctx.fillText('Tryck för att starta!', W / 2, H / 2 - 10)
    ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.font = '10px sans-serif'
    ctx.fillText('Hoppa över hinder · Samla mynt', W / 2, H / 2 + 10)
    ctx.textAlign = 'left'
  }, [petEmoji])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={() => { if (rafRef.current) cancelAnimationFrame(rafRef.current); onExit() }}>←</button>
        <span className={styles.gameTitle}>🏃 Runner</span>
        <span className={styles.scoreDisplay}>{score}m</span>
      </div>
      {dead && (
        <div style={{ textAlign: 'center', padding: '4px 0' }}>
          <span style={{ color: '#f87171', fontWeight: 700 }}>Game over! {score}m</span>
          {newRecord && <span style={{ color: 'var(--gold)', fontWeight: 900, marginLeft: 8 }}>🏆 NYTT REKORD!</span>}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '0 16px' }}>
        <canvas ref={canvasRef} width={W} height={H} onClick={jump}
          style={{ borderRadius: 12, border: '1px solid rgba(168,85,247,.25)', maxWidth: '100%', cursor: 'pointer' }} />
      </div>
      <div style={{ textAlign: 'center', fontSize: 12, color: '#888', padding: '0 16px 8px' }}>
        {dead
          ? <button className="btn-primary" style={{ margin: '8px auto', display: 'block' }} onClick={onExit}>Tillbaka</button>
          : started ? '↑ Tryck/klicka för att hoppa' : ''}
      </div>
    </div>
  )
})
