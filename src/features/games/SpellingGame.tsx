import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const WORDS = [
  { correct: 'kommunikation', options: ['kommunikaion', 'kommunikation', 'kommunikattion', 'commuikation'] },
  { correct: 'acceptera', options: ['akceptera', 'acceptera', 'axceptera', 'aceptera'] },
  { correct: 'profession', options: ['proffecion', 'profeshion', 'profession', 'profesion'] },
  { correct: 'bibliotek', options: ['bibilotek', 'bibliotek', 'bibletotek', 'biblitotek'] },
  { correct: 'specifik', options: ['specifik', 'spesifik', 'specifick', 'speciffik'] },
  { correct: 'atmosfär', options: ['atmosfär', 'atmosfaer', 'atmosfaär', 'atmosfær'] },
  { correct: 'ambulans', options: ['ambulens', 'ambuulans', 'ambulans', 'ambulanz'] },
  { correct: 'katastrofal', options: ['katastrofal', 'katastrofell', 'katastrofäl', 'catastrofal'] },
  { correct: 'intelligens', options: ['intelligens', 'intelligenns', 'intelligenz', 'intelligenes'] },
  { correct: 'extraordinär', options: ['extaordinär', 'extraordinär', 'extraordinaär', 'extraordinær'] },
  { correct: 'civilisation', options: ['sivlisation', 'civilisation', 'civilisacion', 'civilisasion'] },
  { correct: 'garderob', options: ['gardrob', 'garderop', 'garderob', 'garederob'] },
  { correct: 'halvtid', options: ['halftid', 'halvtid', 'halvttid', 'halvtide'] },
  { correct: 'karantän', options: ['quarantän', 'karrantän', 'karantän', 'karantaen'] },
  { correct: 'parallell', options: ['parallell', 'parallel', 'paralell', 'paralell'] },
]

const ROUNDS = 10
const TIME_PER_Q = 8

export const SpellingGame = memo(function SpellingGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [pool, setPool] = useState<typeof WORDS>([])
  const [qi, setQi] = useState(0)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [shuffled, setShuffled] = useState<string[]>([])
  const [timeLeft, setTimeLeft] = useState(TIME_PER_Q)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_sp_best') ?? 0))
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const nextQ = useCallback((q: number, p: typeof WORDS) => {
    setQi(q)
    setShuffled([...p[q].options].sort(() => Math.random() - 0.5))
    setFeedback(null); setTimeLeft(TIME_PER_Q)
  }, [])

  const start = useCallback(() => {
    const shuffledPool = [...WORDS].sort(() => Math.random() - 0.5).slice(0, ROUNDS)
    setPool(shuffledPool); setScore(0); setStreak(0); setPhase('playing')
    setShuffled([...shuffledPool[0].options].sort(() => Math.random() - 0.5))
    setQi(0); setFeedback(null); setTimeLeft(TIME_PER_Q)
  }, [])

  useEffect(() => {
    if (phase !== 'playing' || feedback !== null) return
    timerRef.current = setInterval(() => setTimeLeft(t => {
      if (t <= 1) {
        if (timerRef.current) clearInterval(timerRef.current)
        setFeedback(`⏰ Rätt: ${pool[qi].correct}`)
        setStreak(0); audio.tap()
        setTimeout(() => {
          const nq = qi + 1
          if (nq >= ROUNDS) { finalize(score); return }
          nextQ(nq, pool)
        }, 1500)
        return 0
      }
      return t - 1
    }), 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase, qi, feedback, pool])

  const finalize = (s: number) => {
    const prev = Number(localStorage.getItem('k0509_sp_best') ?? 0)
    if (s > prev) localStorage.setItem('k0509_sp_best', String(s))
    if (s > 0) onWin(Math.round(s / 8), s)
    setPhase('done')
  }

  const pick = useCallback((opt: string) => {
    if (!pool[qi] || feedback !== null) return
    if (timerRef.current) clearInterval(timerRef.current)
    const ok = opt === pool[qi].correct
    const pts = ok ? Math.max(20, timeLeft * 10) + streak * 10 : 0
    const newScore = score + pts; const newStreak = ok ? streak + 1 : 0
    setFeedback(ok ? `✅ Rätt! +${pts}p` : `❌ Rätt: ${pool[qi].correct}`)
    audio[ok ? 'coin' : 'tap']()
    setTimeout(() => {
      const nq = qi + 1
      if (nq >= ROUNDS) { finalize(newScore); return }
      setScore(newScore); setStreak(newStreak); nextQ(nq, pool)
    }, 1300)
  }, [pool, qi, feedback, timeLeft, score, streak, nextQ])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>📝 Stavning</span>
        <span className={styles.scoreDisplay}>{score}p · {qi}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>📝</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Stavning</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Vilken stavning är korrekt? Välj rätt bland 4 alternativ. 10 runder med svenska ord.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}p</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && pool[qi] && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 3 }}>
            {Array.from({ length: TIME_PER_Q }, (_, i) => (
              <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i < timeLeft ? (timeLeft <= 3 ? '#f87171' : '#60a5fa') : 'rgba(255,255,255,.08)' }} />
            ))}
          </div>
          {streak >= 2 && <div style={{ textAlign: 'center', fontSize: 12, color: '#fbbf24', fontWeight: 700 }}>🔥 ×{streak}</div>}
          <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--t3)', padding: '8px', background: 'rgba(255,255,255,.04)', borderRadius: 12 }}>
            Vilken stavning är rätt?
          </div>
          {feedback
            ? <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: feedback.startsWith('✅') ? '#4ade80' : '#f87171' }}>{feedback}</div>
            : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {shuffled.map((opt, i) => (
                  <button key={i} onClick={() => pick(opt)} style={{ padding: '14px 16px', borderRadius: 14, fontSize: 14, fontWeight: 700, fontFamily: 'monospace', background: 'rgba(255,255,255,.06)', border: '2px solid rgba(255,255,255,.1)', color: '#e8e8f0', cursor: 'pointer', textAlign: 'left', letterSpacing: 0.5 }}>
                    {opt}
                  </button>
                ))}
              </div>
            )
          }
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <div style={{ fontWeight: 900, color: '#4ade80', fontSize: 20 }}>📝 {score}p!</div>
          <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
