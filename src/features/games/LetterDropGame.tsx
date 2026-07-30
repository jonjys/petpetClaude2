import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const GAME_DURATION = 40
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

interface Letter {
  id: number
  char: string
  x: number
  y: number
  speed: number
}

export const LetterDropGame = memo(function LetterDropGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [letters, setLetters] = useState<Letter[]>([])
  const [target, setTarget] = useState('')
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_ld_best') ?? 0))
  const idRef = useRef(0)
  const scoreRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const spawnRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const fallRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const pickTarget = useCallback(() => ALPHABET[Math.floor(Math.random() * ALPHABET.length)], [])

  const stopAll = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (spawnRef.current) clearInterval(spawnRef.current)
    if (fallRef.current) clearInterval(fallRef.current)
  }, [])

  const start = useCallback(() => {
    scoreRef.current = 0; setScore(0); setLetters([]); setTimeLeft(GAME_DURATION)
    const t = pickTarget(); setTarget(t)
    setPhase('playing')

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          stopAll()
          const s = scoreRef.current
          const prev2 = Number(localStorage.getItem('k0509_ld_best') ?? 0)
          if (s > prev2) localStorage.setItem('k0509_ld_best', String(s))
          if (s > 0) onWin(Math.round(s * 10), s * 35)
          setPhase('done')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    spawnRef.current = setInterval(() => {
      const char = Math.random() < 0.3 ? t : ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
      setLetters(prev => [...prev, { id: idRef.current++, char, x: 5 + Math.random() * 85, y: 0, speed: 1.5 + Math.random() * 2 }])
    }, 600)

    fallRef.current = setInterval(() => {
      setLetters(prev => prev.map(l => ({ ...l, y: l.y + l.speed })).filter(l => l.y < 110))
    }, 50)
  }, [onWin, stopAll, pickTarget])

  const tap = useCallback((id: number, char: string) => {
    setLetters(prev => {
      const hit = prev.find(l => l.id === id)
      if (!hit) return prev
      if (char === target) {
        audio.coin(); scoreRef.current++; setScore(scoreRef.current)
        setTarget(pickTarget())
        return prev.filter(l => l.id !== id)
      } else {
        audio.tap()
        return prev
      }
    })
  }, [target, pickTarget])

  useEffect(() => () => stopAll(), [stopAll])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🔡 Letter Drop</span>
        <span className={styles.scoreDisplay}>{score}p · {timeLeft}s</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🔡</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Letter Drop</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Bokstäver faller ner — tryck rätt bokstav! Målbokstaven visas i mitten. 40 sekunder.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}p</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,.08)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(timeLeft / GAME_DURATION) * 100}%`, background: timeLeft <= 8 ? '#f87171' : '#c084fc', transition: 'width 1s linear' }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--t3)' }}>Tryck bokstaven:</div>
            <div style={{ fontFamily: 'var(--ff-head)', fontSize: 52, fontWeight: 900, color: '#c084fc', lineHeight: 1 }}>{target}</div>
          </div>
          <div style={{ position: 'relative', height: 200, background: 'rgba(255,255,255,.04)', borderRadius: 12, border: '1px solid rgba(255,255,255,.08)', overflow: 'hidden' }}>
            {letters.map(l => (
              <button key={l.id} onClick={() => tap(l.id, l.char)} style={{
                position: 'absolute', left: `${l.x}%`, top: `${l.y}%`,
                transform: 'translate(-50%,-50%)',
                width: 38, height: 38, borderRadius: 8,
                fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900,
                background: l.char === target ? 'rgba(192,132,252,.25)' : 'rgba(255,255,255,.1)',
                border: `2px solid ${l.char === target ? '#c084fc' : 'rgba(255,255,255,.15)'}`,
                color: l.char === target ? '#c084fc' : '#fff',
                cursor: 'pointer',
              }}>{l.char}</button>
            ))}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <div style={{ fontWeight: 900, color: '#c084fc', fontSize: 20 }}>🔡 {score} träffar!</div>
          <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
