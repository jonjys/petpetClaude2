import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const BUMPERS = [
  { id: 1, x: 25, y: 20, label: '🔴', pts: 100 },
  { id: 2, x: 50, y: 15, label: '🟡', pts: 150 },
  { id: 3, x: 75, y: 20, label: '🔵', pts: 100 },
  { id: 4, x: 35, y: 40, label: '🟢', pts: 200 },
  { id: 5, x: 65, y: 40, label: '🟣', pts: 200 },
  { id: 6, x: 50, y: 55, label: '🔶', pts: 500 },
]

type Ball = { x: number; y: number; vx: number; vy: number }

export const PinballGame = memo(function PinballGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [score, setScore] = useState(0)
  const [balls, setBalls] = useState(3)
  const [flipL, setFlipL] = useState(false)
  const [flipR, setFlipR] = useState(false)
  const [ball, setBall] = useState<Ball>({ x: 50, y: 80, vx: 0, vy: 0 })
  const [activeBumper, setActiveBumper] = useState<number | null>(null)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_pb_best') ?? 0))
  const frameRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const stateRef = useRef({ ball: { x: 50, y: 80, vx: 0, vy: 0 }, balls: 3, score: 0, flipL: false, flipR: false, active: false })

  const launch = useCallback(() => {
    stateRef.current.ball = { x: 50, y: 85, vx: (Math.random() - 0.5) * 2, vy: -4 }
    stateRef.current.active = true
  }, [])

  const start = useCallback(() => {
    stateRef.current = { ball: { x: 50, y: 85, vx: 0, vy: 0 }, balls: 3, score: 0, flipL: false, flipR: false, active: false }
    setBall({ x: 50, y: 85, vx: 0, vy: 0 }); setBalls(3); setScore(0); setActiveBumper(null)
    setPhase('playing')
  }, [])

  useEffect(() => {
    if (phase !== 'playing') return
    frameRef.current = setInterval(() => {
      const s = stateRef.current
      if (!s.active) return
      let { x, y, vx, vy } = s.ball
      vy += 0.12
      x += vx; y += vy
      if (x < 2) { x = 2; vx = Math.abs(vx) * 0.8 }
      if (x > 98) { x = 98; vx = -Math.abs(vx) * 0.8 }
      if (y < 2) { y = 2; vy = Math.abs(vy) * 0.8 }
      // Flippers
      if (y > 88) {
        if (x < 40 && s.flipL) { vy = -Math.abs(vy) * 1.1; vx += 1; audio.click() }
        else if (x > 60 && s.flipR) { vy = -Math.abs(vy) * 1.1; vx -= 1; audio.click() }
        else if (y > 95) {
          s.active = false; s.balls--
          setBalls(s.balls)
          if (s.balls <= 0) {
            clearInterval(frameRef.current!)
            setPhase('done')
            const prev = Number(localStorage.getItem('k0509_pb_best') ?? 0)
            if (s.score > prev) localStorage.setItem('k0509_pb_best', String(s.score))
            onWin(Math.round(s.score / 50), Math.round(s.score / 30))
            audio.achievement()
          } else {
            setTimeout(() => { stateRef.current.ball = { x: 50, y: 85, vx: 0, vy: 0 }; setBall({ x: 50, y: 85, vx: 0, vy: 0 }) }, 500)
          }
          return
        }
      }
      // Bumper collisions
      let hitBumper: typeof BUMPERS[0] | null = null
      for (const b of BUMPERS) {
        const dx = x - b.x, dy = y - b.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 8) {
          const nx = dx / dist, ny = dy / dist
          vx = nx * 4; vy = ny * 4
          hitBumper = b
          break
        }
      }
      if (hitBumper) {
        s.score += hitBumper.pts; setScore(s.score)
        setActiveBumper(hitBumper.id); setTimeout(() => setActiveBumper(null), 200)
        audio.coin()
      }
      // Cap velocity
      const speed = Math.sqrt(vx * vx + vy * vy)
      if (speed > 6) { vx = (vx / speed) * 6; vy = (vy / speed) * 6 }
      s.ball = { x, y, vx, vy }
      setBall({ x, y, vx, vy })
    }, 33)
    return () => clearInterval(frameRef.current!)
  }, [phase, onWin])

  const handleFlipL = useCallback((down: boolean) => { stateRef.current.flipL = down; setFlipL(down) }, [])
  const handleFlipR = useCallback((down: boolean) => { stateRef.current.flipR = down; setFlipR(down) }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🎯 Pinball</span>
        <span className={styles.scoreDisplay}>{score} · ●×{balls}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🎯</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Pinball</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Håll kvar bollen med flipprarna!<br />3 bollar · Träffa bumpers för poäng
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}p</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ position: 'relative', height: 320, background: 'rgba(0,0,20,.6)', border: '2px solid rgba(99,102,241,.3)', borderRadius: 16, overflow: 'hidden' }}>
            {BUMPERS.map(b => (
              <div key={b.id} style={{ position: 'absolute', left: `${b.x}%`, top: `${b.y}%`, transform: 'translate(-50%,-50%)', fontSize: 22,
                filter: activeBumper === b.id ? 'brightness(2)' : 'none', transition: 'filter .1s' }}>
                {b.label}
              </div>
            ))}
            <div style={{
              position: 'absolute', left: `${ball.x}%`, top: `${ball.y}%`,
              width: 14, height: 14, borderRadius: '50%', background: '#e8e8f0',
              transform: 'translate(-50%,-50%)', boxShadow: '0 0 6px rgba(255,255,255,.6)',
              transition: 'left .033s linear, top .033s linear',
            }} />
            <div style={{ position: 'absolute', bottom: '10%', left: '10%', width: '30%', height: 8, borderRadius: 4, background: flipL ? '#818cf8' : 'rgba(129,140,248,.4)', transformOrigin: '0 50%', transform: `rotate(${flipL ? -30 : 20}deg)`, transition: 'transform .05s, background .05s' }} />
            <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: '30%', height: 8, borderRadius: 4, background: flipR ? '#818cf8' : 'rgba(129,140,248,.4)', transformOrigin: '100% 50%', transform: `rotate(${flipR ? 30 : -20}deg)`, transition: 'transform .05s, background .05s' }} />
            {!stateRef.current.active && balls > 0 && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <button style={{ background: 'rgba(74,222,128,.2)', border: '1px solid rgba(74,222,128,.4)', borderRadius: 10, padding: '8px 20px', fontSize: 12, color: '#4ade80', cursor: 'pointer' }} onClick={launch}>
                  Skjut! 🚀
                </button>
              </div>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button onPointerDown={() => handleFlipL(true)} onPointerUp={() => handleFlipL(false)} onPointerLeave={() => handleFlipL(false)}
              style={{ padding: '18px 0', borderRadius: 12, fontSize: 15, fontWeight: 900, background: flipL ? 'rgba(129,140,248,.25)' : 'rgba(255,255,255,.06)', border: `2px solid ${flipL ? 'rgba(129,140,248,.5)' : 'rgba(255,255,255,.1)'}`, color: '#818cf8', cursor: 'pointer', touchAction: 'none' }}>
              ◄ VÄNSTER
            </button>
            <button onPointerDown={() => handleFlipR(true)} onPointerUp={() => handleFlipR(false)} onPointerLeave={() => handleFlipR(false)}
              style={{ padding: '18px 0', borderRadius: 12, fontSize: 15, fontWeight: 900, background: flipR ? 'rgba(129,140,248,.25)' : 'rgba(255,255,255,.06)', border: `2px solid ${flipR ? 'rgba(129,140,248,.5)' : 'rgba(255,255,255,.1)'}`, color: '#818cf8', cursor: 'pointer', touchAction: 'none' }}>
              HÖGER ►
            </button>
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{score >= 5000 ? '🏆' : score >= 2000 ? '⭐' : '🎯'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{score} poäng</div>
          <div style={{ fontSize: 14, color: score >= 5000 ? '#4ade80' : '#fbbf24' }}>
            {score >= 5000 ? 'Pinball-mästare! 🏆' : score >= 2000 ? 'Riktigt bra! ⭐' : 'Öva mer! 🎯'}
          </div>
          {score > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{Math.round(score / 50)}🪙 +{Math.round(score / 30)} XP</div>
          <button className="btn-primary" style={{ padding: '12px 28px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
