import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

interface RainWord {
  id: number
  text: string
  x: number
  y: number
  speed: number
}

const WORD_LIST = [
  'katt', 'hund', 'fisk', 'fågel', 'skog', 'snö', 'sol', 'måne',
  'berg', 'hav', 'eld', 'sten', 'träd', 'blad', 'ros', 'gräs',
  'bil', 'båt', 'tåg', 'hus', 'bro', 'väg', 'stad', 'land',
  'mat', 'bröd', 'mjölk', 'ägg', 'kaka', 'frukt', 'grön', 'röd',
  'blå', 'gul', 'stor', 'liten', 'snabb', 'glad', 'klok', 'stark',
]

const GAME_TIME = 45

export const TypingRainGame = memo(function TypingRainGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [words, setWords] = useState<RainWord[]>([])
  const [input, setInput] = useState('')
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_TIME)
  const [missed, setMissed] = useState(0)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_tr_best') ?? 0))
  const idRef = useRef(0)
  const scoreRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const spawnRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const missedRef = useRef(0)

  const spawnWord = useCallback(() => {
    idRef.current++
    const text = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)]
    setWords(prev => [...prev, {
      id: idRef.current,
      text,
      x: 5 + Math.random() * 80,
      y: -8,
      speed: 0.15 + Math.random() * 0.2,
    }])
  }, [])

  const start = useCallback(() => {
    scoreRef.current = 0; missedRef.current = 0
    setScore(0); setMissed(0); setInput(''); setTimeLeft(GAME_TIME)
    setWords([]); idRef.current = 0
    setPhase('playing')
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [])

  useEffect(() => {
    if (phase !== 'playing') return

    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          if (animRef.current) clearInterval(animRef.current)
          if (spawnRef.current) clearInterval(spawnRef.current)
          const s = scoreRef.current
          const prev = Number(localStorage.getItem('k0509_tr_best') ?? 0)
          if (s > prev) localStorage.setItem('k0509_tr_best', String(s))
          if (s > 0) onWin(Math.round(s / 6), s)
          setPhase('done')
          return 0
        }
        return t - 1
      })
    }, 1000)

    spawnRef.current = setInterval(spawnWord, 1800)

    animRef.current = setInterval(() => {
      setWords(prev => {
        const next: RainWord[] = []
        for (const w of prev) {
          const ny = w.y + w.speed
          if (ny > 105) {
            missedRef.current++
            setMissed(missedRef.current)
            audio.tap()
          } else {
            next.push({ ...w, y: ny })
          }
        }
        return next
      })
    }, 50)

    spawnWord()

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (animRef.current) clearInterval(animRef.current)
      if (spawnRef.current) clearInterval(spawnRef.current)
    }
  }, [phase, onWin, spawnWord])

  const handleInput = useCallback((val: string) => {
    setInput(val)
    setWords(prev => {
      const match = prev.find(w => w.text === val.trim().toLowerCase())
      if (match) {
        const pts = 30 + Math.floor((100 - match.y) / 5)
        scoreRef.current += pts
        setScore(s => s + pts)
        audio.coin()
        setInput('')
        return prev.filter(w => w.id !== match.id)
      }
      return prev
    })
  }, [])

  const timerPct = (timeLeft / GAME_TIME) * 100
  const timerColor = timeLeft <= 10 ? '#f87171' : timeLeft <= 20 ? '#fbbf24' : '#60a5fa'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🌧️ Ordregn</span>
        <span className={styles.scoreDisplay}>{score}p · {timeLeft}s</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🌧️</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Ordregn</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Ord faller från himlen. Skriv dem exakt innan de träffar marken! Högre = mer poäng. 45 sekunder.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}p</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,.08)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${timerPct}%`, background: timerColor, transition: 'width 1s linear' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--t3)' }}>
            <span>❌ Missat: {missed}</span>
            <span>⭐ {score}p</span>
          </div>
          <div style={{ position: 'relative', height: 200, borderRadius: 14, background: 'linear-gradient(180deg, rgba(30,30,60,.8), rgba(10,10,30,.9))', border: '1px solid rgba(255,255,255,.08)', overflow: 'hidden' }}>
            {words.map(w => (
              <div
                key={w.id}
                style={{
                  position: 'absolute',
                  left: `${w.x}%`,
                  top: `${w.y}%`,
                  transform: 'translateX(-50%)',
                  background: 'rgba(96,165,250,.15)',
                  border: '1px solid rgba(96,165,250,.3)',
                  borderRadius: 8,
                  padding: '4px 8px',
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#93c5fd',
                  whiteSpace: 'nowrap',
                  fontFamily: 'monospace',
                  pointerEvents: 'none',
                }}
              >
                {w.text}
              </div>
            ))}
            {words.length === 0 && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'rgba(255,255,255,.2)' }}>Ord på väg...</div>}
          </div>
          <input
            ref={inputRef}
            value={input}
            onChange={e => handleInput(e.target.value)}
            placeholder="Skriv ordet här..."
            style={{
              padding: '14px 16px', borderRadius: 12, fontSize: 16, fontFamily: 'monospace',
              background: 'rgba(255,255,255,.06)', border: '2px solid rgba(96,165,250,.3)',
              color: '#fff', outline: 'none', width: '100%', boxSizing: 'border-box',
            }}
          />
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <div style={{ fontWeight: 900, color: '#4ade80', fontSize: 20 }}>🌧️ {score}p!</div>
          <div style={{ fontSize: 12, color: 'var(--t3)' }}>Missade ord: {missed}</div>
          <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
