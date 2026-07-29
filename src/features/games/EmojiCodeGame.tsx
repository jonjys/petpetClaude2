import { memo, useState, useCallback } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const ROUNDS = 8

const CLUES: { emojis: string[]; answer: string; hint: string }[] = [
  { emojis: ['👁️', '🍦'], answer: 'glass', hint: 'Kallt & sött' },
  { emojis: ['🌊', '🐚'], answer: 'strand', hint: 'Semester' },
  { emojis: ['🌙', '⭐'], answer: 'natt', hint: 'Mörkt ute' },
  { emojis: ['🌱', '💧'], answer: 'växa', hint: 'Växt behöver' },
  { emojis: ['🔥', '💧'], answer: 'storm', hint: 'Motsatser möts' },
  { emojis: ['🚀', '⭐'], answer: 'rymd', hint: 'Ovan molnen' },
  { emojis: ['🎵', '❤️'], answer: 'sång', hint: 'Känslosamt' },
  { emojis: ['🌺', '🦋'], answer: 'vår', hint: 'Årstid' },
  { emojis: ['❄️', '⛄'], answer: 'vinter', hint: 'Kallt årstid' },
  { emojis: ['🌞', '😴'], answer: 'dag', hint: 'Ljust ute' },
  { emojis: ['🏔️', '❄️'], answer: 'fjäll', hint: 'Högt uppe' },
  { emojis: ['🎭', '😂'], answer: 'skratt', hint: 'Ha roligt' },
]

export const EmojiCodeGame = memo(function EmojiCodeGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)
  const [input, setInput] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)
  const [showHint, setShowHint] = useState(false)
  const [usedClues, setUsedClues] = useState<number[]>([])
  const [current, setCurrent] = useState<typeof CLUES[0] | null>(null)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_ec_best') ?? 0))

  const nextRound = useCallback((r: number, used: number[]) => {
    const available = CLUES.map((_, i) => i).filter(i => !used.includes(i))
    const pool = available.length > 0 ? available : CLUES.map((_, i) => i)
    const idx = pool[Math.floor(Math.random() * pool.length)]
    setCurrent(CLUES[idx])
    setUsedClues(prev => [...prev, idx])
    setInput(''); setFeedback(null); setShowHint(false); setRound(r)
  }, [])

  const start = useCallback(() => {
    setScore(0); setUsedClues([])
    setPhase('playing'); nextRound(0, [])
  }, [nextRound])

  const check = useCallback(() => {
    if (!current || !input.trim()) return
    const guess = input.trim().toLowerCase()
    const correct = current.answer.toLowerCase()
    const isCorrect = guess === correct
    const pts = isCorrect ? (showHint ? 50 : 100) : 0
    const newScore = score + pts
    if (isCorrect) {
      setFeedback(`✅ Rätt! "${current.answer}" +${pts}p`)
      setScore(newScore); audio.coin()
      setTimeout(() => {
        const nextR = round + 1
        if (nextR >= ROUNDS) {
          const prev = Number(localStorage.getItem('k0509_ec_best') ?? 0)
          if (newScore > prev) localStorage.setItem('k0509_ec_best', String(newScore))
          audio.achievement(); onWin(Math.round(newScore / 5), newScore); setPhase('done')
        } else nextRound(nextR, usedClues)
      }, 1000)
    } else {
      setFeedback(`❌ Fel! Försök igen...`); audio.tap()
    }
  }, [current, input, showHint, score, round, usedClues, nextRound, onWin])

  const skip = useCallback(() => {
    if (!current) return
    setFeedback(`➡️ Svaret var: "${current.answer}"`)
    setTimeout(() => {
      const nextR = round + 1
      if (nextR >= ROUNDS) {
        const prev = Number(localStorage.getItem('k0509_ec_best') ?? 0)
        if (score > prev) localStorage.setItem('k0509_ec_best', String(score))
        if (score > 0) onWin(Math.round(score / 5), score); setPhase('done')
      } else nextRound(nextR, usedClues)
    }, 1200)
  }, [current, round, score, usedClues, nextRound, onWin])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🔑 Emoji-Kod</span>
        <span className={styles.scoreDisplay}>{score}p · {round}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🔑</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Emoji-Kod</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Emojis representerar ett ord — gissa vilket!<br />Tips kostar 50% av poängen. ({ROUNDS} runder)
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}p</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {(phase === 'playing' || phase === 'done') && current && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 11, color: 'var(--t3)', textAlign: 'center' }}>Runda {round + 1}/{ROUNDS}</div>
          <div style={{ textAlign: 'center', padding: '24px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 16 }}>
            <div style={{ fontSize: 56, letterSpacing: 8 }}>{current.emojis.join(' ')}</div>
            {showHint && <div style={{ fontSize: 12, color: '#818cf8', marginTop: 10 }}>💡 Tips: {current.hint}</div>}
          </div>

          {feedback && (
            <div style={{ textAlign: 'center', fontSize: 14, fontWeight: 700, color: feedback.startsWith('✅') ? '#4ade80' : feedback.startsWith('➡️') ? '#818cf8' : '#f87171' }}>
              {feedback}
            </div>
          )}

          {phase === 'playing' && !feedback && (
            <>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && check()}
                placeholder="Skriv ditt svar..."
                style={{ padding: '12px 14px', borderRadius: 12, fontSize: 16, background: 'rgba(255,255,255,.06)', border: '2px solid rgba(255,255,255,.15)', color: '#e8e8f0', outline: 'none', fontFamily: 'var(--ff-head)' }}
                autoFocus
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-primary" style={{ flex: 1, padding: '12px' }} onClick={check}>Gissa!</button>
                {!showHint && <button onClick={() => setShowHint(true)} style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(129,140,248,.1)', border: '1px solid rgba(129,140,248,.2)', color: '#818cf8', cursor: 'pointer', fontSize: 12 }}>💡 Tips (-50%)</button>}
                <button onClick={skip} style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: 'var(--t3)', cursor: 'pointer', fontSize: 12 }}>Hoppa</button>
              </div>
            </>
          )}

          {phase === 'done' && (
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
              <div style={{ fontWeight: 900, color: '#4ade80', fontSize: 16 }}>🎉 {score}p på {ROUNDS} runder!</div>
              <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Spela igen!</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
})
