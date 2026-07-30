import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const W = 300
const H = 240
const PLAYER_R = 10
const OBSTACLE_W = 18

interface Obstacle {
  id: number
  x: number
  y: number
  speed: number
  color: string
}

const COLORS = ['#f87171','#fbbf24','#c084fc','#f97316']

export const NeonDodgeGame = memo(function NeonDodgeGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [timeLeft, setTimeLeft] = useState(30)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_nd_best') ?? 0))
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef({
    px: W / 2, py: H - 30,
    obstacles: [] as Obstacle[],
    alive: true, survived: 0,
  })
  const idRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const spawnRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const rafRef = useRef<number>(0)
  const touchRef = useRef({ x: W / 2 })

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const s = stateRef.current
    ctx.fillStyle = '#0a0a1a'
    ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = '#4ade80'
    ctx.shadowBlur = 12; ctx.shadowColor = '#4ade80'
    ctx.beginPath(); ctx.arc(s.px, s.py, PLAYER_R, 0, Math.PI * 2); ctx.fill()
    ctx.shadowBlur = 0
    for (const o of s.obstacles) {
      ctx.fillStyle = o.color
      ctx.shadowBlur = 8; ctx.shadowColor = o.color
      ctx.fillRect(o.x - OBSTACLE_W / 2, o.y - OBSTACLE_W / 2, OBSTACLE_W, OBSTACLE_W)
      ctx.shadowBlur = 0
    }
  }, [])

  const endGame = useCallback((survived: number) => {
    stateRef.current.alive = false
    cancelAnimationFrame(rafRef.current)
    if (timerRef.current) clearInterval(timerRef.current)
    if (spawnRef.current) clearInterval(spawnRef.current)
    const prev = Number(localStorage.getItem('k0509_nd_best') ?? 0)
    if (survived > prev) localStorage.setItem('k0509_nd_best', String(survived))
    if (survived > 0) onWin(Math.round(survived * 2), survived * 8)
    setPhase('done')
  }, [onWin])

  const loop = useCallback(() => {
    const s = stateRef.current
    if (!s.alive) return
    for (const o of s.obstacles) { o.y += o.speed }
    s.obstacles = s.obstacles.filter(o => o.y < H + 20)
    const px = s.px, py = s.py
    for (const o of s.obstacles) {
      const dx = px - o.x, dy = py - o.y
      if (Math.sqrt(dx * dx + dy * dy) < PLAYER_R + OBSTACLE_W / 2 - 2) {
        audio.tap(); endGame(s.survived); return
      }
    }
    draw()
    rafRef.current = requestAnimationFrame(loop)
  }, [draw, endGame])

  const start = useCallback(() => {
    const s = stateRef.current
    s.px = W / 2; s.py = H - 30; s.obstacles = []; s.alive = true; s.survived = 0
    setTimeLeft(30); setPhase('playing')
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        s.survived = 30 - t + 1
        if (t <= 1) { endGame(30); return 0 }
        return t - 1
      })
    }, 1000)
    spawnRef.current = setInterval(() => {
      s.obstacles.push({ id: idRef.current++, x: 20 + Math.random() * (W - 40), y: -10, speed: 2.5 + Math.random() * 2, color: COLORS[Math.floor(Math.random() * COLORS.length)] })
    }, 600)
    rafRef.current = requestAnimationFrame(loop)
  }, [loop, endGame])

  const handleMove = useCallback((clientX: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const scale = W / rect.width
    stateRef.current.px = Math.max(PLAYER_R, Math.min(W - PLAYER_R, (clientX - rect.left) * scale))
  }, [])

  useEffect(() => () => { stateRef.current.alive = false; cancelAnimationFrame(rafRef.current); if (timerRef.current) clearInterval(timerRef.current); if (spawnRef.current) clearInterval(spawnRef.current) }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>💚 Neon Dodge</span>
        <span className={styles.scoreDisplay}>{timeLeft}s kvar</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>💚</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Neon Dodge</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Undvik fallande neonblock! Rör fingret för att styra den gröna pricken. Klara 30 sekunder!
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}s</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && (
        <div style={{ padding: '0 14px', alignItems: 'center', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,.08)', overflow: 'hidden', width: '100%' }}>
            <div style={{ height: '100%', width: `${(timeLeft / 30) * 100}%`, background: timeLeft <= 8 ? '#f87171' : '#4ade80', transition: 'width 1s linear' }} />
          </div>
          <canvas
            ref={canvasRef}
            width={W} height={H}
            style={{ borderRadius: 12, border: '1px solid rgba(255,255,255,.08)', touchAction: 'none', maxWidth: '100%' }}
            onTouchMove={e => { e.preventDefault(); handleMove(e.touches[0].clientX) }}
            onMouseMove={e => handleMove(e.clientX)}
          />
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <div style={{ fontWeight: 900, color: '#4ade80', fontSize: 20 }}>💚 {stateRef.current.survived}s överlev!</div>
          <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
