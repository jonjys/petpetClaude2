import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const BLOCK_W = 120
const CANVAS_W = 220
const SPEED_INIT = 1.2
const TOTAL = 15

export const StackDropGame = memo(function StackDropGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [blocks, setBlocks] = useState<{ x: number; w: number }[]>([])
  const [moving, setMoving] = useState({ x: 0, w: BLOCK_W, dir: 1 })
  const [score, setScore] = useState(0)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_sd2_best') ?? 0))
  const animRef = useRef<number | null>(null)
  const stateRef = useRef({ x: 0, dir: 1, w: BLOCK_W, speed: SPEED_INIT, score: 0, base: 0 })

  const endGame = useCallback((s: number) => {
    if (animRef.current) cancelAnimationFrame(animRef.current)
    const prev = Number(localStorage.getItem('k0509_sd2_best') ?? 0)
    if (s > prev) localStorage.setItem('k0509_sd2_best', String(s))
    onWin(s * 8, s * 28)
    setPhase('done')
    audio.achievement()
  }, [onWin])

  const tick = useCallback(() => {
    const s = stateRef.current
    s.x += s.dir * s.speed
    if (s.x + s.w >= CANVAS_W) { s.x = CANVAS_W - s.w; s.dir = -1 }
    if (s.x <= 0) { s.x = 0; s.dir = 1 }
    setMoving({ x: s.x, w: s.w, dir: s.dir })
    animRef.current = requestAnimationFrame(tick)
  }, [])

  const start = useCallback(() => {
    stateRef.current = { x: 0, dir: 1, w: BLOCK_W, speed: SPEED_INIT, score: 0, base: 0 }
    setScore(0)
    setBlocks([{ x: (CANVAS_W - BLOCK_W) / 2, w: BLOCK_W }])
    setMoving({ x: 0, w: BLOCK_W, dir: 1 })
    setPhase('playing')
    animRef.current = requestAnimationFrame(tick)
  }, [tick])

  const drop = useCallback(() => {
    if (phase !== 'playing') return
    const s = stateRef.current
    const topBlock = { x: s.base, w: s.w }

    const overlapStart = Math.max(s.x, topBlock.x)
    const overlapEnd = Math.min(s.x + s.w, topBlock.x + topBlock.w)
    const overlap = overlapEnd - overlapStart

    if (overlap <= 4) {
      if (animRef.current) cancelAnimationFrame(animRef.current)
      endGame(s.score)
      return
    }

    s.score++
    setScore(s.score)
    audio.coin()

    const newW = overlap
    const newX = overlapStart
    s.base = newX
    s.w = newW
    s.speed = Math.min(SPEED_INIT + s.score * 0.15, 4)

    setBlocks(prev => [...prev, { x: newX, w: newW }])

    if (s.score >= TOTAL) {
      if (animRef.current) cancelAnimationFrame(animRef.current)
      endGame(s.score)
      return
    }

    s.x = 0
    s.dir = 1
    setMoving({ x: 0, w: s.w, dir: 1 })
  }, [phase, endGame])

  useEffect(() => () => { if (animRef.current) cancelAnimationFrame(animRef.current) }, [])

  const COLORS = ['#60a5fa', '#4ade80', '#fbbf24', '#c084fc', '#f87171', '#34d399', '#fb923c']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🏗️ Stacka</span>
        <span className={styles.scoreDisplay}>{score}/{TOTAL}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🏗️</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Stacka</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Tryck för att stapla blocket på det nedan. Missa och blocket krymper — missa helt och det är game over. 15 block!
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}/{TOTAL}</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <div style={{ fontSize: 11, color: 'var(--t3)' }}>Tryck för att stapla! ({score}/{TOTAL})</div>
          <div
            onClick={drop}
            style={{ position: 'relative', width: CANVAS_W, height: 280, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 14, overflow: 'hidden', cursor: 'pointer' }}
          >
            {blocks.slice(-8).map((b, i, arr) => {
              const fromBottom = (arr.length - 1 - i) * 28
              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute', bottom: fromBottom, left: b.x,
                    width: b.w, height: 24, borderRadius: 6,
                    background: COLORS[(blocks.length - arr.length + i) % COLORS.length],
                    boxShadow: `0 2px 8px rgba(0,0,0,.4)`,
                  }}
                />
              )
            })}
            <div
              style={{
                position: 'absolute', top: 16, left: moving.x,
                width: moving.w, height: 24, borderRadius: 6,
                background: COLORS[blocks.length % COLORS.length],
                boxShadow: `0 0 12px ${COLORS[blocks.length % COLORS.length]}88`,
              }}
            />
          </div>
          <button className="btn-primary" style={{ padding: '14px 60px', fontSize: 18 }} onClick={drop}>TAP!</button>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{score >= 12 ? '🏆' : score >= 8 ? '⭐' : '🏗️'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{score} / {TOTAL}</div>
          <div style={{ fontSize: 13, color: score >= 12 ? '#4ade80' : '#fbbf24' }}>
            {score >= 15 ? 'PERFEKT! 🏆' : score >= 12 ? 'Utmärkt! ⭐' : score >= 8 ? 'Bra! 👍' : 'Öva mer! 🏗️'}
          </div>
          {score > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{score * 8}🪙 +{score * 28} XP</div>
          <button className="btn-primary" style={{ padding: '14px 32px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
