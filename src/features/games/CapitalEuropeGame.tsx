import { memo, useState, useCallback, useRef, useEffect } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const ROUNDS = 12
const TIME_LIMIT = 7

type Q = { question: string; answer: string; options: string[] }

const COUNTRIES: Q[] = [
  { question: '🇵🇱 Polen', answer: 'Warszawa', options: ['Warszawa', 'Kraków', 'Łódź', 'Wrocław'] },
  { question: '🇵🇹 Portugal', answer: 'Lissabon', options: ['Lissabon', 'Porto', 'Faro', 'Braga'] },
  { question: '🇳🇱 Nederländerna', answer: 'Amsterdam', options: ['Amsterdam', 'Rotterdam', 'Haag', 'Utrecht'] },
  { question: '🇧🇪 Belgien', answer: 'Bryssel', options: ['Bryssel', 'Antwerpen', 'Gent', 'Liège'] },
  { question: '🇦🇹 Österrike', answer: 'Wien', options: ['Wien', 'Salzburg', 'Graz', 'Innsbruck'] },
  { question: '🇨🇭 Schweiz', answer: 'Bern', options: ['Bern', 'Zürich', 'Genève', 'Basel'] },
  { question: '🇬🇷 Grekland', answer: 'Aten', options: ['Aten', 'Thessaloniki', 'Patras', 'Heraklion'] },
  { question: '🇷🇴 Rumänien', answer: 'Bukarest', options: ['Bukarest', 'Cluj-Napoca', 'Timișoara', 'Iași'] },
  { question: '🇭🇺 Ungern', answer: 'Budapest', options: ['Budapest', 'Debrecen', 'Miskolc', 'Pécs'] },
  { question: '🇨🇿 Tjeckien', answer: 'Prag', options: ['Prag', 'Brno', 'Ostrava', 'Plzeň'] },
  { question: '🇸🇰 Slovakien', answer: 'Bratislava', options: ['Bratislava', 'Košice', 'Prešov', 'Žilina'] },
  { question: '🇸🇮 Slovenien', answer: 'Ljubljana', options: ['Ljubljana', 'Maribor', 'Celje', 'Kranj'] },
  { question: '🇭🇷 Kroatien', answer: 'Zagreb', options: ['Zagreb', 'Split', 'Rijeka', 'Osijek'] },
  { question: '🇸🇪 Sverige', answer: 'Stockholm', options: ['Stockholm', 'Göteborg', 'Malmö', 'Uppsala'] },
  { question: '🇫🇮 Finland', answer: 'Helsingfors', options: ['Helsingfors', 'Tammerfors', 'Åbo', 'Uleåborg'] },
  { question: '🇳🇴 Norge', answer: 'Oslo', options: ['Oslo', 'Bergen', 'Trondheim', 'Stavanger'] },
  { question: '🇩🇰 Danmark', answer: 'Köpenhamn', options: ['Köpenhamn', 'Aarhus', 'Odense', 'Aalborg'] },
  { question: '🇮🇪 Irland', answer: 'Dublin', options: ['Dublin', 'Cork', 'Limerick', 'Galway'] },
  { question: '🇱🇺 Luxemburg', answer: 'Luxemburg', options: ['Luxemburg', 'Esch-sur-Alzette', 'Differdange', 'Dudelange'] },
  { question: '🇲🇹 Malta', answer: 'Valletta', options: ['Valletta', 'Mdina', 'Birkirkara', 'Mosta'] },
]

function pickQ(_difficulty: number): Q {
  const q = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)]
  const shuffled = [...q.options].sort(() => Math.random() - 0.5)
  return { ...q, options: shuffled }
}

export const CapitalEuropeGame = memo(function CapitalEuropeGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'play' | 'feedback' | 'done'>('ready')
  const [round, setRound] = useState(0)
  const [q, setQ] = useState(() => pickQ(0))
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT)
  const [score, setScore] = useState(0)
  const [wasCorrect, setWasCorrect] = useState(false)
  const [chosen, setChosen] = useState<string | null>(null)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_cap2_best') ?? 0))
  const scoreRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const toRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const answeredRef = useRef(false)

  const nextRound = useCallback((r: number) => {
    if (r >= ROUNDS) {
      const s = scoreRef.current
      const prev = Number(localStorage.getItem('k0509_cap2_best') ?? 0)
      if (s > prev) localStorage.setItem('k0509_cap2_best', String(s))
      onWin(s * 14, s * 42)
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

  const accent = '#60a5fa'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🏛️ Europas Städer</span>
        <span className={styles.scoreDisplay}>{score}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🏛️</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Europas Städer</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Vad är landets huvudstad? {TIME_LIMIT} sek per fråga, {ROUNDS} ronder. Europeiska länder med flaggor!
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
          <div style={{ background: 'rgba(255,255,255,.05)', borderRadius: 18, padding: '28px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: '#fff' }}>{q.question}</div>
            <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 6 }}>Vad är huvudstaden?</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {q.options.map((opt, i) => (
              <button key={i} onClick={() => answer(opt)} style={{ height: 60, borderRadius: 16, fontSize: 13, fontWeight: 700, background: 'rgba(96,165,250,.1)', color: accent, border: '2px solid rgba(96,165,250,.3)', cursor: 'pointer', padding: '0 6px' }}>{opt}</button>
            ))}
          </div>
        </div>
      )}

      {phase === 'feedback' && (
        <div style={{ padding: '32px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 48 }}>{wasCorrect ? '✅' : '❌'}</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#fff' }}>{q.question}</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: accent }}>{q.answer}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: wasCorrect ? '#4ade80' : '#f87171' }}>
            {wasCorrect ? 'Rätt! 🏛️' : chosen === '--' ? 'Timeout!' : `Fel! Du valde: ${chosen}`}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{score >= 10 ? '🏆' : score >= 7 ? '⭐' : '🏛️'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{score} / {ROUNDS}</div>
          <div style={{ fontSize: 13, color: score >= 10 ? '#4ade80' : '#fbbf24' }}>
            {score === 12 ? 'PERFEKT! 🏆' : score >= 10 ? 'Utmärkt! ⭐' : score >= 7 ? 'Bra! 👍' : 'Öva mer! 🏛️'}
          </div>
          {score > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{score * 14}🪙 +{score * 42} XP</div>
          <button className="btn-primary" style={{ padding: '14px 32px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
