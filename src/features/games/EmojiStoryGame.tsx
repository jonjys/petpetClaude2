import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const GAME_DURATION = 50
const QUESTIONS = [
  { emojis: '🐶🏠', answer: 'Hund hemma', choices: ['Hund hemma','Katt utomhus','Fisk i vattnet','Fågel i trädet'] },
  { emojis: '🌧️☂️', answer: 'Regn med paraply', choices: ['Regn med paraply','Sol med glasögon','Snö med mössa','Dimma med lykta'] },
  { emojis: '🍕🤤', answer: 'Pizza är gott', choices: ['Pizza är gott','Sallad är fräsch','Soppa är varm','Bröd är nybakat'] },
  { emojis: '🚗💨', answer: 'Bil kör fort', choices: ['Bil kör fort','Buss stannar','Tåg avgår','Cykel välter'] },
  { emojis: '👶🍼', answer: 'Baby dricker mjölk', choices: ['Baby dricker mjölk','Barn äter gröt','Vuxen dricker kaffe','Pensionär äter macka'] },
  { emojis: '🌙😴', answer: 'Natt och sömn', choices: ['Natt och sömn','Dag och lek','Kväll och TV','Morgon och frukost'] },
  { emojis: '🎸🎤', answer: 'Rockband spelar', choices: ['Rockband spelar','Orkester övar','DJ mixar','Kör sjunger'] },
  { emojis: '🌊🏄', answer: 'Surfa på vågor', choices: ['Surfa på vågor','Simma i pool','Dyka i havet','Ro i kanal'] },
  { emojis: '🏋️💪', answer: 'Träna på gym', choices: ['Träna på gym','Springa i skog','Cykla på väg','Simma i sjö'] },
  { emojis: '📚🤓', answer: 'Läsa och plugga', choices: ['Läsa och plugga','Skriva och teckna','Räkna och spela','Sjunga och dansa'] },
  { emojis: '🌺🐝', answer: 'Blomma med bi', choices: ['Blomma med bi','Träd med fågel','Gräs med gräshoppa','Mossa med snigel'] },
  { emojis: '🎂🕯️', answer: 'Tårta med ljus', choices: ['Tårta med ljus','Kaka med grädde','Muffins med strössel','Paj med glass'] },
]

function pickQuestions(n: number) {
  return [...QUESTIONS].sort(() => Math.random() - 0.5).slice(0, n)
}

export const EmojiStoryGame = memo(function EmojiStoryGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [questions] = useState(() => pickQuestions(8))
  const [qIdx, setQIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION)
  const [feedback, setFeedback] = useState<'right' | 'wrong' | null>(null)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_es2_best') ?? 0))
  const scoreRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const endGame = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    const s = scoreRef.current
    const prev = Number(localStorage.getItem('k0509_es2_best') ?? 0)
    if (s > prev) localStorage.setItem('k0509_es2_best', String(s))
    if (s > 0) onWin(Math.round(s * 16), s * 55)
    setPhase('done')
  }, [onWin])

  const start = useCallback(() => {
    scoreRef.current = 0; setScore(0); setQIdx(0); setFeedback(null); setTimeLeft(GAME_DURATION)
    setPhase('playing')
    timerRef.current = setInterval(() => {
      setTimeLeft(t => { if (t <= 1) { endGame(); return 0 } return t - 1 })
    }, 1000)
  }, [endGame])

  const answer = useCallback((choice: string) => {
    if (feedback) return
    const q = questions[qIdx]
    if (choice === q.answer) { audio.coin(); setFeedback('right'); scoreRef.current++; setScore(scoreRef.current) }
    else { audio.tap(); setFeedback('wrong') }
    setTimeout(() => {
      const ni = qIdx + 1
      if (ni >= questions.length) { endGame() } else { setQIdx(ni); setFeedback(null) }
    }, 600)
  }, [feedback, questions, qIdx, endGame])

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  const q = questions[qIdx]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>📖 Emoji-historia</span>
        <span className={styles.scoreDisplay}>{score}/{questions.length} · {timeLeft}s</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>📖</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Emoji-historia</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Vad berättar emojisarna? Välj rätt svar! 8 frågor på 50 sekunder.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}/{questions.length}</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && q && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,.08)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(timeLeft / GAME_DURATION) * 100}%`, background: timeLeft <= 10 ? '#f87171' : '#fbbf24', transition: 'width 1s linear' }} />
          </div>
          <div style={{
            textAlign: 'center', padding: '28px 16px', borderRadius: 16,
            background: feedback === 'right' ? 'rgba(74,222,128,.1)' : feedback === 'wrong' ? 'rgba(248,113,113,.1)' : 'rgba(255,255,255,.05)',
            border: `2px solid ${feedback === 'right' ? '#4ade80' : feedback === 'wrong' ? '#f87171' : 'rgba(255,255,255,.1)'}`,
          }}>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 10 }}>Vad berättar de?</div>
            <div style={{ fontSize: 52 }}>{q.emojis}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {q.choices.map((c, i) => (
              <button key={i} onClick={() => answer(c)} style={{
                padding: '12px 14px', borderRadius: 12, fontSize: 13, fontWeight: 700, textAlign: 'left',
                background: feedback && c === q.answer ? 'rgba(74,222,128,.2)' : 'rgba(255,255,255,.07)',
                border: `2px solid ${feedback && c === q.answer ? '#4ade80' : 'rgba(255,255,255,.1)'}`,
                color: '#fff', cursor: 'pointer',
              }}>{c}</button>
            ))}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <div style={{ fontWeight: 900, color: '#fbbf24', fontSize: 20 }}>📖 {score}/{questions.length} rätt!</div>
          <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
