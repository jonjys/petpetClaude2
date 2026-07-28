import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

interface Question {
  q: string
  opts: string[]
  correct: number
  category: string
}

const QUESTIONS: Question[] = [
  { q: 'Vilket land har flest invånare?', opts: ['Indien', 'Kina', 'USA', 'Brasilien'], correct: 0, category: '🌍 Geografi' },
  { q: 'Vad är Pi (π) avrundat till 2 decimaler?', opts: ['3.14', '3.16', '3.12', '3.18'], correct: 0, category: '🔢 Matte' },
  { q: 'Vilken planet är störst i solsystemet?', opts: ['Jupiter', 'Saturn', 'Uranus', 'Mars'], correct: 0, category: '🌌 Rymden' },
  { q: 'Hur många sidor har en hexagon?', opts: ['6', '7', '5', '8'], correct: 0, category: '🔢 Matte' },
  { q: 'Vad heter Frankrikes huvudstad?', opts: ['Paris', 'Lyon', 'Berlin', 'Madrid'], correct: 0, category: '🌍 Geografi' },
  { q: 'Vilket element har kemisk beteckning Au?', opts: ['Guld', 'Silver', 'Aluminium', 'Koppar'], correct: 0, category: '🧪 Kemi' },
  { q: 'Hur många månader har ett år?', opts: ['12', '10', '14', '11'], correct: 0, category: '📅 Allmänt' },
  { q: 'Vad är huvudstaden i Japan?', opts: ['Tokyo', 'Osaka', 'Kyoto', 'Hiroshima'], correct: 0, category: '🌍 Geografi' },
  { q: 'Hur fort färdas ljuset? (km/s)', opts: ['300 000', '150 000', '450 000', '200 000'], correct: 0, category: '🌌 Rymden' },
  { q: 'Vilken är jordens största ocean?', opts: ['Stilla havet', 'Atlanten', 'Indiska oceanen', 'Arktiska havet'], correct: 0, category: '🌊 Natur' },
  { q: 'Vilken siffra är inte primtal?', opts: ['4', '3', '7', '11'], correct: 0, category: '🔢 Matte' },
  { q: 'Vilket djur är snabbast på land?', opts: ['Gepard', 'Lejon', 'Häst', 'Känguru'], correct: 0, category: '🐾 Djur' },
  { q: 'Vad heter Sveriges kung?', opts: ['Carl XVI Gustaf', 'Erik XIV', 'Oscar II', 'Gustav V'], correct: 0, category: '👑 Sverige' },
  { q: 'Hur många bitar är en byte?', opts: ['8', '16', '4', '12'], correct: 0, category: '💻 Tech' },
  { q: 'Vilken är den vanligaste färgen på stoppskyltar?', opts: ['Röd', 'Gul', 'Grön', 'Vit'], correct: 0, category: '🚗 Trafik' },
]

const TIME_PER_Q = 10
const TOTAL_Q = 7

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildRound(): Question[] {
  return shuffle(QUESTIONS).slice(0, TOTAL_Q)
}

export const QuizGame = memo(function QuizGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [questions, setQuestions] = useState<Question[]>([])
  const [qIdx, setQIdx] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [correct, setCorrect] = useState(0)
  const [timeLeft, setTimeLeft] = useState(TIME_PER_Q)
  const [streak, setStreak] = useState(0)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_quiz_best') ?? 0))
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const nextQ = useCallback((wasCorrect: boolean) => {
    const newStreak = wasCorrect ? streak + 1 : 0
    setStreak(newStreak)
    if (wasCorrect) setCorrect(c => c + 1)
    setTimeout(() => {
      setSelected(null)
      if (qIdx + 1 >= questions.length) {
        setPhase('done')
      } else {
        setQIdx(q => q + 1)
        setTimeLeft(TIME_PER_Q)
      }
    }, 700)
  }, [streak, qIdx, questions.length])

  useEffect(() => {
    if (phase !== 'playing') return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          setSelected(-1)
          nextQ(false)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase, qIdx, nextQ])

  const start = useCallback(() => {
    const qs = buildRound()
    setQuestions(qs)
    setQIdx(0); setCorrect(0); setStreak(0); setSelected(null)
    setTimeLeft(TIME_PER_Q)
    setPhase('playing')
  }, [])

  const pick = useCallback((idx: number) => {
    if (selected !== null || phase !== 'playing') return
    if (timerRef.current) clearInterval(timerRef.current)
    setSelected(idx)
    const isCorrect = idx === questions[qIdx].correct
    if (isCorrect) audio.coin(); else audio.click()
    nextQ(isCorrect)
  }, [selected, phase, questions, qIdx, nextQ])

  useEffect(() => {
    if (phase === 'done') {
      const prev = Number(localStorage.getItem('k0509_quiz_best') ?? 0)
      if (correct > prev) localStorage.setItem('k0509_quiz_best', String(correct))
      const coins = correct * 10 + (correct >= TOTAL_Q ? 50 : 0)
      const xp = correct * 12
      onWin(coins, xp)
      audio.achievement()
    }
  }, [phase, correct, onWin])

  const q = questions[qIdx]
  const timerColor = timeLeft > 6 ? '#4ade80' : timeLeft > 3 ? '#fbbf24' : '#f87171'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🧠 Quiz</span>
        <span className={styles.scoreDisplay}>{correct}/{qIdx}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🧠</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Trivia Quiz</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260 }}>
            {TOTAL_Q} frågor · {TIME_PER_Q} sekunder per fråga · +10🪙 per rätt svar
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}/{TOTAL_Q}</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && q && (
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Progress & timer */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,.1)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${((qIdx) / TOTAL_Q) * 100}%`, background: 'var(--purple)', borderRadius: 2, transition: 'width .3s' }} />
            </div>
            <div style={{ fontSize: 12, fontWeight: 900, color: timerColor, minWidth: 24, textAlign: 'right' }}>{timeLeft}s</div>
          </div>

          {/* Category & timer bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--purple)', fontWeight: 700 }}>{q.category}</span>
            <span style={{ fontSize: 11, color: 'var(--t3)' }}>Q{qIdx + 1}/{TOTAL_Q}</span>
          </div>

          {/* Question */}
          <div style={{
            background: 'rgba(255,255,255,.05)', borderRadius: 16, padding: '18px 16px',
            textAlign: 'center', border: '1px solid rgba(255,255,255,.08)',
          }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', lineHeight: 1.4 }}>{q.q}</div>
          </div>

          {/* Timer bar */}
          <div style={{ height: 4, background: 'rgba(255,255,255,.08)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(timeLeft / TIME_PER_Q) * 100}%`, background: timerColor, borderRadius: 2, transition: 'width 1s linear, background .3s' }} />
          </div>

          {/* Options */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {q.opts.map((opt, i) => {
              const isSelected = selected === i
              const isCorrect = i === q.correct
              const showResult = selected !== null
              const bg = !showResult ? 'rgba(255,255,255,.05)'
                : isCorrect ? 'rgba(74,222,128,.2)'
                : isSelected ? 'rgba(248,113,113,.2)'
                : 'rgba(255,255,255,.03)'
              const border = !showResult ? 'rgba(255,255,255,.1)'
                : isCorrect ? 'rgba(74,222,128,.5)'
                : isSelected ? 'rgba(248,113,113,.5)'
                : 'rgba(255,255,255,.05)'
              return (
                <button
                  key={i}
                  onClick={() => pick(i)}
                  style={{
                    padding: '14px 10px', borderRadius: 14,
                    background: bg, border: `1px solid ${border}`,
                    color: showResult && isCorrect ? '#4ade80' : showResult && isSelected ? '#f87171' : '#e8e8f0',
                    fontSize: 13, fontWeight: 700, cursor: 'pointer', lineHeight: 1.3,
                    transition: 'all .15s',
                  }}
                >
                  {opt}
                </button>
              )
            })}
          </div>

          {streak >= 3 && <div style={{ textAlign: 'center', fontSize: 12, color: '#fbbf24' }}>🔥 {streak}x streak!</div>}
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{correct >= TOTAL_Q ? '🏆' : correct >= Math.ceil(TOTAL_Q/2) ? '⭐' : '📊'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{correct}/{TOTAL_Q}</div>
          <div style={{ fontSize: 14, color: correct >= TOTAL_Q ? '#4ade80' : correct >= Math.ceil(TOTAL_Q/2) ? '#fbbf24' : '#888' }}>
            {correct >= TOTAL_Q ? 'PERFEKT! 🌟' : correct >= Math.ceil(TOTAL_Q/2)+1 ? 'Jättebra! ⭐' : correct >= Math.ceil(TOTAL_Q/2) ? 'Bra! 👍' : 'Öva mer! 💪'}
          </div>
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{correct * 10 + (correct >= TOTAL_Q ? 50 : 0)}🪙{correct >= TOTAL_Q ? ' (bonus!)' : ''}</div>
          {correct > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', marginTop: 8 }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
