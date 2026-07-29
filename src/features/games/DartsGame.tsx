import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

interface Dart {
  x: number
  y: number
  pts: number
}

const THROWS = 5
const BOARD_SIZE = 260
const CENTER = BOARD_SIZE / 2
const RINGS = [
  { r: 15, pts: 50, label: 'BULL', color: '#ef4444' },
  { r: 30, pts: 25, label: 'Bull', color: '#fbbf24' },
  { r: 60, pts: 10, label: '10', color: '#4ade80' },
  { r: 100, pts: 5, label: '5', color: '#60a5fa' },
  { r: 130, pts: 2, label: '2', color: '#e8e8f0' },
]

function getRingPts(dist: number): number {
  for (const r of RINGS) if (dist <= r.r) return r.pts
  return 0
}

export const DartsGame = memo(function DartsGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [darts, setDarts] = useState<Dart[]>([])
  const [score, setScore] = useState(0)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_darts_best') ?? 0))
  const [cursorX, setCursorX] = useState(CENTER)
  const [cursorY, setCursorY] = useState(CENTER)
  const boardRef = useRef<HTMLDivElement>(null)
  const animRef = useRef<number>()
  const tRef = useRef(0)
  const scoreRef = useRef(0)

  const start = useCallback(() => {
    setDarts([]); setScore(0); scoreRef.current = 0; setPhase('playing')
  }, [])

  // Animate cursor
  useEffect(() => {
    if (phase !== 'playing') return
    const animate = (ts: number) => {
      if (tRef.current === 0) tRef.current = ts
      const elapsed = (ts - tRef.current) / 1000
      const speed = 1.2 + darts.length * 0.3
      const r = 80 + Math.sin(elapsed * 0.7) * 40
      const angle = elapsed * speed * Math.PI * 2
      const nx = CENTER + r * Math.cos(angle) + Math.sin(elapsed * 1.3) * 25
      const ny = CENTER + r * Math.sin(angle) + Math.cos(elapsed * 0.9) * 25
      setCursorX(Math.max(10, Math.min(BOARD_SIZE - 10, nx)))
      setCursorY(Math.max(10, Math.min(BOARD_SIZE - 10, ny)))
      animRef.current = requestAnimationFrame(animate)
    }
    tRef.current = 0
    animRef.current = requestAnimationFrame(animate)
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [phase, darts.length])

  const throwDart = useCallback(() => {
    if (phase !== 'playing') return
    const x = cursorX; const y = cursorY
    const dist = Math.hypot(x - CENTER, y - CENTER)
    const pts = getRingPts(dist)
    const newDart: Dart = { x, y, pts }
    const newDarts = [...darts, newDart]
    const newScore = scoreRef.current + pts
    scoreRef.current = newScore
    setDarts(newDarts); setScore(newScore)
    audio[pts >= 25 ? 'achievement' : pts >= 5 ? 'coin' : 'tap']()
    if (newDarts.length >= THROWS) {
      if (animRef.current) cancelAnimationFrame(animRef.current)
      const prev = Number(localStorage.getItem('k0509_darts_best') ?? 0)
      if (newScore > prev) localStorage.setItem('k0509_darts_best', String(newScore))
      if (newScore > 0) onWin(Math.round(newScore / 2), newScore * 2)
      setTimeout(() => setPhase('done'), 300)
    }
  }, [phase, cursorX, cursorY, darts, onWin])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🎯 Pilkastning</span>
        <span className={styles.scoreDisplay}>{score}p · {darts.length}/{THROWS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🎯</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Pilkastning</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Korset rör sig automatiskt — tryck för att kasta pilen! Träffa mitten för max poäng. {THROWS} kast.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}p</div>}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            {RINGS.map(r => <div key={r.pts} style={{ fontSize: 11, padding: '4px 8px', borderRadius: 8, background: 'rgba(255,255,255,.06)', color: 'var(--t3)' }}>{r.label}={r.pts}p</div>)}
          </div>
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {(phase === 'playing' || phase === 'done') && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
          <div
            ref={boardRef}
            onClick={throwDart}
            style={{ position: 'relative', width: BOARD_SIZE, height: BOARD_SIZE, borderRadius: '50%', background: '#1a1a2e', border: '3px solid rgba(255,255,255,.15)', cursor: phase === 'playing' ? 'none' : 'default', flexShrink: 0 }}
          >
            {/* rings */}
            {[...RINGS].reverse().map(r => (
              <div key={r.r} style={{ position: 'absolute', left: '50%', top: '50%', width: r.r * 2, height: r.r * 2, borderRadius: '50%', background: r.color, transform: 'translate(-50%,-50%)', opacity: 0.25, border: `1px solid ${r.color}` }} />
            ))}
            {RINGS.map(r => (
              <div key={`b${r.r}`} style={{ position: 'absolute', left: '50%', top: '50%', width: r.r * 2, height: r.r * 2, borderRadius: '50%', border: `1px solid ${r.color}`, transform: 'translate(-50%,-50%)' }} />
            ))}
            {/* crosshair */}
            {phase === 'playing' && (
              <div style={{ position: 'absolute', left: cursorX, top: cursorY, transform: 'translate(-50%,-50%)', pointerEvents: 'none' }}>
                <div style={{ position: 'absolute', left: -15, top: -1, width: 30, height: 2, background: '#fff', opacity: 0.8 }} />
                <div style={{ position: 'absolute', top: -15, left: -1, height: 30, width: 2, background: '#fff', opacity: 0.8 }} />
                <div style={{ position: 'absolute', left: -6, top: -6, width: 12, height: 12, borderRadius: '50%', border: '2px solid #fff', opacity: 0.8 }} />
              </div>
            )}
            {/* thrown darts */}
            {darts.map((d, i) => (
              <div key={i} style={{ position: 'absolute', left: d.x, top: d.y, transform: 'translate(-50%,-50%)', fontSize: 16 }}>🎯</div>
            ))}
          </div>

          {phase === 'playing' && (
            <button className="btn-primary" style={{ padding: '14px 40px', fontSize: 16 }} onClick={throwDart}>🎯 KASTA!</button>
          )}
          {phase === 'done' && (
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
              <div style={{ fontWeight: 900, color: '#4ade80', fontSize: 18 }}>🎯 {score}p!</div>
              <div style={{ fontSize: 11, color: 'var(--t3)' }}>Max möjligt: {THROWS * 50}p</div>
              <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Spela igen!</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
})
