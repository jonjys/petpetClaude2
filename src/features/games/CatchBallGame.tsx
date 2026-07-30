import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const GAME_DURATION = 30
const BALL_R = 28
const TICK_MS = 40

export const CatchBallGame = memo(function CatchBallGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION)
  const [ballPos, setBallPos] = useState({ x: 150, y: 100 })
  const [flashing, setFlashing] = useState(false)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_cb_best') ?? 0))
  const containerRef = useRef<HTMLDivElement>(null)
  const posRef = useRef({ x: 150, y: 100, dx: 4, dy: 3 })
  const scoreRef = useRef(0)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const flashRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const start = useCallback(() => {
    scoreRef.current = 0; setScore(0)
    posRef.current = { x: 150, y: 100, dx: 4, dy: 3 }
    setBallPos({ x: 150, y: 100 })
    setTimeLeft(GAME_DURATION)
    setPhase('playing')

    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          if (tickRef.current) clearInterval(tickRef.current)
          const s = scoreRef.current
          const prev = Number(localStorage.getItem('k0509_cb_best') ?? 0)
          if (s > prev) localStorage.setItem('k0509_cb_best', String(s))
          if (s > 0) onWin(Math.round(s * 3), s * 10)
          setPhase('done')
          return 0
        }
        return t - 1
      })
    }, 1000)

    tickRef.current = setInterval(() => {
      const cw = containerRef.current?.clientWidth ?? 320
      const ch = containerRef.current?.clientHeight ?? 220
      let { x, y, dx, dy } = posRef.current
      const speed = 1 + scoreRef.current * 0.08
      x += dx * speed; y += dy * speed
      if (x <= BALL_R) { x = BALL_R; dx = Math.abs(dx) }
      if (x >= cw - BALL_R) { x = cw - BALL_R; dx = -Math.abs(dx) }
      if (y <= BALL_R) { y = BALL_R; dy = Math.abs(dy) }
      if (y >= ch - BALL_R) { y = ch - BALL_R; dy = -Math.abs(dy) }
      posRef.current = { x, y, dx, dy }
      setBallPos({ x, y })
    }, TICK_MS)
  }, [onWin])

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (phase !== 'playing') return
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const cx = e.clientX - rect.left
    const cy = e.clientY - rect.top
    const { x, y } = posRef.current
    const dist = Math.sqrt((cx - x) ** 2 + (cy - y) ** 2)
    if (dist <= BALL_R + 8) {
      audio.coin()
      scoreRef.current++; setScore(scoreRef.current)
      setFlashing(true)
      if (flashRef.current) clearTimeout(flashRef.current)
      flashRef.current = setTimeout(() => setFlashing(false), 120)
      posRef.current.dx = (Math.random() > 0.5 ? 1 : -1) * (3 + Math.random() * 3)
      posRef.current.dy = (Math.random() > 0.5 ? 1 : -1) * (2 + Math.random() * 3)
    }
  }, [phase])

  useEffect(() => () => {
    if (tickRef.current) clearInterval(tickRef.current)
    if (timerRef.current) clearInterval(timerRef.current)
    if (flashRef.current) clearTimeout(flashRef.current)
  }, [])

  const timerPct = (timeLeft / GAME_DURATION) * 100

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>⚽ Fånga Bollen</span>
        <span className={styles.scoreDisplay}>{score}p · {timeLeft}s</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>⚽</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Fånga Bollen</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Tryck på bollen när den studsar runt! Bollen snabbas upp för varje träff. 30 sekunder.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}p</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,.08)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${timerPct}%`, background: timerPct <= 33 ? '#f87171' : '#60a5fa', transition: 'width 1s linear' }} />
          </div>
          <div
            ref={containerRef}
            onClick={handleClick}
            style={{
              position: 'relative', height: 220,
              background: 'rgba(255,255,255,.04)', borderRadius: 16,
              border: '1px solid rgba(255,255,255,.1)', overflow: 'hidden',
              cursor: 'crosshair', userSelect: 'none',
            }}
          >
            <div style={{
              position: 'absolute',
              left: ballPos.x - BALL_R, top: ballPos.y - BALL_R,
              width: BALL_R * 2, height: BALL_R * 2, borderRadius: '50%',
              background: flashing ? 'rgba(74,222,128,.8)' : 'rgba(96,165,250,.85)',
              border: `3px solid ${flashing ? '#4ade80' : '#60a5fa'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, pointerEvents: 'none',
              boxShadow: flashing ? '0 0 20px #4ade80' : '0 0 12px rgba(96,165,250,.5)',
              transition: 'background .08s, border-color .08s',
            }}>⚽</div>
          </div>
          <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--t3)' }}>
            Hastighet: ×{(1 + score * 0.08).toFixed(2)}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <div style={{ fontWeight: 900, color: '#4ade80', fontSize: 20 }}>⚽ {score} träffar!</div>
          <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
