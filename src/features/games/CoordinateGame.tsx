import { memo, useState, useCallback, useRef, useEffect } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const ROUNDS = 12
const TIME_LIMIT = 8

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

const COORD_Q: QDef[] = [
  { question: 'Vilken koordinat är punkten om x=3 och y=4?', answer: '(3, 4)', wrongs: ['(4, 3)', '(3, -4)', '(-3, 4)'] },
  { question: 'Punkten (−2, 5) — i vilken kvadrant?', answer: 'Kvadrant II', wrongs: ['Kvadrant I', 'Kvadrant III', 'Kvadrant IV'] },
  { question: 'Vad är avståndet från (0,0) till (3,4)?', answer: '5', wrongs: ['7', '4', '6'] },
  { question: 'Vilket x-värde har punkten (7, −3)?', answer: '7', wrongs: ['-3', '3', '4'] },
  { question: 'Vilket y-värde har punkten (−5, 2)?', answer: '2', wrongs: ['-5', '5', '-2'] },
  { question: 'Punkten (4, 0) ligger på...?', answer: 'x-axeln', wrongs: ['y-axeln', 'Kvadrant I', 'Origo'] },
  { question: 'Punkten (0, −3) ligger på...?', answer: 'y-axeln', wrongs: ['x-axeln', 'Kvadrant III', 'Origo'] },
  { question: 'Vilka koordinater är origo?', answer: '(0, 0)', wrongs: ['(1, 0)', '(0, 1)', '(1, 1)'] },
  { question: 'Punkten (−4, −2) — i vilken kvadrant?', answer: 'Kvadrant III', wrongs: ['Kvadrant I', 'Kvadrant II', 'Kvadrant IV'] },
  { question: 'Punkten (6, −1) — i vilken kvadrant?', answer: 'Kvadrant IV', wrongs: ['Kvadrant I', 'Kvadrant II', 'Kvadrant III'] },
  { question: 'Vad är x-koordinaten i mittpunkten av (2,4) och (8,10)?', answer: '5', wrongs: ['3', '4', '6'] },
  { question: 'Vad är y-koordinaten i mittpunkten av (1,3) och (5,9)?', answer: '6', wrongs: ['4', '5', '7'] },
  { question: 'Hur långt är det vågrätt mellan (1,2) och (7,2)?', answer: '6', wrongs: ['3', '4', '8'] },
  { question: 'Hur långt är det lodrätt mellan (3,1) och (3,8)?', answer: '7', wrongs: ['4', '5', '9'] },
  { question: 'Vilken punkt är speglad i y-axeln från (3, 5)?', answer: '(−3, 5)', wrongs: ['(3, −5)', '(−3, −5)', '(5, 3)'] },
  { question: 'Vilken punkt är speglad i x-axeln från (2, 6)?', answer: '(2, −6)', wrongs: ['(−2, 6)', '(−2, −6)', '(6, 2)'] },
  { question: 'Punkten (2, 2) — i vilken kvadrant?', answer: 'Kvadrant I', wrongs: ['Kvadrant II', 'Kvadrant III', 'Kvadrant IV'] },
  { question: 'Vad är avståndet från (0,0) till (5,12)?', answer: '13', wrongs: ['10', '11', '14'] },
  { question: 'Vad är x-koordinaten i mittpunkten av (0,0) och (10,6)?', answer: '5', wrongs: ['3', '6', '4'] },
]

function makeQ(difficulty: number): Q {
  const tier = difficulty < 4 ? 0 : difficulty < 8 ? 1 : 2
  let pool: QDef[]
  if (tier === 0) pool = COORD_Q.slice(0, 8)
  else if (tier === 1) pool = COORD_Q.slice(4, 14)
  else pool = COORD_Q.slice(10)

  const def = pool[Math.floor(Math.random() * pool.length)]
  return {
    question: def.question,
    answer: def.answer,
    options: uniqueFourStr(def.answer, () => def.wrongs[Math.floor(Math.random() * def.wrongs.length)]),
  }
}

export const CoordinateGame = memo(function CoordinateGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'play' | 'feedback' | 'done'>('ready')
  const [round, setRound] = useState(0)
  const [q, setQ] = useState(() => makeQ(0))
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT)
  const [score, setScore] = useState(0)
  const [wasCorrect, setWasCorrect] = useState(false)
  const [chosen, setChosen] = useState<string | null>(null)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_coord_best') ?? 0))
  const scoreRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const toRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const answeredRef = useRef(false)

  const nextRound = useCallback((r: number) => {
    if (r >= ROUNDS) {
      const s = scoreRef.current
      const prev = Number(localStorage.getItem('k0509_coord_best') ?? 0)
      if (s > prev) localStorage.setItem('k0509_coord_best', String(s))
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

  const accent = '#22d3ee'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>📍 Koordinater</span>
        <span className={styles.scoreDisplay}>{score}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>📍</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Koordinater</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Koordinatsystemet, kvadranter och avstånd! {TIME_LIMIT} sek per fråga, {ROUNDS} ronder.
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
          <div style={{ background: 'rgba(255,255,255,.05)', borderRadius: 18, padding: '28px 14px', textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', lineHeight: 1.7 }}>{q.question}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {q.options.map((opt, i) => (
              <button key={i} onClick={() => answer(opt)} style={{ height: 64, borderRadius: 16, fontSize: 14, fontWeight: 900, background: 'rgba(34,211,238,.1)', color: accent, border: '2px solid rgba(34,211,238,.3)', cursor: 'pointer', padding: '0 6px' }}>{opt}</button>
            ))}
          </div>
        </div>
      )}

      {phase === 'feedback' && (
        <div style={{ padding: '32px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 48 }}>{wasCorrect ? '✅' : '❌'}</div>
          <div style={{ fontSize: 13, color: 'var(--t3)', lineHeight: 1.6 }}>{q.question}</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: accent }}>{q.answer}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: wasCorrect ? '#4ade80' : '#f87171' }}>
            {wasCorrect ? 'Rätt! 📍' : chosen === '--' ? 'Timeout!' : `Fel! Du valde: ${chosen}`}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{score >= 10 ? '🏆' : score >= 7 ? '⭐' : '📍'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{score} / {ROUNDS}</div>
          <div style={{ fontSize: 13, color: score >= 10 ? '#4ade80' : '#fbbf24' }}>
            {score === 12 ? 'PERFEKT! 🏆' : score >= 10 ? 'Utmärkt! ⭐' : score >= 7 ? 'Bra! 👍' : 'Öva mer! 📍'}
          </div>
          {score > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{score * 15}🪙 +{score * 45} XP</div>
          <button className="btn-primary" style={{ padding: '14px 32px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
