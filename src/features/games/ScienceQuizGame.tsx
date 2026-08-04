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
  { question: 'Vad är det kemiska tecknet för vatten?', answer: 'H₂O', options: ['H₂O', 'CO₂', 'NaCl', 'O₂'] },
  { question: 'Hur många planeter finns i solsystemet?', answer: '8', options: ['8', '7', '9', '10'] },
  { question: 'Vad kallas ljusets hastighet (ca)?', answer: '300 000 km/s', options: ['300 000 km/s', '30 000 km/s', '3 000 km/s', '3 000 000 km/s'] },
  { question: 'Vilket grundämne har kemiskt tecken Fe?', answer: 'Järn', options: ['Järn', 'Fluor', 'Fosfor', 'Francium'] },
  { question: 'Vad kallas den minsta enheten i ett levande ting?', answer: 'Cellen', options: ['Cellen', 'Atomen', 'Molekylen', 'Proteinet'] },
  { question: 'Vilket organ pumpar blodet i kroppen?', answer: 'Hjärtat', options: ['Hjärtat', 'Lungan', 'Levern', 'Njuren'] },
  { question: 'Vad kallas processen som växter använder solljus?', answer: 'Fotosyntes', options: ['Fotosyntes', 'Andning', 'Fermentering', 'Osmos'] },
  { question: 'Vilket grundämne är vanligast i jordens atmosfär?', answer: 'Kväve', options: ['Kväve', 'Syre', 'Koldioxid', 'Argon'] },
  { question: 'Vad kallas ett djur som äter bara växter?', answer: 'Herbivore', options: ['Herbivore', 'Karnivore', 'Omnivore', 'Insektivore'] },
  { question: 'Hur lång tid tar det för ljuset att nå från solen till jorden?', answer: 'Ca 8 minuter', options: ['Ca 8 minuter', 'Ca 8 sekunder', 'Ca 8 timmar', 'Ca 8 dagar'] },
  { question: 'Vad är DNA en förkortning för?', answer: 'Deoxiribonukleinsyra', options: ['Deoxiribonukleinsyra', 'Direktnukleinsyra', 'Dubbelnukleinsyra', 'Datanukleinsyra'] },
  { question: 'Vilken planet är närmast solen?', answer: 'Merkurius', options: ['Merkurius', 'Venus', 'Mars', 'Jorden'] },
  { question: 'Vad kallas temperaturen vid vilken vatten kokar (vid havsyta)?', answer: '100°C', options: ['100°C', '90°C', '80°C', '212°C'] },
  { question: 'Vilket grundämne har atomnummer 1?', answer: 'Väte', options: ['Väte', 'Helium', 'Litium', 'Syre'] },
  { question: 'Vad är tyngdaccelerationen på jordens yta (ca)?', answer: '9,8 m/s²', options: ['9,8 m/s²', '8,9 m/s²', '10,8 m/s²', '1,6 m/s²'] },
  { question: 'Vad kallas delarna i en atom?', answer: 'Protoner, neutroner, elektroner', options: ['Protoner, neutroner, elektroner', 'Molekyler, atomer, celler', 'Kvarkar, leptoner, bosoner', 'Positroner, antineutroner, positoner'] },
  { question: 'Hur många ben har en spindel?', answer: '8', options: ['8', '6', '10', '12'] },
  { question: 'Vilket är det tyngsta grundämnet som förekommer naturligt?', answer: 'Uran', options: ['Uran', 'Plutonium', 'Guld', 'Bly'] },
  { question: 'Vad kallas en måne som kretsar runt en planet?', answer: 'Satellit', options: ['Satellit', 'Asteroid', 'Komet', 'Meteor'] },
  { question: 'Vad producerar en stjärna energi av?', answer: 'Kärnfusion', options: ['Kärnfusion', 'Kärnfission', 'Förbränning', 'Elektrolys'] },
]

function pickQ(_difficulty: number): Q {
  const q = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)]
  const shuffled = [...q.options].sort(() => Math.random() - 0.5)
  return { ...q, options: shuffled }
}

export const ScienceQuizGame = memo(function ScienceQuizGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'play' | 'feedback' | 'done'>('ready')
  const [round, setRound] = useState(0)
  const [q, setQ] = useState(() => pickQ(0))
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT)
  const [score, setScore] = useState(0)
  const [wasCorrect, setWasCorrect] = useState(false)
  const [chosen, setChosen] = useState<string | null>(null)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_sci_best') ?? 0))
  const scoreRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const toRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const answeredRef = useRef(false)

  const nextRound = useCallback((r: number) => {
    if (r >= ROUNDS) {
      const s = scoreRef.current
      const prev = Number(localStorage.getItem('k0509_sci_best') ?? 0)
      if (s > prev) localStorage.setItem('k0509_sci_best', String(s))
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

  const accent = '#818cf8'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🔬 Naturvetenskap</span>
        <span className={styles.scoreDisplay}>{score}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🔬</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Naturvetenskap</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Naturvetenskap-trivia! {TIME_LIMIT} sek per fråga, {ROUNDS} ronder. Fysik, kemi och biologi!
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}/{ROUNDS}</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'play' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--t3)' }}>Runda {round + 1}/{ROUNDS}</div>
            <div style={{ fontSize: 13, color: timeLeft <= 3 ? '#f87171' : '#4ade80', fontWeight: 900 }}>⏱ {timeLeft}s</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,.05)', borderRadius: 18, padding: '20px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', lineHeight: 1.5 }}>{q.question}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {q.options.map((opt, i) => (
              <button key={i} onClick={() => answer(opt)} style={{ height: 64, borderRadius: 16, fontSize: 11, fontWeight: 700, background: 'rgba(129,140,248,.1)', color: accent, border: '2px solid rgba(129,140,248,.3)', cursor: 'pointer', padding: '0 6px', lineHeight: 1.3 }}>{opt}</button>
            ))}
          </div>
        </div>
      )}

      {phase === 'feedback' && (
        <div style={{ padding: '32px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 48 }}>{wasCorrect ? '✅' : '❌'}</div>
          <div style={{ fontSize: 13, color: 'var(--t3)', maxWidth: 280, lineHeight: 1.5 }}>{q.question}</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: accent }}>{q.answer}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: wasCorrect ? '#4ade80' : '#f87171' }}>
            {wasCorrect ? 'Rätt! 🔬' : chosen === '--' ? 'Timeout!' : `Fel! Du valde: ${chosen}`}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{score >= 8 ? '🏆' : score >= 6 ? '⭐' : '🔬'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{score} / {ROUNDS}</div>
          <div style={{ fontSize: 13, color: score >= 8 ? '#4ade80' : '#fbbf24' }}>
            {score === 10 ? 'PERFEKT! 🏆' : score >= 8 ? 'Utmärkt! ⭐' : score >= 6 ? 'Bra! 👍' : 'Öva mer! 🔬'}
          </div>
          {score > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{score * 16}🪙 +{score * 48} XP</div>
          <button className="btn-primary" style={{ padding: '14px 32px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
