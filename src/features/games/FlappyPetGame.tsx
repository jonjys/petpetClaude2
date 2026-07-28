import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
  petEmoji: string
}

const GRAVITY = 0.35
const FLAP_VY = -5.5
const PIPE_W = 12
const GAP = 28
const PIPE_SPEED = 2.2
const W = 100, H = 100

type Pipe = { x: number; gapY: number }

export const FlappyPetGame = memo(function FlappyPetGame({ onExit, onWin, petEmoji }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'dead'>('ready')
  const [birdY, setBirdY] = useState(50)
  const [pipes, setPipes] = useState<Pipe[]>([])
  const [score, setScore] = useState(0)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_flappy_best') ?? 0))
  const stateRef = useRef({ birdY: 50, vy: 0, pipes: [] as Pipe[], score: 0, frame: 0 })
  const frameRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const flap = useCallback(() => {
    if (stateRef.current) stateRef.current.vy = FLAP_VY
    audio.tap()
  }, [])

  const start = useCallback(() => {
    stateRef.current = { birdY: 50, vy: 0, pipes: [], score: 0, frame: 0 }
    setBirdY(50); setPipes([]); setScore(0)
    setPhase('playing')
  }, [])

  useEffect(() => {
    if (phase !== 'playing') return
    const onKey = (e: KeyboardEvent) => { if (e.code === 'Space') flap() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, flap])

  useEffect(() => {
    if (phase !== 'playing') return
    frameRef.current = setInterval(() => {
      const s = stateRef.current
      s.frame++
      s.vy += GRAVITY
      s.birdY += s.vy
      setBirdY(s.birdY)

      // Generate pipes
      if (s.frame % 60 === 0) {
        const gapY = 20 + Math.random() * 45
        s.pipes.push({ x: W + 5, gapY })
      }

      // Move pipes
      s.pipes = s.pipes.map(p => ({ ...p, x: p.x - PIPE_SPEED }))

      // Score: passed a pipe
      s.pipes.forEach(p => {
        if (Math.abs(p.x - 18) < PIPE_SPEED) { s.score++; setScore(s.score); audio.coin() }
      })

      // Remove off-screen
      s.pipes = s.pipes.filter(p => p.x > -PIPE_W)
      setPipes([...s.pipes])

      // Bird collisions
      const bx = 18, by = s.birdY
      if (by < 3 || by > H - 3) {
        handleDeath(s.score)
        return
      }
      for (const p of s.pipes) {
        if (bx + 3 > p.x && bx - 3 < p.x + PIPE_W) {
          if (by - 3 < p.gapY - GAP / 2 || by + 3 > p.gapY + GAP / 2) {
            handleDeath(s.score)
            return
          }
        }
      }
    }, 33)
    return () => clearInterval(frameRef.current!)
  }, [phase])

  function handleDeath(sc: number) {
    clearInterval(frameRef.current!)
    const prev = Number(localStorage.getItem('k0509_flappy_best') ?? 0)
    if (sc > prev) localStorage.setItem('k0509_flappy_best', String(sc))
    const coins = sc * 10 + (sc >= 10 ? 50 : 0)
    const xp = sc * 15
    onWin(coins, xp)
    audio.achievement()
    setPhase('dead')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🪶 Flappy Pet</span>
        <span className={styles.scoreDisplay}>{score} rör</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>{petEmoji}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Flappy Pet</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Tryck/klicka/mellanslag för att flyga!<br />Undvik rören · +10🪙 per rör
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore} rör</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && (
        <div style={{ padding: '0 14px' }}>
          <div
            onPointerDown={flap}
            style={{ position: 'relative', height: 280, background: 'linear-gradient(180deg, #0f172a 0%, #1e3a5f 100%)', border: '2px solid rgba(99,102,241,.3)', borderRadius: 12, overflow: 'hidden', touchAction: 'none', cursor: 'pointer', userSelect: 'none' }}
          >
            {/* Ground */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 12, background: 'rgba(74,222,128,.3)', borderTop: '2px solid rgba(74,222,128,.5)' }} />

            {/* Pipes */}
            {pipes.map((p, i) => (
              <div key={i}>
                <div style={{ position: 'absolute', left: `${p.x}%`, top: 0, width: `${PIPE_W}%`, height: `${(p.gapY - GAP / 2) * (280 / H)}px`, background: 'rgba(74,222,128,.7)', border: '1px solid rgba(74,222,128,.9)', borderRadius: '0 0 4px 4px' }} />
                <div style={{ position: 'absolute', left: `${p.x}%`, bottom: 12, width: `${PIPE_W}%`, height: `${(H - p.gapY - GAP / 2) * (280 / H)}px`, background: 'rgba(74,222,128,.7)', border: '1px solid rgba(74,222,128,.9)', borderRadius: '4px 4px 0 0' }} />
              </div>
            ))}

            {/* Bird */}
            <div style={{ position: 'absolute', left: '18%', top: `${(birdY / H) * 100}%`, transform: 'translate(-50%, -50%)', fontSize: 22, filter: 'drop-shadow(0 0 4px rgba(255,255,255,.4))' }}>
              {petEmoji}
            </div>

            {/* Score */}
            <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,.8)' }}>{score}</div>
          </div>
          <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--t3)', marginTop: 6 }}>Tryck för att flyga • Mellanslag fungerar också</div>
        </div>
      )}

      {phase === 'dead' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{score >= 10 ? '🏆' : score >= 5 ? '⭐' : '💀'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{score} rör!</div>
          <div style={{ fontSize: 14, color: score >= 10 ? '#4ade80' : '#fbbf24' }}>
            {score >= 10 ? 'Flygproffs! 🏆' : score >= 5 ? 'Bra flykter! ⭐' : 'Öva mer! 🪶'}
          </div>
          {score > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{score * 10 + (score >= 10 ? 50 : 0)}🪙 +{score * 15} XP</div>
          <button className="btn-primary" style={{ padding: '12px 28px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
