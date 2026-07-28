import { memo, useState, useCallback, useRef, useEffect } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const WORDS = [
  { word: 'KATT', hint: 'Husdjur' },
  { word: 'HUND', hint: 'Lojalt djur' },
  { word: 'FISK', hint: 'Simmar i vatten' },
  { word: 'BORG', hint: 'Medeltida byggnad' },
  { word: 'MYNT', hint: 'Valuta' },
  { word: 'PARK', hint: 'Grönt område' },
  { word: 'SKOG', hint: 'Träd & natur' },
  { word: 'RING', hint: 'Rund form' },
  { word: 'GLAS', hint: 'Transparent material' },
  { word: 'SALT', hint: 'Krydda' },
  { word: 'MAST', hint: 'På ett skepp' },
  { word: 'KLOT', hint: 'Rund form' },
  { word: 'STRAND', hint: 'Vid havet' },
  { word: 'DRAKE', hint: 'Mytiskt djur' },
  { word: 'STORK', hint: 'Lång fågel' },
  { word: 'FLAMINGO', hint: 'Rosa fågel' },
]

const ROUNDS = 8
const ROUND_TIME = 20

function scramble(word: string): string {
  const arr = word.split('')
  let result = word
  while (result === word) result = arr.sort(() => Math.random() - 0.5).join('')
  return result
}

export const AnagramGame = memo(function AnagramGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [round, setRound] = useState(0)
  const [wordObj, setWordObj] = useState(WORDS[0])
  const [scrambled, setScrambled] = useState('')
  const [input, setInput] = useState('')
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME)
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_anagram_best') ?? 0))
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const scoreRef = useRef(0)
  const usedIdxRef = useRef<number[]>([])

  const nextWord = useCallback((currentScore: number) => {
    const available = WORDS.map((_, i) => i).filter(i => !usedIdxRef.current.includes(i))
    if (available.length === 0) usedIdxRef.current = []
    const idx = available[Math.floor(Math.random() * available.length)] ?? 0
    usedIdxRef.current.push(idx)
    const w = WORDS[idx]
    setWordObj(w); setScrambled(scramble(w.word)); setInput(''); setTimeLeft(ROUND_TIME); setFeedback(null)
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [])

  const start = useCallback(() => {
    usedIdxRef.current = []; scoreRef.current = 0
    setRound(1); setScore(0)
    const idx = Math.floor(Math.random() * WORDS.length)
    usedIdxRef.current.push(idx)
    const w = WORDS[idx]
    setWordObj(w); setScrambled(scramble(w.word)); setInput(''); setTimeLeft(ROUND_TIME); setFeedback(null)
    setPhase('playing')
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [])

  useEffect(() => {
    if (phase !== 'playing') return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!)
          setFeedback('wrong')
          audio.click()
          setTimeout(() => {
            setRound(r => {
              const next = r + 1
              if (next > ROUNDS) {
                const s = scoreRef.current
                const prev = Number(localStorage.getItem('k0509_anagram_best') ?? 0)
                if (s > prev) localStorage.setItem('k0509_anagram_best', String(s))
                onWin(s * 10, s * 20); audio.achievement()
                setPhase('done')
              } else {
                nextWord(scoreRef.current)
              }
              return next
            })
          }, 800)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current!)
  }, [phase, nextWord, onWin])

  const handleSubmit = useCallback(() => {
    if (input.toUpperCase() === wordObj.word) {
      clearInterval(timerRef.current!)
      const bonus = Math.ceil(timeLeft / 5)
      const newScore = scoreRef.current + 1 + bonus
      scoreRef.current = newScore; setScore(newScore)
      setFeedback('correct'); audio.coin()
      setTimeout(() => {
        setRound(r => {
          const next = r + 1
          if (next > ROUNDS) {
            const prev = Number(localStorage.getItem('k0509_anagram_best') ?? 0)
            if (newScore > prev) localStorage.setItem('k0509_anagram_best', String(newScore))
            onWin(newScore * 10, newScore * 20); audio.achievement()
            setPhase('done')
          } else {
            nextWord(newScore)
          }
          return next
        })
      }, 700)
    } else {
      setFeedback('wrong')
      setTimeout(() => setFeedback(null), 400)
      audio.click()
    }
  }, [input, wordObj, timeLeft, nextWord, onWin])

  const handleKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter') handleSubmit() }
  const timerColor = timeLeft > 12 ? '#4ade80' : timeLeft > 6 ? '#fbbf24' : '#f87171'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🔤 Anagram</span>
        <span className={styles.scoreDisplay}>{score}p · {round}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🔤</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Anagram</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Blanda om bokstäverna till rätt ord!<br />{ROUNDS} rundor · Snabbare = fler poäng
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}p</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,.08)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(timeLeft / ROUND_TIME) * 100}%`, background: timerColor, transition: 'width 1s linear', borderRadius: 2 }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 900, color: timerColor }}>{timeLeft}s</span>
          </div>
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 8 }}>Tips: {wordObj.hint}</div>
            <div style={{ letterSpacing: 8, fontFamily: 'var(--ff-head)', fontSize: 32, fontWeight: 900, color: '#818cf8' }}>{scrambled}</div>
          </div>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value.toUpperCase())}
            onKeyDown={handleKey}
            maxLength={wordObj.word.length + 2}
            style={{
              padding: '12px 14px', borderRadius: 12, fontSize: 18, background: 'rgba(255,255,255,.06)',
              border: `2px solid ${feedback === 'correct' ? 'rgba(74,222,128,.5)' : feedback === 'wrong' ? 'rgba(248,113,113,.5)' : 'rgba(255,255,255,.15)'}`,
              color: '#e8e8f0', outline: 'none', textAlign: 'center', letterSpacing: 4, fontFamily: 'var(--ff-head)', fontWeight: 900,
            }}
            placeholder="Skriv ordet..."
            autoComplete="off" spellCheck={false}
          />
          <button className="btn-primary" onClick={handleSubmit} style={{ padding: '12px' }}>Svara!</button>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{score >= 20 ? '🏆' : score >= 12 ? '⭐' : '🔤'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{score} poäng!</div>
          <div style={{ fontSize: 14, color: score >= 20 ? '#4ade80' : '#fbbf24' }}>
            {score >= 20 ? 'Ordmästare! 🏆' : score >= 12 ? 'Riktigt bra! ⭐' : 'Öva mer! 🔤'}
          </div>
          {score > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{score * 10}🪙 +{score * 20} XP</div>
          <button className="btn-primary" style={{ padding: '12px 28px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
