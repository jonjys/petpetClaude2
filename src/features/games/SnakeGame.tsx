import { memo, useEffect, useRef, useState, useCallback } from 'react'
import styles from './GamesView.module.css'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const CELL = 20
const COLS = 15
const ROWS = 18
const TICK = 120

type Dir = 'U' | 'D' | 'L' | 'R'
type Pt = { x: number; y: number }

function rand(max: number) { return Math.floor(Math.random() * max) }
function newFood(snake: Pt[]): Pt {
  let p: Pt
  do { p = { x: rand(COLS), y: rand(ROWS) } }
  while (snake.some(s => s.x === p.x && s.y === p.y))
  return p
}

export const SnakeGame = memo(function SnakeGame({ onExit, onWin }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef({
    snake: [{ x: 7, y: 9 }] as Pt[],
    dir: 'R' as Dir,
    nextDir: 'R' as Dir,
    food: { x: 12, y: 9 } as Pt,
    score: 0,
    alive: true,
  })
  const [score, setScore] = useState(0)
  const [dead, setDead] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const s = stateRef.current
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#0a0a14'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    // Food
    ctx.fillStyle = '#f87171'
    ctx.beginPath()
    ctx.arc(s.food.x * CELL + CELL / 2, s.food.y * CELL + CELL / 2, CELL / 2 - 2, 0, Math.PI * 2)
    ctx.fill()
    // Snake
    s.snake.forEach((seg, i) => {
      ctx.fillStyle = i === 0 ? '#a855f7' : '#7c3aed'
      ctx.beginPath()
      ctx.roundRect(seg.x * CELL + 1, seg.y * CELL + 1, CELL - 2, CELL - 2, 4)
      ctx.fill()
    })
  }, [])

  const tick = useCallback(() => {
    const s = stateRef.current
    if (!s.alive) return
    s.dir = s.nextDir
    const head = s.snake[0]
    const next: Pt = {
      x: (head.x + (s.dir === 'R' ? 1 : s.dir === 'L' ? -1 : 0) + COLS) % COLS,
      y: (head.y + (s.dir === 'D' ? 1 : s.dir === 'U' ? -1 : 0) + ROWS) % ROWS,
    }
    if (s.snake.some(seg => seg.x === next.x && seg.y === next.y)) {
      s.alive = false
      setDead(true)
      const coins = Math.min(50, 5 + s.score * 2)
      const xp = Math.min(100, 10 + s.score * 5)
      onWin(coins, xp)
      return
    }
    s.snake.unshift(next)
    if (next.x === s.food.x && next.y === s.food.y) {
      s.score++
      setScore(s.score)
      s.food = newFood(s.snake)
    } else {
      s.snake.pop()
    }
    draw()
  }, [draw, onWin])

  useEffect(() => {
    draw()
    intervalRef.current = setInterval(tick, TICK)
    const onKey = (e: KeyboardEvent) => {
      const s = stateRef.current
      if (e.key === 'ArrowUp' && s.dir !== 'D') s.nextDir = 'U'
      else if (e.key === 'ArrowDown' && s.dir !== 'U') s.nextDir = 'D'
      else if (e.key === 'ArrowLeft' && s.dir !== 'R') s.nextDir = 'L'
      else if (e.key === 'ArrowRight' && s.dir !== 'L') s.nextDir = 'R'
    }
    window.addEventListener('keydown', onKey)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      window.removeEventListener('keydown', onKey)
    }
  }, [draw, tick])

  const handleTouch = useCallback((dir: Dir) => {
    const s = stateRef.current
    if ((dir === 'U' && s.dir !== 'D') ||
        (dir === 'D' && s.dir !== 'U') ||
        (dir === 'L' && s.dir !== 'R') ||
        (dir === 'R' && s.dir !== 'L')) {
      s.nextDir = dir
    }
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🐍 Snake</span>
        <span className={styles.scoreDisplay}>🍎 {score}</span>
      </div>

      {dead && (
        <div style={{ textAlign: 'center', padding: '12px', color: '#f87171', fontWeight: 700 }}>
          Game over! Poäng: {score} — Belöning tillagd 🪙
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', padding: '0 16px' }}>
        <canvas ref={canvasRef} width={COLS * CELL} height={ROWS * CELL}
          style={{ borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', maxWidth: '100%' }} />
      </div>

      {/* D-pad */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: 16 }}>
        <button style={dpadBtn} onClick={() => handleTouch('U')}>▲</button>
        <div style={{ display: 'flex', gap: 4 }}>
          <button style={dpadBtn} onClick={() => handleTouch('L')}>◀</button>
          <div style={{ width: 52 }} />
          <button style={dpadBtn} onClick={() => handleTouch('R')}>▶</button>
        </div>
        <button style={dpadBtn} onClick={() => handleTouch('D')}>▼</button>
      </div>
    </div>
  )
})

const dpadBtn: React.CSSProperties = {
  width: 52, height: 52, borderRadius: 10, border: 'none',
  background: 'rgba(255,255,255,0.1)', color: '#e8e8f0', fontSize: 20, cursor: 'pointer',
}
