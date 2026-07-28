import { memo, useState, useEffect, useCallback, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const GAME_TIME = 30
const COLORS = ['#f87171', '#fbbf24', '#4ade80', '#60a5fa', '#c084fc', '#fb7185']
const SIZES = [44, 52, 60, 36]

interface Bubble {
  id: number
  x: number
  y: number
  color: string
  size: number
  points: number
  born: number
  lifetime: number
}

let bubbleId = 0

export const BubblePopGame = memo(function BubblePopGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [bubbles, setBubbles] = useState<Bubble[]>([])
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_TIME)
  const [combo, setCombo] = useState(0)
  const [missed, setMissed] = useState(0)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_bubble_best') ?? 0))
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const spawnRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const expireRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const comboRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearAll = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (spawnRef.current) clearInterval(spawnRef.current)
    if (expireRef.current) clearInterval(expireRef.current)
    if (comboRef.current) clearTimeout(comboRef.current)
  }, [])

  const start = useCallback(() => {
    setBubbles([]); setScore(0); setTimeLeft(GAME_TIME); setCombo(0); setMissed(0)
    setPhase('playing')
  }, [])

  useEffect(() => {
    if (phase !== 'playing') return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearAll(); setPhase('done'); return 0 }
        return t - 1
      })
    }, 1000)

    spawnRef.current = setInterval(() => {
      const size = SIZES[Math.floor(Math.random() * SIZES.length)]
      const newBubble: Bubble = {
        id: bubbleId++,
        x: 5 + Math.random() * 80,
        y: 10 + Math.random() * 70,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size,
        points: size === 36 ? 5 : size === 44 ? 3 : size === 52 ? 2 : 1,
        born: Date.now(),
        lifetime: 1500 + Math.random() * 1500,
      }
      setBubbles(prev => [...prev.slice(-20), newBubble])
    }, 500)

    expireRef.current = setInterval(() => {
      const now = Date.now()
      setBubbles(prev => {
        const expired = prev.filter(b => now - b.born > b.lifetime)
        if (expired.length > 0) setMissed(m => m + expired.length)
        return prev.filter(b => now - b.born <= b.lifetime)
      })
    }, 200)

    return clearAll
  }, [phase, clearAll])

  useEffect(() => {
    if (phase === 'done') {
      const prev = Number(localStorage.getItem('k0509_bubble_best') ?? 0)
      if (score > prev) localStorage.setItem('k0509_bubble_best', String(score))
      const coins = Math.max(0, score * 2 - missed)
      const xp = score * 3
      onWin(coins, xp)
      audio.achievement()
    }
  }, [phase, score, missed, onWin])

  const popBubble = useCallback((id: number, points: number) => {
    setBubbles(prev => prev.filter(b => b.id !== id))
    setCombo(c => {
      const next = c + 1
      if (comboRef.current) clearTimeout(comboRef.current)
      comboRef.current = setTimeout(() => setCombo(0), 1000)
      const mult = next >= 10 ? 3 : next >= 5 ? 2 : 1
      setScore(s => s + points * mult)
      return next
    })
    audio.click()
  }, [])

  const timerColor = timeLeft > 15 ? '#4ade80' : timeLeft > 7 ? '#fbbf24' : '#f87171'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={() => { clearAll(); onExit() }}>←</button>
        <span className={styles.gameTitle}>🫧 Bubblor</span>
        <span className={styles.scoreDisplay}>{score}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🫧</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Bubbelpopp!</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260 }}>
            Tryck på bubblor innan de försvinner! Små bubblor = mer poäng. Combo ×{'>'}= 5 ger 2× poäng.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore} poäng</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && (
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,.08)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(timeLeft / GAME_TIME) * 100}%`, background: timerColor, borderRadius: 3, transition: 'width 1s linear' }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 900, color: timerColor }}>{timeLeft}s</span>
            {combo >= 3 && <span style={{ fontSize: 11, color: '#fbbf24' }}>🔥{combo}x</span>}
          </div>
          <div style={{ position: 'relative', height: 380, background: 'rgba(255,255,255,.02)', borderRadius: 16, border: '1px solid rgba(255,255,255,.06)', overflow: 'hidden' }}>
            {bubbles.map(b => {
              const age = Date.now() - b.born
              const opacity = Math.max(0.3, 1 - (age / b.lifetime) * 0.7)
              return (
                <button
                  key={b.id}
                  onClick={() => popBubble(b.id, b.points)}
                  style={{
                    position: 'absolute',
                    left: `${b.x}%`,
                    top: `${b.y}%`,
                    width: b.size, height: b.size,
                    borderRadius: '50%',
                    background: `radial-gradient(circle at 35% 35%, ${b.color}cc, ${b.color}44)`,
                    border: `2px solid ${b.color}88`,
                    cursor: 'pointer',
                    opacity,
                    fontSize: b.size === 36 ? 10 : 12,
                    fontWeight: 900,
                    color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transform: 'translate(-50%, -50%)',
                    transition: 'opacity .2s',
                    backdropFilter: 'blur(2px)',
                  }}
                >
                  {b.points > 1 ? `×${b.points}` : ''}
                </button>
              )
            })}
          </div>
          <div style={{ textAlign: 'center', fontSize: 10, color: 'var(--t3)' }}>Missade: {missed}</div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>🫧</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{score} poäng</div>
          <div style={{ fontSize: 12, color: 'var(--t3)' }}>Missade: {missed} bubblor</div>
          {score > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{Math.max(0, score * 2 - missed)}🪙 +{score * 3} XP</div>
          <button className="btn-primary" style={{ padding: '14px 32px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
