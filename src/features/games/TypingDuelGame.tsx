import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const WORDS = ['KATT','HUND','FISK','STEN','TRÄD','SJÖ','BERG','HUS','BIL','SOL','MÅN','STJÄRNA','FLOD','SKOG','BLOM','MOLN','VIND','ELD','IS','SAND','GRÄS','FÅGEL','BJÖRN','RÄV','ULV','ÄLG','LEJON','ORM','EKORRE','KANIN']
const GAME_TIME = 30

type FallingWord = { id: number; word: string; y: number; speed: number }

export const TypingDuelGame = memo(function TypingDuelGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [falling, setFalling] = useState<FallingWord[]>([])
  const [input, setInput] = useState('')
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_TIME)
  const [lives, setLives] = useState(5)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_td_best') ?? 0))

  const stateRef = useRef({ falling: [] as FallingWord[], score: 0, lives: 5, nextId: 0, running: false })
  const frameRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const start = useCallback(() => {
    stateRef.current = { falling: [], score: 0, lives: 5, nextId: 0, running: true }
    setFalling([]); setScore(0); setLives(5); setTimeLeft(GAME_TIME); setInput('')
    setPhase('playing')
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [])

  useEffect(() => {
    if (phase !== 'playing') return

    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!); clearInterval(frameRef.current!)
          stateRef.current.running = false
          const s = stateRef.current.score
          const prev = Number(localStorage.getItem('k0509_td_best') ?? 0)
          if (s > prev) localStorage.setItem('k0509_td_best', String(s))
          if (s > 0) { audio.achievement(); onWin(Math.round(s * 5), s * 10) } else audio.click()
          setPhase('done'); return 0
        }
        return t - 1
      })
    }, 1000)

    frameRef.current = setInterval(() => {
      const s = stateRef.current
      if (!s.running) return

      // Spawn new word
      if (Math.random() < 0.04) {
        const word = WORDS[Math.floor(Math.random() * WORDS.length)]
        const speed = 0.4 + (GAME_TIME - (GAME_TIME * 1)) * 0.01
        s.falling.push({ id: s.nextId++, word, y: -5, speed: speed + Math.random() * 0.3 })
      }

      // Move words
      s.falling = s.falling.map(w => ({ ...w, y: w.y + w.speed }))

      // Check bottom
      const lost = s.falling.filter(w => w.y > 100)
      if (lost.length > 0) {
        s.lives = Math.max(0, s.lives - lost.length)
        s.falling = s.falling.filter(w => w.y <= 100)
        setLives(s.lives)
        if (s.lives <= 0) {
          clearInterval(timerRef.current!); clearInterval(frameRef.current!)
          s.running = false
          const prev = Number(localStorage.getItem('k0509_td_best') ?? 0)
          if (s.score > prev) localStorage.setItem('k0509_td_best', String(s.score))
          if (s.score > 0) { audio.achievement(); onWin(Math.round(s.score * 5), s.score * 10) } else audio.click()
          setPhase('done'); return
        }
        audio.click()
      }

      setFalling([...s.falling])
    }, 50)

    return () => { clearInterval(timerRef.current!); clearInterval(frameRef.current!) }
  }, [phase, onWin])

  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase()
    setInput(val)
    const s = stateRef.current
    const match = s.falling.findIndex(w => w.word === val)
    if (match >= 0) {
      s.falling.splice(match, 1)
      s.score += val.length
      setScore(s.score); setFalling([...s.falling]); setInput('')
      audio.coin()
    }
  }, [])

  const timerColor = timeLeft > 15 ? '#4ade80' : timeLeft > 7 ? '#fbbf24' : '#f87171'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>⌨️ Typduell</span>
        <span className={styles.scoreDisplay}>{score}p · {'❤️'.repeat(Math.max(0, lives))}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>⌨️</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Typduell</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Skriv de fallande orden innan de når botten!<br />5 liv · 30 sekunder
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}p</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: timerColor, fontWeight: 700 }}>{timeLeft}s</span>
            <span style={{ fontSize: 11 }}>{'❤️'.repeat(lives)}{'🖤'.repeat(5 - lives)}</span>
          </div>
          <div style={{ position: 'relative', height: 200, background: 'rgba(0,10,20,.85)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 12, overflow: 'hidden' }}>
            {falling.map(w => (
              <div key={w.id} style={{ position: 'absolute', left: `${(w.id % 8) * 12 + 2}%`, top: `${w.y}%`, padding: '3px 6px', background: 'rgba(248,113,113,.2)', border: '1px solid rgba(248,113,113,.4)', borderRadius: 6, fontSize: 12, fontWeight: 700, color: '#f87171', whiteSpace: 'nowrap', fontFamily: 'var(--ff-head)' }}>
                {w.word}
              </div>
            ))}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: '#f87171', opacity: 0.4 }} />
          </div>
          <input
            ref={inputRef}
            value={input}
            onChange={handleInput}
            autoComplete="off" spellCheck={false}
            style={{ padding: '12px 14px', borderRadius: 12, fontSize: 16, background: 'rgba(255,255,255,.06)', border: '2px solid rgba(255,255,255,.15)', color: '#e8e8f0', outline: 'none', letterSpacing: 2, fontFamily: 'var(--ff-head)', fontWeight: 700 }}
            placeholder="Skriv ordet här..."
          />
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{score >= 50 ? '🏆' : score >= 20 ? '⭐' : '⌨️'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{score} poäng!</div>
          {score >= bestScore && score > 0 && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{Math.round(score * 5)}🪙 +{score * 10} XP</div>
          <button className="btn-primary" style={{ padding: '12px 28px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
