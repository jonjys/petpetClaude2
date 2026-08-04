import { memo, useState, useCallback, useRef, useEffect } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const ROUNDS = 12
const TIME_LIMIT = 8

type QData = { question: string; answer: string; options: string[] }

const EASY: QData[] = [
  { question: 'Vilken är Sveriges huvudstad?', answer: 'Stockholm', options: ['Stockholm', 'Göteborg', 'Malmö', 'Uppsala'] },
  { question: 'Vilken är Frankrikes huvudstad?', answer: 'Paris', options: ['Paris', 'Lyon', 'Marseille', 'Nice'] },
  { question: 'Vilken är Tysklands huvudstad?', answer: 'Berlin', options: ['Berlin', 'München', 'Hamburg', 'Frankfurt'] },
  { question: 'Vilken är Italiens huvudstad?', answer: 'Rom', options: ['Rom', 'Milano', 'Neapel', 'Florens'] },
  { question: 'Vilken är Spaniens huvudstad?', answer: 'Madrid', options: ['Madrid', 'Barcelona', 'Sevilla', 'Valencia'] },
  { question: 'Vilket land är störst till ytan?', answer: 'Ryssland', options: ['Ryssland', 'Kanada', 'Kina', 'USA'] },
  { question: 'Vilket hav är störst?', answer: 'Stilla havet', options: ['Stilla havet', 'Atlanten', 'Indiska oceanen', 'Arktis'] },
  { question: 'Vilken flod är längst i världen?', answer: 'Nilen', options: ['Nilen', 'Amazonas', 'Mississippi', 'Yangtze'] },
]

const MEDIUM: QData[] = [
  { question: 'Vilken är Australiens huvudstad?', answer: 'Canberra', options: ['Canberra', 'Sydney', 'Melbourne', 'Brisbane'] },
  { question: 'Vilken är Brasiliens huvudstad?', answer: 'Brasilia', options: ['Brasilia', 'São Paulo', 'Rio de Janeiro', 'Salvador'] },
  { question: 'Vilken är Kanadas huvudstad?', answer: 'Ottawa', options: ['Ottawa', 'Toronto', 'Vancouver', 'Montréal'] },
  { question: 'Vilket land har flest invånare?', answer: 'Indien', options: ['Indien', 'Kina', 'USA', 'Indonesien'] },
  { question: 'Vilket berg är högst i världen?', answer: 'Mount Everest', options: ['Mount Everest', 'K2', 'Kangchenjunga', 'Lhotse'] },
  { question: 'Vilken är Japans huvudstad?', answer: 'Tokyo', options: ['Tokyo', 'Osaka', 'Kyoto', 'Hiroshima'] },
  { question: 'Vilket land är Amazonas i?', answer: 'Brasilien', options: ['Brasilien', 'Peru', 'Colombia', 'Venezuela'] },
  { question: 'Vilken är Egyptens huvudstad?', answer: 'Kairo', options: ['Kairo', 'Alexandria', 'Luxor', 'Aswan'] },
]

const HARD: QData[] = [
  { question: 'Vilken är Kazakhstans huvudstad?', answer: 'Astana', options: ['Astana', 'Almaty', 'Shymkent', 'Karaganda'] },
  { question: 'Vilken är Nya Zeelands huvudstad?', answer: 'Wellington', options: ['Wellington', 'Auckland', 'Christchurch', 'Hamilton'] },
  { question: 'Vilket land är minst i världen?', answer: 'Vatikanstaten', options: ['Vatikanstaten', 'Monaco', 'San Marino', 'Liechtenstein'] },
  { question: 'Vilket hav är djupast?', answer: 'Stilla havet', options: ['Stilla havet', 'Atlanten', 'Indiska oceanen', 'Arktis'] },
]

function makeQ(difficulty: number): QData {
  const pool = difficulty < 5 ? EASY : difficulty < 9 ? [...EASY, ...MEDIUM] : [...EASY, ...MEDIUM, ...HARD]
  const q = pool[Math.floor(Math.random() * pool.length)]
  const shuffled = [...q.options].sort(() => Math.random() - 0.5)
  return { ...q, options: shuffled }
}

export const GeographyQuizGame = memo(function GeographyQuizGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'play' | 'feedback' | 'done'>('ready')
  const [round, setRound] = useState(0)
  const [q, setQ] = useState(() => makeQ(0))
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT)
  const [score, setScore] = useState(0)
  const [wasCorrect, setWasCorrect] = useState(false)
  const [chosen, setChosen] = useState<string | null>(null)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_geo_best') ?? 0))
  const scoreRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const toRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const answeredRef = useRef(false)

  const nextRound = useCallback((r: number) => {
    if (r >= ROUNDS) {
      const s = scoreRef.current
      const prev = Number(localStorage.getItem('k0509_geo_best') ?? 0)
      if (s > prev) localStorage.setItem('k0509_geo_best', String(s))
      onWin(s * 15, s * 45)
      setPhase('done')
      audio.achievement()
      return
    }
    answeredRef.current = false
    setQ(makeQ(r))
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
            toRef.current = setTimeout(() => nextRound(round + 1), 1000)
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
    toRef.current = setTimeout(() => nextRound(round + 1), 1000)
  }, [phase, q, round, nextRound])

  const start = useCallback(() => {
    scoreRef.current = 0
    setScore(0)
    nextRound(0)
  }, [nextRound])

  const accent = '#38bdf8'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🌍 Geografi</span>
        <span className={styles.scoreDisplay}>{score}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🌍</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Geografi</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Geografi-trivia på svenska! {TIME_LIMIT} sek per fråga, {ROUNDS} ronder. Svårare frågor tillkommer!
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}/{ROUNDS}</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'play' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--t3)' }}>Runda {round + 1}/{ROUNDS}</div>
            <div style={{ fontSize: 13, color: timeLeft <= 2 ? '#f87171' : '#4ade80', fontWeight: 900 }}>⏱ {timeLeft}s</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,.05)', borderRadius: 18, padding: '20px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', lineHeight: 1.5 }}>{q.question}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {q.options.map((opt, i) => (
              <button key={i} onClick={() => answer(opt)} style={{ height: 60, borderRadius: 16, fontSize: 13, fontWeight: 700, background: 'rgba(56,189,248,.1)', color: accent, border: '2px solid rgba(56,189,248,.3)', cursor: 'pointer', padding: '0 8px' }}>{opt}</button>
            ))}
          </div>
        </div>
      )}

      {phase === 'feedback' && (
        <div style={{ padding: '32px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 48 }}>{wasCorrect ? '✅' : '❌'}</div>
          <div style={{ fontSize: 14, color: 'var(--t3)', maxWidth: 280, lineHeight: 1.5 }}>{q.question}</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: accent }}>{q.answer}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: wasCorrect ? '#4ade80' : '#f87171' }}>
            {wasCorrect ? 'Rätt! 🌍' : chosen === '--' ? 'Timeout!' : `Fel! Du valde ${chosen}`}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{score >= 10 ? '🏆' : score >= 7 ? '⭐' : '🌍'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{score} / {ROUNDS}</div>
          <div style={{ fontSize: 13, color: score >= 10 ? '#4ade80' : '#fbbf24' }}>
            {score === 12 ? 'PERFEKT! 🏆' : score >= 10 ? 'Utmärkt! ⭐' : score >= 7 ? 'Bra! 👍' : 'Öva mer! 🌍'}
          </div>
          {score > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{score * 15}🪙 +{score * 45} XP</div>
          <button className="btn-primary" style={{ padding: '14px 32px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
