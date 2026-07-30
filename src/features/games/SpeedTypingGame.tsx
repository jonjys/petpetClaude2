import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const GAME_DURATION = 60
const WORDS = ['katt','hund','fisk','fågel','sol','bok','bil','hus','blomma','träd','stjärna','moln','regn','snö','vind','hav','berg','skog','flod','sjö','bro','väg','stad','land','luft','eld','vatten','jord','natt','dag']

function pickWords(n: number) {
  const shuffled = [...WORDS].sort(() => Math.random() - 0.5)
  const result: string[] = []
  while (result.length < n) result.push(...shuffled)
  return result.slice(0, n)
}

export const SpeedTypingGame = memo(function SpeedTypingGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [words] = useState(() => pickWords(50))
  const [wordIdx, setWordIdx] = useState(0)
  const [input, setInput] = useState('')
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_st2_best') ?? 0))
  const scoreRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const endGame = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    const s = scoreRef.current
    const prev = Number(localStorage.getItem('k0509_st2_best') ?? 0)
    if (s > prev) localStorage.setItem('k0509_st2_best', String(s))
    if (s > 0) onWin(Math.round(s * 5), s * 20)
    setPhase('done')
  }, [onWin])

  const start = useCallback(() => {
    scoreRef.current = 0; setScore(0); setWordIdx(0); setInput(''); setTimeLeft(GAME_DURATION)
    setPhase('playing')
    setTimeout(() => inputRef.current?.focus(), 100)
    timerRef.current = setInterval(() => {
      setTimeLeft(t => { if (t <= 1) { endGame(); return 0 } return t - 1 })
    }, 1000)
  }, [endGame])

  const handleInput = useCallback((val: string) => {
    setInput(val)
    const current = words[wordIdx]
    if (val === current + ' ' || val === current) {
      audio.coin()
      scoreRef.current++; setScore(scoreRef.current)
      setWordIdx(i => i + 1); setInput('')
    }
  }, [words, wordIdx])

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  const currentWord = words[wordIdx] ?? ''
  const isCorrect = currentWord.startsWith(input) || input === ''

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>⌨️ Speed Typing</span>
        <span className={styles.scoreDisplay}>{score}ord · {timeLeft}s</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>⌨️</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Speed Typing</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Skriv orden så snabbt du kan! 60 sekunder — hur många ord klarar du?
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore} ord</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,.08)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(timeLeft / GAME_DURATION) * 100}%`, background: timeLeft <= 10 ? '#f87171' : '#60a5fa', transition: 'width 1s linear' }} />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '12px', background: 'rgba(255,255,255,.04)', borderRadius: 12, minHeight: 60 }}>
            {words.slice(Math.max(0, wordIdx - 1), wordIdx + 8).map((w, i) => {
              const wIdx = Math.max(0, wordIdx - 1) + i
              return (
                <span key={wIdx} style={{
                  fontSize: 15, fontWeight: wIdx === wordIdx ? 900 : 400,
                  color: wIdx < wordIdx ? 'var(--t3)' : wIdx === wordIdx ? '#fff' : 'rgba(255,255,255,.4)',
                  textDecoration: wIdx < wordIdx ? 'line-through' : 'none',
                }}>{w}</span>
              )
            })}
          </div>
          <input
            ref={inputRef}
            value={input}
            onChange={e => handleInput(e.target.value)}
            onKeyDown={e => { if (e.key === ' ') { e.preventDefault(); handleInput(input + ' ') } }}
            style={{
              padding: '14px 16px', borderRadius: 12, fontSize: 18, fontFamily: 'var(--ff-head)',
              background: isCorrect ? 'rgba(255,255,255,.08)' : 'rgba(248,113,113,.15)',
              border: `2px solid ${isCorrect ? 'rgba(255,255,255,.15)' : '#f87171'}`,
              color: '#fff', outline: 'none', width: '100%', boxSizing: 'border-box',
            }}
            placeholder="Skriv här..."
            autoComplete="off" autoCapitalize="off" spellCheck={false}
          />
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <div style={{ fontWeight: 900, color: '#60a5fa', fontSize: 20 }}>⌨️ {score} ord!</div>
          <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
