import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

interface Bubble {
  id: number
  value: number
  x: number
  y: number
  speed: number
}

const GAME_TIME = 30
const BUBBLE_COUNT = 6

function randomBubbles(target: number, idStart: number): Bubble[] {
  const bubbles: Bubble[] = []
  for (let i = 0; i < BUBBLE_COUNT; i++) {
    let val: number
    if (i < 2) {
      val = target
    } else {
      do { val = Math.floor(Math.random() * 20) + 1 } while (val === target)
    }
    bubbles.push({
      id: idStart + i,
      value: val,
      x: 8 + Math.random() * 72,
      y: 100 + Math.random() * 60,
      speed: 0.3 + Math.random() * 0.4,
    })
  }
  return bubbles.sort(() => Math.random() - 0.5)
}

export const BubbleMathGame = memo(function BubbleMathGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [target, setTarget] = useState(0)
  const [bubbles, setBubbles] = useState<Bubble[]>([])
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_TIME)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_bm_best') ?? 0))
  const idRef = useRef(0)
  const scoreRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const newTarget = useCallback(() => Math.floor(Math.random() * 15) + 2, [])

  const spawnBubbles = useCallback((t: number) => {
    idRef.current += 10
    setBubbles(randomBubbles(t, idRef.current))
  }, [])

  const start = useCallback(() => {
    scoreRef.current = 0
    setScore(0); setFeedback(null); setTimeLeft(GAME_TIME)
    const t = Math.floor(Math.random() * 15) + 2
    setTarget(t)
    idRef.current = 0
    setBubbles(randomBubbles(t, 0))
    setPhase('playing')
  }, [])

  useEffect(() => {
    if (phase !== 'playing') return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          if (animRef.current) clearInterval(animRef.current)
          const s = scoreRef.current
          const prev = Number(localStorage.getItem('k0509_bm_best') ?? 0)
          if (s > prev) localStorage.setItem('k0509_bm_best', String(s))
          if (s > 0) onWin(Math.round(s / 6), s)
          setPhase('done')
          return 0
        }
        return t - 1
      })
    }, 1000)
    animRef.current = setInterval(() => {
      setBubbles(prev => prev.map(b => ({
        ...b,
        y: b.y - b.speed,
        x: b.y < 5 ? 8 + Math.random() * 72 : b.x,
      })).map(b => b.y < 0 ? { ...b, y: 105 + Math.random() * 20, x: 8 + Math.random() * 72 } : b))
    }, 50)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (animRef.current) clearInterval(animRef.current)
    }
  }, [phase, onWin])

  const popBubble = useCallback((b: Bubble) => {
    if (phase !== 'playing') return
    if (b.value === target) {
      const pts = 40
      scoreRef.current += pts
      setScore(s => s + pts)
      setFeedback(`✅ +${pts}p`)
      audio.coin()
      const t = newTarget()
      setTarget(t)
      spawnBubbles(t)
    } else {
      scoreRef.current = Math.max(0, scoreRef.current - 15)
      setScore(s => Math.max(0, s - 15))
      setFeedback('❌ -15p')
      audio.tap()
    }
    setTimeout(() => setFeedback(null), 600)
  }, [phase, target, newTarget, spawnBubbles])

  const timerPct = (timeLeft / GAME_TIME) * 100
  const timerColor = timeLeft <= 8 ? '#f87171' : timeLeft <= 15 ? '#fbbf24' : '#60a5fa'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🫧 Bubbelmatematik</span>
        <span className={styles.scoreDisplay}>{score}p · {timeLeft}s</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🫧</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Bubbelmatematik</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Ploppa bara bubblorna som matchar måltalet! Fel bubbla -15p. 30 sekunder.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}p</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,.08)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${timerPct}%`, background: timerColor, transition: 'width 1s linear, background .3s' }} />
          </div>
          <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--t3)' }}>Ploppa siffran: <span style={{ fontSize: 26, fontWeight: 900, color: '#fff' }}>{target}</span></div>
          {feedback && <div style={{ textAlign: 'center', fontWeight: 900, fontSize: 14, color: feedback.startsWith('✅') ? '#4ade80' : '#f87171' }}>{feedback}</div>}
          <div style={{ position: 'relative', height: 220, overflow: 'hidden', borderRadius: 16, background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)' }}>
            {bubbles.map(b => (
              <button
                key={b.id}
                onClick={() => popBubble(b)}
                style={{
                  position: 'absolute',
                  left: `${b.x}%`,
                  top: `${b.y}%`,
                  transform: 'translate(-50%,-50%)',
                  width: 52, height: 52,
                  borderRadius: '50%',
                  background: b.value === target
                    ? 'radial-gradient(circle at 35% 35%, rgba(96,165,250,.9), rgba(37,99,235,.7))'
                    : 'radial-gradient(circle at 35% 35%, rgba(255,255,255,.18), rgba(255,255,255,.06))',
                  border: `2px solid ${b.value === target ? 'rgba(96,165,250,.6)' : 'rgba(255,255,255,.15)'}`,
                  fontSize: 16, fontWeight: 900, color: '#fff',
                  cursor: 'pointer',
                  boxShadow: b.value === target ? '0 0 14px rgba(96,165,250,.4)' : 'none',
                  transition: 'background .3s',
                }}
              >
                {b.value}
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <div style={{ fontWeight: 900, color: '#4ade80', fontSize: 20 }}>🫧 {score}p!</div>
          <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
