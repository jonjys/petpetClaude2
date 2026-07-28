import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const W = 300, H = 220, BASKET_W = 60, BASKET_H = 16
const GAME_TIME = 30
const GOOD = ['🍎', '🍊', '🍋', '🍇', '🍓', '🫐', '🍑']
const BAD = ['💣', '🪨', '💀']

type Item = { id: number; x: number; y: number; emoji: string; speed: number; isBad: boolean }

export const CatchFruitGame = memo(function CatchFruitGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [items, setItems] = useState<Item[]>([])
  const [basketX, setBasketX] = useState(W / 2)
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [timeLeft, setTimeLeft] = useState(GAME_TIME)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_cf_best') ?? 0))

  const stateRef = useRef({ items: [] as Item[], basketX: W / 2, score: 0, lives: 3, nextId: 0, running: false })
  const frameRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const start = useCallback(() => {
    stateRef.current = { items: [], basketX: W / 2, score: 0, lives: 3, nextId: 0, running: true }
    setItems([]); setBasketX(W / 2); setScore(0); setLives(3); setTimeLeft(GAME_TIME)
    setPhase('playing')
  }, [])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const bx = Math.max(BASKET_W / 2, Math.min(W - BASKET_W / 2, e.clientX - rect.left))
    stateRef.current.basketX = bx
    setBasketX(bx)
  }, [])

  useEffect(() => {
    if (phase !== 'playing') return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!); clearInterval(frameRef.current!)
          stateRef.current.running = false
          const s = stateRef.current.score * 30
          const prev = Number(localStorage.getItem('k0509_cf_best') ?? 0)
          if (s > prev) localStorage.setItem('k0509_cf_best', String(s))
          if (s > 0) { audio.achievement(); onWin(Math.round(s / 5), s) } else audio.click()
          setPhase('done'); return 0
        }
        return t - 1
      })
    }, 1000)

    frameRef.current = setInterval(() => {
      const s = stateRef.current
      if (!s.running) return

      // Spawn
      if (Math.random() < 0.06) {
        const isBad = Math.random() < 0.25
        const pool = isBad ? BAD : GOOD
        s.items.push({ id: s.nextId++, x: Math.random() * (W - 20) + 10, y: -10, emoji: pool[Math.floor(Math.random() * pool.length)], speed: 1.5 + Math.random() * 1.5, isBad })
      }

      // Move
      s.items = s.items.map(i => ({ ...i, y: i.y + i.speed }))

      // Catch / miss
      const basketTop = H - BASKET_H - 10
      const caught: number[] = []
      const missed: number[] = []
      for (const item of s.items) {
        if (item.y >= basketTop && item.y <= basketTop + item.speed + 4) {
          if (Math.abs(item.x - s.basketX) < BASKET_W / 2 + 8) {
            caught.push(item.id)
            if (item.isBad) { s.lives = Math.max(0, s.lives - 1); setLives(s.lives); audio.click() }
            else { s.score++; setScore(s.score); audio.coin() }
          }
        }
        if (item.y > H + 20) missed.push(item.id)
      }
      s.items = s.items.filter(i => !caught.includes(i.id) && !missed.includes(i.id))

      if (s.lives <= 0) {
        clearInterval(timerRef.current!); clearInterval(frameRef.current!)
        s.running = false
        const pts = s.score * 30
        const prev = Number(localStorage.getItem('k0509_cf_best') ?? 0)
        if (pts > prev) localStorage.setItem('k0509_cf_best', String(pts))
        if (pts > 0) { audio.achievement(); onWin(Math.round(pts / 5), pts) } else audio.click()
        setPhase('done')
      }

      setItems([...s.items])
    }, 30)

    return () => { clearInterval(timerRef.current!); clearInterval(frameRef.current!) }
  }, [phase, onWin])

  const timerColor = timeLeft > 15 ? '#4ade80' : timeLeft > 7 ? '#fbbf24' : '#f87171'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🍎 Fånga Frukter</span>
        <span className={styles.scoreDisplay}>{score}p · {'❤️'.repeat(lives)}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🍎</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Fånga Frukter</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Rör fingret för att flytta korgen!<br />Fånga frukter · Undvik bomber 💣 · 3 liv
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}p</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {(phase === 'playing' || phase === 'done') && (
        <div style={{ padding: '0 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: timerColor, fontWeight: 700 }}>{timeLeft}s</span>
            <span style={{ fontSize: 11, color: '#fbbf24', fontWeight: 700 }}>{score} frukter</span>
          </div>
          <div
            ref={containerRef}
            onPointerMove={handlePointerMove}
            style={{ position: 'relative', width: W, height: H, background: 'rgba(0,20,0,.7)', border: '2px solid rgba(255,255,255,.1)', borderRadius: 12, overflow: 'hidden', touchAction: 'none', cursor: 'none', margin: '0 auto' }}
          >
            {items.map(item => (
              <div key={item.id} style={{ position: 'absolute', left: item.x - 14, top: item.y - 14, fontSize: 22 }}>{item.emoji}</div>
            ))}
            <div style={{ position: 'absolute', bottom: 10, left: basketX - BASKET_W / 2, width: BASKET_W, height: BASKET_H, background: '#8B4513', borderRadius: '0 0 8px 8px', border: '2px solid #a0522d' }}>
              <div style={{ position: 'absolute', top: -8, left: -4, right: -4, height: 12, background: 'rgba(139,69,19,.5)', borderRadius: '50% 50% 0 0' }} />
            </div>
            {phase === 'done' && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, color: '#fbbf24' }}>{score} frukter! {score * 30}p</div>
            )}
          </div>
          {phase === 'done' && (
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Spela igen!</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
})
