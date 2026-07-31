import { memo, useState, useCallback, useRef, useEffect } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const GAME_TIME = 50
const SENTENCES = [
  'Katten sitter på mattan.',
  'Solen skiner över havet.',
  'Jag älskar att spela spel.',
  'Hunden springer i parken.',
  'Stjärnorna lyser om natten.',
  'Vi äter middag klockan sex.',
  'Boken ligger på bordet.',
  'Regnet faller från himlen.',
  'Fågeln sjunger i trädet.',
  'Barnen leker på gården.',
  'Havet är djupt och blått.',
  'Maten smakar väldigt gott.',
]

export const TypingChallengeGame = memo(function TypingChallengeGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [sentenceIdx, setSentenceIdx] = useState(0)
  const [order, setOrder] = useState<number[]>([])
  const [input, setInput] = useState('')
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_TIME)
  const [errors, setErrors] = useState(0)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_tc2_best') ?? 0))
  const scoreRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const shuffle = useCallback(() => {
    const idxs = Array.from({ length: SENTENCES.length }, (_, i) => i)
    for (let i = idxs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [idxs[i], idxs[j]] = [idxs[j], idxs[i]]
    }
    return idxs
  }, [])

  const end = useCallback((s: number) => {
    if (timerRef.current) clearInterval(timerRef.current)
    const prev = Number(localStorage.getItem('k0509_tc2_best') ?? 0)
    if (s > prev) localStorage.setItem('k0509_tc2_best', String(s))
    onWin(s * 16, s * 55)
    setPhase('done')
    audio.achievement()
  }, [onWin])

  const start = useCallback(() => {
    scoreRef.current = 0
    setScore(0); setErrors(0); setInput(''); setSentenceIdx(0); setTimeLeft(GAME_TIME)
    const ord = shuffle()
    setOrder(ord)
    setPhase('playing')
    timerRef.current = setInterval(() => {
      setTimeLeft(t => { if (t <= 1) { end(scoreRef.current); return 0 } return t - 1 })
    }, 1000)
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [shuffle, end])

  const handleInput = useCallback((val: string) => {
    setInput(val)
    if (order.length === 0) return
    const target = SENTENCES[order[sentenceIdx]]
    if (val === target) {
      scoreRef.current++
      setScore(scoreRef.current)
      audio.coin()
      setInput('')
      const next = sentenceIdx + 1
      if (next >= order.length) { end(scoreRef.current); return }
      setSentenceIdx(next)
    }
  }, [order, sentenceIdx, end])

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  const sentence = order.length > 0 ? SENTENCES[order[sentenceIdx]] : ''
  const timerColor = timeLeft > 25 ? '#4ade80' : timeLeft > 12 ? '#fbbf24' : '#f87171'

  const chars = sentence.split('')
  const typed = input.split('')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>⌨️ Typing Challenge</span>
        <span className={styles.scoreDisplay}>{score}p</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>⌨️</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Typing Challenge</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Skriv av meningarna exakt som de visas! Varje korrekt mening ger poäng. 50 sekunder.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}p</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'rgba(255,255,255,.08)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(timeLeft / GAME_TIME) * 100}%`, background: timerColor, transition: 'width 1s linear' }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 900, color: timerColor }}>{timeLeft}s</span>
          </div>

          <div style={{ padding: '18px', background: 'rgba(255,255,255,.04)', borderRadius: 16, border: '1px solid rgba(255,255,255,.1)', lineHeight: 1.8, fontSize: 17, letterSpacing: 0.5 }}>
            {chars.map((ch, i) => {
              let color = 'rgba(255,255,255,.3)'
              if (i < typed.length) {
                color = typed[i] === ch ? '#4ade80' : '#f87171'
              }
              return <span key={i} style={{ color }}>{ch}</span>
            })}
          </div>

          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => handleInput(e.target.value)}
            placeholder="Skriv meningen..."
            style={{ fontSize: 16, padding: '12px', background: 'rgba(255,255,255,.06)', border: '2px solid rgba(255,255,255,.15)', borderRadius: 14, color: '#fff', width: '100%', boxSizing: 'border-box' }}
          />
          <div style={{ fontSize: 11, color: 'var(--t3)', textAlign: 'center' }}>Klara: {score} · Mening {sentenceIdx + 1}</div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{score >= 5 ? '🏆' : score >= 3 ? '⭐' : '⌨️'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{score} meningar</div>
          <div style={{ fontSize: 13, color: score >= 5 ? '#4ade80' : '#fbbf24' }}>
            {score >= 8 ? 'SKRIVMÄSTARE! 🏆' : score >= 5 ? 'Utmärkt! ⭐' : score >= 3 ? 'Bra! 👍' : 'Öva mer! ⌨️'}
          </div>
          {score > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{score * 16}🪙 +{score * 55} XP</div>
          <button className="btn-primary" style={{ padding: '14px 32px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
