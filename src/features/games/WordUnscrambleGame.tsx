import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const GAME_DURATION = 60
const WORDS = [
  'katt','hund','bok','hus','bil','sol','fisk','fågel','blomma','träd',
  'sten','ring','brev','glas','lamp','dörr','bord','stol','matta','klocka',
  'penga','frukt','juice','lunch','middag','kaffe','vatten','mjölk','bröd','smör',
]

function scramble(w: string): string {
  const arr = w.split('')
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr.join('') === w ? scramble(w) : arr.join('')
}

function pickWord(used: Set<string>) {
  const pool = WORDS.filter(w => !used.has(w))
  const src = pool.length > 0 ? pool : WORDS
  const w = src[Math.floor(Math.random() * src.length)]
  return { word: w, scrambled: scramble(w) }
}

export const WordUnscrambleGame = memo(function WordUnscrambleGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [current, setCurrent] = useState({ word: '', scrambled: '' })
  const [input, setInput] = useState('')
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION)
  const [feedback, setFeedback] = useState<'right' | 'wrong' | null>(null)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_wus_best') ?? 0))
  const scoreRef = useRef(0)
  const usedRef = useRef(new Set<string>())
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const endGame = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    const s = scoreRef.current
    const prev = Number(localStorage.getItem('k0509_wus_best') ?? 0)
    if (s > prev) localStorage.setItem('k0509_wus_best', String(s))
    if (s > 0) onWin(Math.round(s * 14), s * 45)
    setPhase('done')
  }, [onWin])

  const nextWord = useCallback(() => {
    const nw = pickWord(usedRef.current)
    usedRef.current.add(nw.word)
    setCurrent(nw); setInput(''); setFeedback(null)
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [])

  const start = useCallback(() => {
    scoreRef.current = 0; setScore(0); usedRef.current = new Set()
    setTimeLeft(GAME_DURATION); setPhase('playing')
    nextWord()
    timerRef.current = setInterval(() => {
      setTimeLeft(t => { if (t <= 1) { endGame(); return 0 } return t - 1 })
    }, 1000)
  }, [endGame, nextWord])

  const submit = useCallback(() => {
    if (!input.trim()) return
    if (input.trim().toLowerCase() === current.word) {
      audio.coin(); setFeedback('right')
      scoreRef.current++; setScore(scoreRef.current)
      setTimeout(nextWord, 400)
    } else {
      audio.tap(); setFeedback('wrong')
      setTimeout(() => setFeedback(null), 500)
    }
  }, [input, current, nextWord])

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🔤 Ordpussel</span>
        <span className={styles.scoreDisplay}>{score}p · {timeLeft}s</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🔤</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Ordpussel</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Bokstäverna är om varandra — skriv rätt ord! 60 sekunder.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}p</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,.08)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(timeLeft / GAME_DURATION) * 100}%`, background: timeLeft <= 10 ? '#f87171' : '#c084fc', transition: 'width 1s linear' }} />
          </div>
          <div style={{
            textAlign: 'center', padding: '28px 16px', borderRadius: 16,
            background: feedback === 'right' ? 'rgba(74,222,128,.1)' : feedback === 'wrong' ? 'rgba(248,113,113,.1)' : 'rgba(255,255,255,.05)',
            border: `2px solid ${feedback === 'right' ? '#4ade80' : feedback === 'wrong' ? '#f87171' : 'rgba(255,255,255,.1)'}`,
          }}>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 8 }}>Blanda om bokstäverna:</div>
            <div style={{ fontFamily: 'var(--ff-head)', fontSize: 36, fontWeight: 900, color: '#c084fc', letterSpacing: 8 }}>
              {current.scrambled.toUpperCase()}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') submit() }}
              style={{
                flex: 1, padding: '12px 14px', borderRadius: 10, fontSize: 16,
                background: 'rgba(255,255,255,.08)', border: '2px solid rgba(255,255,255,.12)',
                color: '#fff', outline: 'none',
              }}
              placeholder="Skriv ordet..."
              autoComplete="off" autoCapitalize="off" spellCheck={false}
            />
            <button onClick={submit} style={{ padding: '12px 16px', borderRadius: 10, background: '#c084fc', border: 'none', color: '#fff', fontWeight: 900, fontSize: 16, cursor: 'pointer' }}>OK</button>
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <div style={{ fontWeight: 900, color: '#c084fc', fontSize: 20 }}>🔤 {score} ord!</div>
          <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
