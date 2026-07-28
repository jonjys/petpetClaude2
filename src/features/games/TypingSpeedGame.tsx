import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const WORDS_LIST = [
  'husdjur','spel','poäng','nivå','mynt','äventyr','trycka','snabb','stark','glad',
  'sol','stjärna','drake','kung','skatt','eld','vatten','skog','berg','hav',
  'blomma','fisk','fågel','katt','hund','björn','räv','örn','tiger','lejon',
  'pizza','kaffe','juice','vatten','bröd','ost','äpple','kaka','soppa','ris',
  'musik','dans','sång','spel','film','bok','bild','konst','sport','löpning',
]

const GAME_TIME = 60

function pickWords(n: number): string[] {
  const shuffled = [...WORDS_LIST].sort(() => Math.random() - 0.5)
  const result: string[] = []
  while (result.length < n) result.push(...shuffled)
  return result.slice(0, n)
}

export const TypingSpeedGame = memo(function TypingSpeedGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [words, setWords] = useState<string[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [input, setInput] = useState('')
  const [correct, setCorrect] = useState(0)
  const [wrong, setWrong] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_TIME)
  const [bestWpm] = useState(() => Number(localStorage.getItem('k0509_typing_best') ?? 0))
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const start = useCallback(() => {
    setWords(pickWords(100)); setCurrentIdx(0); setInput(''); setCorrect(0); setWrong(0); setTimeLeft(GAME_TIME)
    setPhase('playing')
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [])

  useEffect(() => {
    if (phase !== 'playing') return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current!); setPhase('done'); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current!)
  }, [phase])

  useEffect(() => {
    if (phase === 'done') {
      const elapsed = GAME_TIME - timeLeft
      const wpm = elapsed > 0 ? Math.round((correct / elapsed) * 60) : correct
      const prev = Number(localStorage.getItem('k0509_typing_best') ?? 0)
      if (wpm > prev) localStorage.setItem('k0509_typing_best', String(wpm))
      onWin(correct * 5 + wpm * 2, correct * 8)
      audio.achievement()
    }
  }, [phase, correct, timeLeft, onWin])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    if (val.endsWith(' ')) {
      const typed = val.trim()
      const target = words[currentIdx] ?? ''
      if (typed === target) { setCorrect(c => c + 1); audio.coin() }
      else { setWrong(w => w + 1); audio.click() }
      setCurrentIdx(i => i + 1); setInput('')
    } else {
      setInput(val)
    }
  }, [words, currentIdx])

  const elapsed = GAME_TIME - timeLeft
  const wpm = elapsed > 10 ? Math.round((correct / elapsed) * 60) : 0
  const timerColor = timeLeft > 30 ? '#4ade80' : timeLeft > 10 ? '#fbbf24' : '#f87171'
  const currentWord = words[currentIdx] ?? ''
  const isCorrectSoFar = currentWord.startsWith(input)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>⌨️ Skrivhastighet</span>
        <span className={styles.scoreDisplay}>{wpm > 0 ? `${wpm} WPM` : `${correct}✓`}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>⌨️</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Skrivhastighet</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Skriv ord och tryck mellanslag!<br />{GAME_TIME} sekunder · Mäter WPM
          </div>
          {bestWpm > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestWpm} WPM</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,.08)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(timeLeft / GAME_TIME) * 100}%`, background: timerColor, borderRadius: 2, transition: 'width 1s linear' }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 900, color: timerColor, minWidth: 30 }}>{timeLeft}s</span>
          </div>

          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 12, padding: '12px 14px', minHeight: 60 }}>
            {words.slice(Math.max(0, currentIdx - 2), currentIdx + 10).map((w, i) => {
              const idx = currentIdx - Math.max(0, currentIdx - 2) + i - 2
              return (
                <span key={`${currentIdx}-${i}`} style={{
                  padding: '2px 4px', borderRadius: 4, fontSize: 14,
                  color: idx < 0 ? '#555' : idx === 0 ? '#e8e8f0' : '#666',
                  background: idx === 0 ? 'rgba(129,140,248,.15)' : 'none',
                  textDecoration: idx < 0 ? 'line-through' : 'none',
                }}>
                  {w}
                </span>
              )
            })}
          </div>

          <input
            ref={inputRef}
            value={input}
            onChange={handleChange}
            style={{
              padding: '12px 14px', borderRadius: 12, fontSize: 16, background: 'rgba(255,255,255,.06)',
              border: `2px solid ${input.length === 0 ? 'rgba(255,255,255,.15)' : isCorrectSoFar ? 'rgba(74,222,128,.4)' : 'rgba(248,113,113,.4)'}`,
              color: isCorrectSoFar ? '#e8e8f0' : '#f87171', outline: 'none',
            }}
            placeholder="Börja skriva..."
            autoComplete="off" autoCorrect="off" spellCheck={false}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--t3)' }}>
            <span>✓ {correct} rätt</span>
            <span>{wpm > 0 ? `${wpm} WPM` : '–'}</span>
            <span>✗ {wrong} fel</span>
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{wpm >= 60 ? '🚀' : wpm >= 40 ? '⭐' : '⌨️'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{wpm} WPM</div>
          <div style={{ fontSize: 14, color: wpm >= 60 ? '#4ade80' : '#fbbf24' }}>
            {wpm >= 60 ? 'Skrivproffs! 🚀' : wpm >= 40 ? 'Riktigt bra! ⭐' : 'Öva mer! ⌨️'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--t3)' }}>{correct} rätt · {wrong} fel · {correct + wrong} totalt</div>
          {wpm > bestWpm && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{correct * 5 + wpm * 2}🪙 +{correct * 8} XP</div>
          <button className="btn-primary" style={{ padding: '12px 28px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
