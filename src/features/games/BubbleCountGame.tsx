import { memo, useState, useCallback, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const ROUNDS = 12
const SHOW_MS = 1400

interface Bubble {
  id: number
  x: number
  y: number
  size: number
  color: string
}

const BUBBLE_COLORS = ['#f87171', '#60a5fa', '#4ade80', '#fbbf24', '#c084fc']

function makeBubbles(count: number): Bubble[] {
  const bubbles: Bubble[] = []
  for (let i = 0; i < count; i++) {
    bubbles.push({
      id: i,
      x: 5 + Math.random() * 85,
      y: 5 + Math.random() * 85,
      size: 22 + Math.floor(Math.random() * 16),
      color: BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)],
    })
  }
  return bubbles
}

function getCount(round: number) {
  return 3 + Math.floor(round * 1.5)
}

export const BubbleCountGame = memo(function BubbleCountGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'show' | 'answer' | 'feedback' | 'done'>('ready')
  const [round, setRound] = useState(0)
  const [bubbles, setBubbles] = useState<Bubble[]>([])
  const [options, setOptions] = useState<number[]>([])
  const [correct, setCorrect] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_bbc_best') ?? 0))
  const scoreRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const makeOptions = useCallback((count: number) => {
    const opts = new Set([count])
    while (opts.size < 4) {
      const delta = Math.floor(Math.random() * 4) + 1
      opts.add(count + (Math.random() > 0.5 ? delta : -delta))
    }
    return Array.from(opts).filter(v => v > 0).sort(() => Math.random() - 0.5).slice(0, 4)
  }, [])

  const nextRound = useCallback((r: number) => {
    if (r >= ROUNDS) {
      const s = scoreRef.current
      const prev = Number(localStorage.getItem('k0509_bbc_best') ?? 0)
      if (s > prev) localStorage.setItem('k0509_bbc_best', String(s))
      onWin(s * 14, s * 45)
      setPhase('done')
      audio.achievement()
      return
    }
    const count = getCount(r)
    setBubbles(makeBubbles(count))
    setCorrect(count)
    setOptions(makeOptions(count))
    setPicked(null)
    setRound(r)
    setPhase('show')
    timerRef.current = setTimeout(() => setPhase('answer'), SHOW_MS)
  }, [makeOptions, onWin])

  const start = useCallback(() => {
    scoreRef.current = 0
    setScore(0)
    nextRound(0)
  }, [nextRound])

  const pick = useCallback((val: number) => {
    if (picked !== null) return
    setPicked(val)
    const isCorrect = val === correct
    setPhase('feedback')
    if (isCorrect) {
      scoreRef.current++
      setScore(scoreRef.current)
      audio.coin()
    } else {
      audio.click()
    }
    timerRef.current = setTimeout(() => nextRound(round + 1), 900)
  }, [picked, correct, round, nextRound])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🫧 Räkna Bubblor</span>
        <span className={styles.scoreDisplay}>{score}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🫧</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Räkna Bubblor</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Bubblor visas kort — räkna dem sedan välj rätt antal! 12 ronder, fler bubblor för varje runda.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}/{ROUNDS}</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'show' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 11, color: 'var(--t3)', textAlign: 'center' }}>Räkna! ({round + 1}/{ROUNDS})</div>
          <div style={{ position: 'relative', height: 220, background: 'rgba(255,255,255,.04)', borderRadius: 14, border: '1px solid rgba(255,255,255,.08)', overflow: 'hidden' }}>
            {bubbles.map(b => (
              <div key={b.id} style={{
                position: 'absolute', left: `${b.x}%`, top: `${b.y}%`,
                width: b.size, height: b.size, borderRadius: '50%',
                background: b.color, opacity: 0.85,
                transform: 'translate(-50%,-50%)',
                boxShadow: `0 0 8px ${b.color}66`,
              }} />
            ))}
          </div>
        </div>
      )}

      {phase === 'answer' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--t3)', textAlign: 'center' }}>Hur många bubblor? ({round + 1}/{ROUNDS})</div>
          <div style={{ height: 60, background: 'rgba(255,255,255,.04)', borderRadius: 14, border: '1px solid rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--t3)' }}>Bubblorna är borta — vad var antalet?</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {options.map(opt => (
              <button key={opt} onClick={() => pick(opt)} style={{ padding: '18px', borderRadius: 14, fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff', background: 'rgba(255,255,255,.08)', border: '2px solid rgba(255,255,255,.15)', cursor: 'pointer' }}>{opt}</button>
            ))}
          </div>
        </div>
      )}

      {phase === 'feedback' && (
        <div style={{ padding: '32px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 52 }}>{picked === correct ? '✅' : '❌'}</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: picked === correct ? '#4ade80' : '#f87171' }}>
            {picked === correct ? 'Rätt!' : `Fel! Det var ${correct}`}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{score >= 10 ? '🏆' : score >= 7 ? '⭐' : '🫧'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{score} / {ROUNDS}</div>
          <div style={{ fontSize: 13, color: score >= 10 ? '#4ade80' : '#fbbf24' }}>
            {score >= 12 ? 'PERFEKT! 🏆' : score >= 10 ? 'Utmärkt! ⭐' : score >= 7 ? 'Bra! 👍' : 'Öva mer! 🫧'}
          </div>
          {score > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{score * 14}🪙 +{score * 45} XP</div>
          <button className="btn-primary" style={{ padding: '14px 32px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
