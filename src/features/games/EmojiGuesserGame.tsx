import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const CLUES = [
  { emojis: '🌊🏄', answer: 'Surfa', alt: ['SURFA','SURFARE','SURFING'] },
  { emojis: '🌙⭐', answer: 'Natt', alt: ['NATT','NATTLIG','STJÄRNOR'] },
  { emojis: '🐟🎣', answer: 'Fiske', alt: ['FISKE','FISKA','FISKARE'] },
  { emojis: '🔥💧', answer: 'Ånga', alt: ['ÅNGA','STEAM','DIMMA'] },
  { emojis: '🏔️❄️', answer: 'Vinter', alt: ['VINTER','SNÖBERG','IS'] },
  { emojis: '🎵🎹', answer: 'Musik', alt: ['MUSIK','PIANO','MELODIN'] },
  { emojis: '🌈☀️', answer: 'Regnbåge', alt: ['REGNBÅGE','FÄRGER'] },
  { emojis: '🏆🥇', answer: 'Vinna', alt: ['VINNA','SEGER','MÄSTARE'] },
  { emojis: '🐾🦁', answer: 'Lejon', alt: ['LEJON','DJUR','KUNG'] },
  { emojis: '🎃👻', answer: 'Halloween', alt: ['HALLOWEEN','SPÖKE','SKRÄCK'] },
  { emojis: '🍕🇮🇹', answer: 'Pizza', alt: ['PIZZA','ITALIEN','MAT'] },
  { emojis: '🚀🌌', answer: 'Rymden', alt: ['RYMDEN','RYMD','GALAXY'] },
]

const ROUNDS = 8
const ROUND_TIME = 25

export const EmojiGuesserGame = memo(function EmojiGuesserGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [round, setRound] = useState(0)
  const [clue, setClue] = useState(CLUES[0])
  const [input, setInput] = useState('')
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME)
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_eg_best') ?? 0))
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const usedRef = useRef<number[]>([])
  const scoreRef = useRef(0)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const nextClue = useCallback(() => {
    const available = CLUES.map((_, i) => i).filter(i => !usedRef.current.includes(i))
    if (available.length === 0) usedRef.current = []
    const idx = available[Math.floor(Math.random() * available.length)] ?? 0
    usedRef.current.push(idx)
    setClue(CLUES[idx]); setInput(''); setTimeLeft(ROUND_TIME); setFeedback(null); setRevealed(false)
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [])

  const start = useCallback(() => {
    usedRef.current = []; scoreRef.current = 0
    setRound(1); setScore(0)
    nextClue(); setPhase('playing')
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [nextClue])

  const endRound = useCallback((correct: boolean) => {
    clearInterval(timerRef.current!)
    setFeedback(correct ? 'correct' : 'wrong')
    if (correct) audio.coin(); else audio.click()
    setTimeout(() => {
      setRound(r => {
        const next = r + 1
        if (next > ROUNDS) {
          const s = scoreRef.current
          const prev = Number(localStorage.getItem('k0509_eg_best') ?? 0)
          if (s > prev) localStorage.setItem('k0509_eg_best', String(s))
          onWin(s * 15, s * 25); audio.achievement()
          setPhase('done')
        } else { nextClue() }
        return next
      })
    }, 1000)
  }, [nextClue, onWin])

  useEffect(() => {
    if (phase !== 'playing') return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current!); setRevealed(true); endRound(false); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current!)
  }, [phase, round, endRound])

  const handleSubmit = useCallback(() => {
    const val = input.trim().toUpperCase()
    const correct = [clue.answer.toUpperCase(), ...clue.alt.map(a => a.toUpperCase())].includes(val)
    if (correct) {
      const bonus = Math.ceil(timeLeft / 5)
      const newScore = scoreRef.current + 1 + bonus
      scoreRef.current = newScore; setScore(newScore)
    }
    endRound(correct)
  }, [input, clue, timeLeft, endRound])

  const handleKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter') handleSubmit() }
  const timerColor = timeLeft > 15 ? '#4ade80' : timeLeft > 7 ? '#fbbf24' : '#f87171'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🤔 Emoji-Gissare</span>
        <span className={styles.scoreDisplay}>{score}p · {round}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🤔</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Emoji-Gissare</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Vad föreställer emoji-kombinationen?<br />{ROUNDS} rundor · Snabbare svar = mer poäng
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
          <div style={{ textAlign: 'center', padding: '24px 0', background: feedback === 'correct' ? 'rgba(74,222,128,.08)' : feedback === 'wrong' ? 'rgba(248,113,113,.08)' : 'rgba(255,255,255,.03)', borderRadius: 16, border: `1px solid ${feedback === 'correct' ? 'rgba(74,222,128,.3)' : feedback === 'wrong' ? 'rgba(248,113,113,.3)' : 'rgba(255,255,255,.06)'}`, transition: 'all .1s' }}>
            <div style={{ fontSize: 48 }}>{clue.emojis}</div>
            {revealed && <div style={{ marginTop: 10, fontSize: 14, color: '#f87171' }}>Svar: {clue.answer}</div>}
          </div>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            style={{ padding: '12px 14px', borderRadius: 12, fontSize: 16, background: 'rgba(255,255,255,.06)', border: '2px solid rgba(255,255,255,.15)', color: '#e8e8f0', outline: 'none', textAlign: 'center' }}
            placeholder="Vad föreställer detta?"
            autoComplete="off" spellCheck={false}
          />
          <button className="btn-primary" onClick={handleSubmit} style={{ padding: '12px' }}>Svara!</button>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{score >= 20 ? '🏆' : score >= 12 ? '⭐' : '🤔'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{score} poäng!</div>
          <div style={{ fontSize: 14, color: score >= 20 ? '#4ade80' : '#fbbf24' }}>
            {score >= 20 ? 'Emojitolk! 🏆' : score >= 12 ? 'Riktigt bra! ⭐' : 'Öva mer! 🤔'}
          </div>
          {score > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{score * 15}🪙 +{score * 25} XP</div>
          <button className="btn-primary" style={{ padding: '12px 28px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
