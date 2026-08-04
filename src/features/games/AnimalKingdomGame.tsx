import { memo, useState, useCallback, useRef, useEffect } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const ROUNDS = 10
const TIME_LIMIT = 9

type Q = { question: string; answer: string; options: string[] }

const QUESTIONS: Q[] = [
  { question: 'Vilket djur är världens snabbaste på land?', answer: 'Gepard', options: ['Gepard', 'Lejon', 'Gasell', 'Häst'] },
  { question: 'Hur många hjärtan har en bläckfisk?', answer: 'Tre', options: ['Tre', 'Ett', 'Två', 'Fyra'] },
  { question: 'Vilket djur sover stående?', answer: 'Häst', options: ['Häst', 'Ko', 'Elefant', 'Giraff'] },
  { question: 'Vad kallas en grupp vargar?', answer: 'Flock', options: ['Flock', 'Stim', 'Kull', 'Pack'] },
  { question: 'Hur länge kan en kamel överleva utan vatten?', answer: '2 veckor', options: ['2 veckor', '3 dagar', '1 månad', '1 vecka'] },
  { question: 'Vilket djur har det längsta minnet bland landlevande?', answer: 'Elefant', options: ['Elefant', 'Delfin', 'Schimpans', 'Korp'] },
  { question: 'Vad heter ett hondjur av get?', answer: 'Get', options: ['Get', 'Killing', 'Tik', 'Sto'] },
  { question: 'Vilket är världens tyngsta djur?', answer: 'Blåval', options: ['Blåval', 'Elefant', 'Flodhäst', 'Vit haj'] },
  { question: 'Vilket djur har den längsta tungan?', answer: 'Giraffkalv', options: ['Giraffkalv', 'Kameleon', 'Myrslok', 'Giraff'] },
  { question: 'Hur många ben har ett spindel?', answer: 'Åtta', options: ['Åtta', 'Sex', 'Tolv', 'Tio'] },
  { question: 'Vilket djur kan ändra kön under livet?', answer: 'Klovfisk', options: ['Klovfisk', 'Bläckfisk', 'Sjöhäst', 'Lax'] },
  { question: 'Vad kallas ett ungt lejon?', answer: 'Lejonunge', options: ['Lejonunge', 'Valp', 'Kub', 'Kattunge'] },
  { question: 'Vilket djur bär sitt hem på ryggen?', answer: 'Sköldpadda', options: ['Sköldpadda', 'Snäcka', 'Krabba', 'Hummar'] },
  { question: 'Hur många arter av pingviner finns det?', answer: '18', options: ['18', '12', '24', '8'] },
  { question: 'Vilket djur är det giftigaste i världen?', answer: 'Boxmanet', options: ['Boxmanet', 'Kobra', 'Spinnerspindel', 'Pilgiftgroda'] },
  { question: 'Vad kallas en grupp katter?', answer: 'Litter', options: ['Litter', 'Flock', 'Kull', 'Pack'] },
  { question: 'Vilket djur har svart och vit randig päls och lever i Afrika?', answer: 'Zebra', options: ['Zebra', 'Bäver', 'Panda', 'Skunk'] },
  { question: 'Hur ser en flamingo ut när den föds?', answer: 'Grå och vit', options: ['Grå och vit', 'Rosa', 'Brun', 'Gul'] },
  { question: 'Vilket djur lever längst av alla?', answer: 'Grönlandshaj', options: ['Grönlandshaj', 'Jättekorall', 'Sköldpadda', 'Elefant'] },
  { question: 'Vad kallas honan av en räv?', answer: 'Rävsöta', options: ['Rävsöta', 'Hon-räv', 'Vixen', 'Tik'] },
]

function pickQ(_difficulty: number): Q {
  const q = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)]
  return { ...q, options: [...q.options].sort(() => Math.random() - 0.5) }
}

export const AnimalKingdomGame = memo(function AnimalKingdomGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'play' | 'feedback' | 'done'>('ready')
  const [round, setRound] = useState(0)
  const [q, setQ] = useState(() => pickQ(0))
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT)
  const [score, setScore] = useState(0)
  const [wasCorrect, setWasCorrect] = useState(false)
  const [chosen, setChosen] = useState<string | null>(null)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_ank_best') ?? 0))
  const scoreRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const toRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const answeredRef = useRef(false)

  const nextRound = useCallback((r: number) => {
    if (r >= ROUNDS) {
      const s = scoreRef.current
      const prev = Number(localStorage.getItem('k0509_ank_best') ?? 0)
      if (s > prev) localStorage.setItem('k0509_ank_best', String(s))
      onWin(s * 16, s * 48)
      setPhase('done')
      audio.achievement()
      return
    }
    answeredRef.current = false
    setQ(pickQ(r))
    setChosen(null)
    setTimeLeft(TIME_LIMIT)
    setRound(r)
    setPhase('play')
  }, [onWin])

  useEffect(() => {
    if (phase !== 'play') return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
          if (!answeredRef.current) {
            answeredRef.current = true
            setWasCorrect(false)
            setChosen('--')
            setPhase('feedback')
            audio.click()
            toRef.current = setTimeout(() => nextRound(round + 1), 900)
          }
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase, round, nextRound])

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (toRef.current) clearTimeout(toRef.current)
  }, [])

  const answer = useCallback((val: string) => {
    if (phase !== 'play' || answeredRef.current) return
    answeredRef.current = true
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    const correct = val === q.answer
    setWasCorrect(correct)
    setChosen(val)
    if (correct) { scoreRef.current++; setScore(scoreRef.current); audio.coin() } else { audio.click() }
    setPhase('feedback')
    toRef.current = setTimeout(() => nextRound(round + 1), 900)
  }, [phase, q, round, nextRound])

  const start = useCallback(() => {
    scoreRef.current = 0
    setScore(0)
    nextRound(0)
  }, [nextRound])

  const accent = '#4ade80'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🦁 Djurriket</span>
        <span className={styles.scoreDisplay}>{score}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🦁</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Djurriket</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Fakta om djur från hela världen! Från snabbaste till giftigaste. {TIME_LIMIT} sek, {ROUNDS} ronder.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}/{ROUNDS}</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'play' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--t3)' }}>Runda {round + 1}/{ROUNDS}</div>
            <div style={{ fontSize: 13, color: timeLeft <= 2 ? '#f87171' : '#4ade80', fontWeight: 900 }}>⏱ {timeLeft}s</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,.05)', borderRadius: 18, padding: '24px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', lineHeight: 1.6 }}>{q.question}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {q.options.map((opt, i) => (
              <button key={i} onClick={() => answer(opt)} style={{ height: 64, borderRadius: 16, fontSize: 13, fontWeight: 700, background: 'rgba(74,222,128,.1)', color: accent, border: '2px solid rgba(74,222,128,.3)', cursor: 'pointer', padding: '0 6px', lineHeight: 1.3 }}>{opt}</button>
            ))}
          </div>
        </div>
      )}

      {phase === 'feedback' && (
        <div style={{ padding: '32px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 48 }}>{wasCorrect ? '✅' : '❌'}</div>
          <div style={{ fontSize: 14, color: 'var(--t3)', lineHeight: 1.5 }}>{q.question}</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: accent }}>{q.answer}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: wasCorrect ? '#4ade80' : '#f87171' }}>
            {wasCorrect ? 'Rätt! 🦁' : chosen === '--' ? 'Timeout!' : `Fel! Du valde: ${chosen}`}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{score >= 8 ? '🏆' : score >= 6 ? '⭐' : '🦁'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{score} / {ROUNDS}</div>
          <div style={{ fontSize: 13, color: score >= 8 ? '#4ade80' : '#fbbf24' }}>
            {score === 10 ? 'PERFEKT! 🏆' : score >= 8 ? 'Utmärkt! ⭐' : score >= 6 ? 'Bra! 👍' : 'Öva mer! 🦁'}
          </div>
          {score > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{score * 16}🪙 +{score * 48} XP</div>
          <button className="btn-primary" style={{ padding: '14px 32px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
