import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

type Brick = { x: number; y: number; alive: boolean; pts: number; color: string }
type Ball = { x: number; y: number; vx: number; vy: number }

const W = 100, H = 120
const PADDLE_W = 20, PADDLE_H = 3, BALL_R = 2
const ROWS = 5, COLS = 8

function makeBricks(): Brick[] {
  const colors = ['#f87171','#fb923c','#fbbf24','#4ade80','#60a5fa']
  const bricks: Brick[] = []
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      bricks.push({
        x: 3 + c * 12,
        y: 8 + r * 7,
        alive: true,
        pts: (ROWS - r) * 10,
        color: colors[r],
      })
    }
  }
  return bricks
}

export const BrickBreakerGame = memo(function BrickBreakerGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [ball, setBall] = useState<Ball>({ x: 50, y: 90, vx: 0, vy: 0 })
  const [paddleX, setPaddleX] = useState(40)
  const [bricks, setBricks] = useState<Brick[]>([])
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_bb_best') ?? 0))
  const frameRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const stateRef = useRef({
    ball: { x: 50, y: 90, vx: 2, vy: -3 },
    paddleX: 40,
    bricks: [] as Brick[],
    lives: 3,
    score: 0,
    active: false,
  })
  const areaRef = useRef<HTMLDivElement | null>(null)

  const start = useCallback(() => {
    const b = makeBricks()
    stateRef.current = { ball: { x: 50, y: 90, vx: 2, vy: -3 }, paddleX: 40, bricks: b, lives: 3, score: 0, active: true }
    setBricks(b); setBall({ x: 50, y: 90, vx: 2, vy: -3 }); setPaddleX(40); setLives(3); setScore(0)
    setPhase('playing')
  }, [])

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = ((e.clientX - rect.left) / rect.width) * 100
    const px = Math.max(PADDLE_W / 2, Math.min(100 - PADDLE_W / 2, pct))
    stateRef.current.paddleX = px
    setPaddleX(px)
  }, [])

  useEffect(() => {
    if (phase !== 'playing') return
    frameRef.current = setInterval(() => {
      const s = stateRef.current
      if (!s.active) return
      let { x, y, vx, vy } = s.ball

      x += vx; y += vy

      // Wall collisions
      if (x - BALL_R < 0) { x = BALL_R; vx = Math.abs(vx) }
      if (x + BALL_R > W) { x = W - BALL_R; vx = -Math.abs(vx) }
      if (y - BALL_R < 0) { y = BALL_R; vy = Math.abs(vy) }

      // Paddle collision
      const py = H - 10
      if (y + BALL_R >= py && y + BALL_R <= py + PADDLE_H && x >= s.paddleX - PADDLE_W / 2 && x <= s.paddleX + PADDLE_W / 2) {
        vy = -Math.abs(vy)
        vx += ((x - s.paddleX) / (PADDLE_W / 2)) * 1.5
        audio.click()
      }

      // Brick collisions
      let hitBrick = false
      const newBricks = s.bricks.map(b => {
        if (!b.alive || hitBrick) return b
        if (x + BALL_R > b.x && x - BALL_R < b.x + 11 && y + BALL_R > b.y && y - BALL_R < b.y + 5) {
          hitBrick = true
          s.score += b.pts; setScore(s.score)
          audio.coin()
          return { ...b, alive: false }
        }
        return b
      })
      if (hitBrick) { s.bricks = newBricks; setBricks([...newBricks]); vy = -vy }

      // Ball lost
      if (y > H + 5) {
        s.lives--; setLives(s.lives)
        if (s.lives <= 0) {
          s.active = false
          clearInterval(frameRef.current!)
          const prev = Number(localStorage.getItem('k0509_bb_best') ?? 0)
          if (s.score > prev) localStorage.setItem('k0509_bb_best', String(s.score))
          onWin(Math.round(s.score / 10), Math.round(s.score / 5))
          audio.achievement()
          setPhase('done')
          return
        }
        x = 50; y = 90; vx = 2; vy = -3
      }

      // All bricks cleared
      if (newBricks.every(b => !b.alive)) {
        s.active = false
        clearInterval(frameRef.current!)
        s.score += 500; setScore(s.score)
        const prev = Number(localStorage.getItem('k0509_bb_best') ?? 0)
        if (s.score > prev) localStorage.setItem('k0509_bb_best', String(s.score))
        onWin(Math.round(s.score / 10), Math.round(s.score / 5))
        audio.achievement()
        setPhase('done')
        return
      }

      s.ball = { x, y, vx, vy }
      setBall({ x, y, vx, vy })
    }, 33)
    return () => clearInterval(frameRef.current!)
  }, [phase, onWin])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🧱 Brickbreaker</span>
        <span className={styles.scoreDisplay}>{score} · ❤️×{lives}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🧱</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Brickbreaker</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Rör fingret/musen för att styra!<br />3 liv · Slå alla block för bonus
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}p</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && (
        <div style={{ padding: '0 14px' }}>
          <div
            ref={areaRef}
            onPointerMove={handlePointerMove}
            style={{ position: 'relative', height: 240, background: 'rgba(0,0,20,.6)', border: '2px solid rgba(99,102,241,.3)', borderRadius: 12, overflow: 'hidden', touchAction: 'none', cursor: 'none' }}
          >
            {bricks.map((b, i) => b.alive && (
              <div key={i} style={{ position: 'absolute', left: `${b.x}%`, top: `${b.y}%`, width: '11%', height: '4.5%', background: b.color, borderRadius: 3, boxShadow: `0 0 4px ${b.color}60` }} />
            ))}
            <div style={{ position: 'absolute', left: `${ball.x}%`, top: `${ball.y}%`, width: `${BALL_R * 2}%`, height: `${BALL_R * 2 * (100 / 120)}%`, borderRadius: '50%', background: '#e8e8f0', transform: 'translate(-50%,-50%)', boxShadow: '0 0 6px rgba(255,255,255,.8)' }} />
            <div style={{ position: 'absolute', bottom: '8%', left: `${paddleX}%`, transform: 'translateX(-50%)', width: `${PADDLE_W}%`, height: '2.5%', background: 'rgba(129,140,248,.9)', borderRadius: 3, boxShadow: '0 0 8px rgba(129,140,248,.6)' }} />
          </div>
          <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--t3)', marginTop: 6 }}>Rör musen/fingret ovan för att styra</div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{score >= 1000 ? '🏆' : score >= 500 ? '⭐' : '🧱'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{score} poäng</div>
          <div style={{ fontSize: 14, color: score >= 1000 ? '#4ade80' : '#fbbf24' }}>
            {score >= 1000 ? 'Brickmästare! 🏆' : score >= 500 ? 'Riktigt bra! ⭐' : 'Öva mer! 🧱'}
          </div>
          {score > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{Math.round(score / 10)}🪙 +{Math.round(score / 5)} XP</div>
          <button className="btn-primary" style={{ padding: '12px 28px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
