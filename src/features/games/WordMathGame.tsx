import { memo, useState, useCallback, useRef, useEffect } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const ROUNDS = 10
const TIME_LIMIT = 10

type Q = { question: string; answer: string; options: string[] }

function uniqueFourStr(answer: string, gen: () => string): string[] {
  const seen = new Set([answer])
  const opts = [answer]
  let safety = 0
  while (opts.length < 4 && safety++ < 300) {
    const w = gen()
    if (!seen.has(w)) { seen.add(w); opts.push(w) }
  }
  let e = 0
  while (opts.length < 4) { const fb = `??${++e}`; if (!seen.has(fb)) { seen.add(fb); opts.push(fb) } }
  return opts.sort(() => Math.random() - 0.5)
}

type QDef = { question: string; answer: string; wrongs: string[] }

const EASY: QDef[] = [
  { question: 'Kalle har 8 äpplen. Han ger 3 till Sara. Hur många har Kalle kvar?', answer: '5', wrongs: ['3', '11', '4'] },
  { question: 'En bil kostar 200 kr. En cykel kostar 80 kr. Hur mycket kostar båda?', answer: '280 kr', wrongs: ['120 kr', '300 kr', '260 kr'] },
  { question: 'En låda har 4 rader med 6 chokladbitar. Hur många chokladbitar finns det?', answer: '24', wrongs: ['10', '20', '28'] },
  { question: 'Lisa springer 5 varv. Varje varv är 400 m. Hur långt springer hon?', answer: '2000 m', wrongs: ['1600 m', '2400 m', '800 m'] },
  { question: 'Klassen har 28 elever. 13 är flickor. Hur många är pojkar?', answer: '15', wrongs: ['13', '17', '11'] },
  { question: 'En pizza delas i 8 bitar. 3 bitar äts upp. Hur många bitar är kvar?', answer: '5', wrongs: ['3', '6', '4'] },
  { question: 'En buss har 40 platser. 25 passagerare sitter. Hur många platser är lediga?', answer: '15', wrongs: ['25', '20', '10'] },
  { question: 'Pelle tjänar 50 kr per timme. Han jobbar 6 timmar. Hur mycket tjänar han?', answer: '300 kr', wrongs: ['250 kr', '350 kr', '56 kr'] },
]

const MEDIUM: QDef[] = [
  { question: 'En affär säljer 3 kg äpplen för 45 kr. Vad kostar 1 kg?', answer: '15 kr', wrongs: ['10 kr', '20 kr', '12 kr'] },
  { question: 'Tåget avgår 08:15 och ankommer 11:45. Hur lång är resan?', answer: '3 tim 30 min', wrongs: ['3 tim', '4 tim', '2 tim 30 min'] },
  { question: '5 barn delar lika på 75 kr. Hur mycket får varje barn?', answer: '15 kr', wrongs: ['10 kr', '20 kr', '25 kr'] },
  { question: 'En rektangel är 8 cm bred och 5 cm hög. Hur stor är arean?', answer: '40 cm²', wrongs: ['26 cm²', '13 cm²', '45 cm²'] },
  { question: 'Emma har sparat 120 kr. Hon köper en bok för 85 kr. Hur mycket är kvar?', answer: '35 kr', wrongs: ['45 kr', '25 kr', '40 kr'] },
  { question: 'En klass reser 240 km. De kör 80 km/h. Hur lång tid tar resan?', answer: '3 timmar', wrongs: ['2 timmar', '4 timmar', '6 timmar'] },
  { question: '4 paket kostar 60 kr. Vad kostar 7 paket?', answer: '105 kr', wrongs: ['84 kr', '90 kr', '120 kr'] },
]

const HARD: QDef[] = [
  { question: 'En affär rabatterar en jacka från 800 kr med 25%. Vad kostar jackan nu?', answer: '600 kr', wrongs: ['700 kr', '550 kr', '650 kr'] },
  { question: 'En pool är 12 m × 6 m × 2 m. Hur många kubikmeter vatten ryms?', answer: '144 m³', wrongs: ['108 m³', '72 m³', '240 m³'] },
  { question: 'Karin cyklar 18 km på 45 minuter. Hur fort cyklar hon (km/h)?', answer: '24 km/h', wrongs: ['18 km/h', '20 km/h', '30 km/h'] },
  { question: 'En triangel har basen 10 cm och höjden 8 cm. Hur stor är arean?', answer: '40 cm²', wrongs: ['80 cm²', '32 cm²', '18 cm²'] },
  { question: '3/4 av eleverna i klassen är 30 st. Hur många elever finns i klassen?', answer: '40', wrongs: ['36', '45', '24'] },
]

function makeQ(difficulty: number): Q {
  let pool: QDef[]
  if (difficulty < 4) pool = EASY
  else if (difficulty < 7) pool = MEDIUM
  else pool = HARD

  const def = pool[Math.floor(Math.random() * pool.length)]
  return {
    question: def.question,
    answer: def.answer,
    options: uniqueFourStr(def.answer, () => def.wrongs[Math.floor(Math.random() * def.wrongs.length)]),
  }
}

export const WordMathGame = memo(function WordMathGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'play' | 'feedback' | 'done'>('ready')
  const [round, setRound] = useState(0)
  const [q, setQ] = useState(() => makeQ(0))
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT)
  const [score, setScore] = useState(0)
  const [wasCorrect, setWasCorrect] = useState(false)
  const [chosen, setChosen] = useState<string | null>(null)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_wmath_best') ?? 0))
  const scoreRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const toRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const answeredRef = useRef(false)

  const nextRound = useCallback((r: number) => {
    if (r >= ROUNDS) {
      const s = scoreRef.current
      const prev = Number(localStorage.getItem('k0509_wmath_best') ?? 0)
      if (s > prev) localStorage.setItem('k0509_wmath_best', String(s))
      onWin(s * 18, s * 54)
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

  const accent = '#34d399'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>📝 Textuppgifter</span>
        <span className={styles.scoreDisplay}>{score}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>📝</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Textuppgifter</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Lös matteproblem i text! Läs noga och räkna ut svaret. {TIME_LIMIT} sek, {ROUNDS} ronder.
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
          <div style={{ background: 'rgba(255,255,255,.05)', borderRadius: 18, padding: '20px 14px', textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', lineHeight: 1.7 }}>{q.question}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {q.options.map((opt, i) => (
              <button key={i} onClick={() => answer(opt)} style={{ height: 56, borderRadius: 16, fontSize: 15, fontWeight: 900, background: 'rgba(52,211,153,.1)', color: accent, border: '2px solid rgba(52,211,153,.3)', cursor: 'pointer', padding: '0 6px' }}>{opt}</button>
            ))}
          </div>
        </div>
      )}

      {phase === 'feedback' && (
        <div style={{ padding: '28px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 48 }}>{wasCorrect ? '✅' : '❌'}</div>
          <div style={{ fontSize: 13, color: 'var(--t3)', lineHeight: 1.6, maxWidth: 300 }}>{q.question}</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: accent }}>{q.answer}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: wasCorrect ? '#4ade80' : '#f87171' }}>
            {wasCorrect ? 'Rätt! 📝' : chosen === '--' ? 'Timeout!' : `Fel! Du valde: ${chosen}`}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{score >= 8 ? '🏆' : score >= 6 ? '⭐' : '📝'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{score} / {ROUNDS}</div>
          <div style={{ fontSize: 13, color: score >= 8 ? '#4ade80' : '#fbbf24' }}>
            {score === 10 ? 'PERFEKT! 🏆' : score >= 8 ? 'Utmärkt! ⭐' : score >= 6 ? 'Bra! 👍' : 'Öva mer! 📝'}
          </div>
          {score > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{score * 18}🪙 +{score * 54} XP</div>
          <button className="btn-primary" style={{ padding: '14px 32px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
