import { memo, useState, useCallback, useRef, useEffect } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const ROUNDS = 10
const SHOW_TIME = 2000
const ANSWER_TIME = 5

type Q = { sentence: string; question: string; answer: string; options: string[] }

const QUESTIONS: Q[] = [
  { sentence: 'Katten sitter på mattan och sover.', question: 'Var sitter katten?', answer: 'På mattan', options: ['På mattan', 'På soffan', 'Under bordet', 'Vid fönstret'] },
  { sentence: 'Lisa köpte tre äpplen och ett päron.', question: 'Hur många äpplen köpte Lisa?', answer: 'Tre', options: ['Tre', 'Ett', 'Fyra', 'Två'] },
  { sentence: 'Solen skiner och det är 22 grader varmt.', question: 'Hur varmt är det?', answer: '22 grader', options: ['22 grader', '20 grader', '25 grader', '18 grader'] },
  { sentence: 'Erik cyklar till skolan varje måndag och onsdag.', question: 'Vilka dagar cyklar Erik?', answer: 'Måndag och onsdag', options: ['Måndag och onsdag', 'Tisdag och torsdag', 'Fredag och lördag', 'Måndag och fredag'] },
  { sentence: 'Biblioteket öppnar kl 09:00 och stänger kl 18:00.', question: 'När stänger biblioteket?', answer: '18:00', options: ['18:00', '17:00', '19:00', '20:00'] },
  { sentence: 'Det finns sju dagar i en vecka och fyra veckor i en månad.', question: 'Hur många dagar finns det i en vecka?', answer: 'Sju', options: ['Sju', 'Sex', 'Åtta', 'Fem'] },
  { sentence: 'Maja och Jonas spelade fotboll i parken igår.', question: 'Var spelade de fotboll?', answer: 'I parken', options: ['I parken', 'På stranden', 'I skolan', 'Hemma'] },
  { sentence: 'Bilen är röd och har fyra dörrar.', question: 'Hur många dörrar har bilen?', answer: 'Fyra', options: ['Fyra', 'Två', 'Tre', 'Fem'] },
  { sentence: 'Hunden heter Max och är tre år gammal.', question: 'Hur gammal är Max?', answer: 'Tre år', options: ['Tre år', 'Fem år', 'Två år', 'Ett år'] },
  { sentence: 'Farmor bor i ett gult hus med en stor trädgård.', question: 'Vilket färg har farmors hus?', answer: 'Gult', options: ['Gult', 'Rött', 'Blått', 'Vitt'] },
  { sentence: 'I Sverige firar vi midsommar i juni månad.', question: 'Vilken månad är midsommar?', answer: 'Juni', options: ['Juni', 'Juli', 'Maj', 'Augusti'] },
  { sentence: 'Pojken köpte en glass för tjugo kronor.', question: 'Hur mycket kostade glassen?', answer: 'Tjugo kronor', options: ['Tjugo kronor', 'Tio kronor', 'Trettio kronor', 'Femton kronor'] },
  { sentence: 'Fågeln flög högt upp i den blå himlen.', question: 'Vilken färg var himlen?', answer: 'Blå', options: ['Blå', 'Grå', 'Röd', 'Vit'] },
  { sentence: 'Anna läser sin bok varje kväll innan hon sover.', question: 'När läser Anna?', answer: 'Varje kväll', options: ['Varje kväll', 'Varje morgon', 'På lunchen', 'På eftermiddagen'] },
  { sentence: 'Sverige har tre kronor som nationssymbol.', question: 'Vad är Sveriges nationssymbol?', answer: 'Tre kronor', options: ['Tre kronor', 'En lejon', 'En björn', 'En örn'] },
]

function pickQ(_difficulty: number): Q {
  const q = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)]
  const shuffled = [...q.options].sort(() => Math.random() - 0.5)
  return { ...q, options: shuffled }
}

export const SpeedReadSweGame = memo(function SpeedReadSweGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'show' | 'answer' | 'feedback' | 'done'>('ready')
  const [round, setRound] = useState(0)
  const [q, setQ] = useState(() => pickQ(0))
  const [timeLeft, setTimeLeft] = useState(ANSWER_TIME)
  const [score, setScore] = useState(0)
  const [wasCorrect, setWasCorrect] = useState(false)
  const [chosen, setChosen] = useState<string | null>(null)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_srs_best') ?? 0))
  const scoreRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const toRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const answeredRef = useRef(false)

  const nextRound = useCallback((r: number) => {
    if (r >= ROUNDS) {
      const s = scoreRef.current
      const prev = Number(localStorage.getItem('k0509_srs_best') ?? 0)
      if (s > prev) localStorage.setItem('k0509_srs_best', String(s))
      onWin(s * 16, s * 48)
      setPhase('done')
      audio.achievement()
      return
    }
    answeredRef.current = false
    const newQ = pickQ(r)
    setQ(newQ)
    setChosen(null)
    setTimeLeft(ANSWER_TIME)
    setRound(r)
    setPhase('show')
    toRef.current = setTimeout(() => setPhase('answer'), SHOW_TIME)
  }, [onWin])

  useEffect(() => {
    if (phase !== 'answer') return
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
    if (phase !== 'answer' || answeredRef.current) return
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

  const accent = '#c084fc'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>📖 Läsförståelse</span>
        <span className={styles.scoreDisplay}>{score}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>📖</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Läsförståelse</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Läs meningen snabbt — den försvinner! Svara sedan på frågan. {ROUNDS} ronder.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}/{ROUNDS}</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'show' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 11, color: accent, fontWeight: 900, textAlign: 'center' }}>Läs noga!</div>
          <div style={{ background: 'rgba(192,132,252,.08)', borderRadius: 18, padding: '28px 16px', minHeight: 140, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', lineHeight: 1.7, textAlign: 'center' }}>{q.sentence}</div>
          </div>
        </div>
      )}

      {phase === 'answer' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--t3)' }}>Runda {round + 1}/{ROUNDS}</div>
            <div style={{ fontSize: 13, color: timeLeft <= 2 ? '#f87171' : '#4ade80', fontWeight: 900 }}>⏱ {timeLeft}s</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,.05)', borderRadius: 18, padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: accent }}>{q.question}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {q.options.map((opt, i) => (
              <button key={i} onClick={() => answer(opt)} style={{ height: 64, borderRadius: 16, fontSize: 12, fontWeight: 700, background: 'rgba(192,132,252,.1)', color: accent, border: '2px solid rgba(192,132,252,.3)', cursor: 'pointer', padding: '0 8px', lineHeight: 1.3 }}>{opt}</button>
            ))}
          </div>
        </div>
      )}

      {phase === 'feedback' && (
        <div style={{ padding: '32px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 48 }}>{wasCorrect ? '✅' : '❌'}</div>
          <div style={{ fontSize: 13, color: 'var(--t3)', maxWidth: 280, lineHeight: 1.5 }}>{q.sentence}</div>
          <div style={{ fontSize: 13, color: accent, fontWeight: 700 }}>{q.question}</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>{q.answer}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: wasCorrect ? '#4ade80' : '#f87171' }}>
            {wasCorrect ? 'Rätt! 📖' : chosen === '--' ? 'Timeout!' : `Fel! Du svarade: ${chosen}`}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{score >= 8 ? '🏆' : score >= 6 ? '⭐' : '📖'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{score} / {ROUNDS}</div>
          <div style={{ fontSize: 13, color: score >= 8 ? '#4ade80' : '#fbbf24' }}>
            {score === 10 ? 'PERFEKT! 🏆' : score >= 8 ? 'Utmärkt! ⭐' : score >= 6 ? 'Bra! 👍' : 'Öva mer! 📖'}
          </div>
          {score > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{score * 16}🪙 +{score * 48} XP</div>
          <button className="btn-primary" style={{ padding: '14px 32px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
