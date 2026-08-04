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

const EASY: Q[] = [
  { question: 'Vad heter Sveriges huvudstad?', answer: 'Stockholm', options: ['Stockholm', 'Göteborg', 'Malmö', 'Uppsala'] },
  { question: 'Vilket hav ligger väster om Sverige?', answer: 'Nordsjön', options: ['Nordsjön', 'Östersjön', 'Atlanten', 'Medelhavet'] },
  { question: 'Vilket hav ligger öster om Sverige?', answer: 'Östersjön', options: ['Östersjön', 'Nordsjön', 'Barents hav', 'Bottenhavet'] },
  { question: 'Vad heter Sveriges längsta å?', answer: 'Klarälven', options: ['Klarälven', 'Dalälven', 'Indalsälven', 'Göta älv'] },
  { question: 'Vilket är Sveriges folkrikaste stad?', answer: 'Stockholm', options: ['Stockholm', 'Göteborg', 'Malmö', 'Uppsala'] },
  { question: 'Vad heter Sveriges nordligaste landskap?', answer: 'Lappland', options: ['Lappland', 'Dalarna', 'Norrbotten', 'Härjedalen'] },
  { question: 'Vilket land ligger norr om Sverige?', answer: 'Norge', options: ['Norge', 'Finland', 'Danmark', 'Ryssland'] },
  { question: 'Vilket land ligger öst om Sverige?', answer: 'Finland', options: ['Finland', 'Norge', 'Estland', 'Danmark'] },
  { question: 'Vad heter den ö som tillhör Sverige i Östersjön?', answer: 'Gotland', options: ['Gotland', 'Öland', 'Bornholm', 'Åland'] },
  { question: 'Vilket landskap ligger kring Göteborg?', answer: 'Västergötland', options: ['Västergötland', 'Halland', 'Bohuslän', 'Skåne'] },
]

const MEDIUM: Q[] = [
  { question: 'Vad heter Sveriges högsta berg?', answer: 'Kebnekaise', options: ['Kebnekaise', 'Sylarna', 'Areskutan', 'Helagsfjället'] },
  { question: 'Vilket är Sveriges största sjö?', answer: 'Vänern', options: ['Vänern', 'Vättern', 'Mälaren', 'Hjälmaren'] },
  { question: 'Vilket är Sveriges näst största sjö?', answer: 'Vättern', options: ['Vättern', 'Mälaren', 'Hjälmaren', 'Storsjön'] },
  { question: 'Hur många landskap finns det i Sverige?', answer: '25', options: ['25', '21', '29', '24'] },
  { question: 'I vilket landskap ligger Kiruna?', answer: 'Lappland', options: ['Lappland', 'Norrbotten', 'Jämtland', 'Ångermanland'] },
  { question: 'Vilken stad är Skånes residensstad?', answer: 'Kristianstad', options: ['Kristianstad', 'Malmö', 'Helsingborg', 'Lund'] },
  { question: 'Vad heter halvön i sydvästra Sverige?', answer: 'Bjärehalvön', options: ['Bjärehalvön', 'Ångermanhalvön', 'Listerlandet', 'Kullahalvön'] },
  { question: 'I vilket landskap ligger Falun?', answer: 'Dalarna', options: ['Dalarna', 'Hälsingland', 'Gästrikland', 'Härjedalen'] },
  { question: 'Vilket är Sveriges sydligaste landskap?', answer: 'Skåne', options: ['Skåne', 'Blekinge', 'Halland', 'Öland'] },
  { question: 'Vad heter floddalen där Gothenburg grundades?', answer: 'Göta älvdalen', options: ['Göta älvdalen', 'Klarälvdalen', 'Dalälvdalen', 'Lagan'] },
]

const HARD: Q[] = [
  { question: 'Vilket landskap har flest kommuner?', answer: 'Uppland', options: ['Uppland', 'Småland', 'Dalarna', 'Västergötland'] },
  { question: 'Vad heter den smalaste punkten av Sverige (på bredden)?', answer: 'Öviken', options: ['Öviken', 'Haparanda', 'Gällivare', 'Åre'] },
  { question: 'Vilket är Sveriges östligaste landskap?', answer: 'Norrbotten', options: ['Norrbotten', 'Ångermanland', 'Medelpad', 'Hälsingland'] },
  { question: 'Vad heter Sveriges näst folkrikaste stad?', answer: 'Göteborg', options: ['Göteborg', 'Malmö', 'Uppsala', 'Linköping'] },
  { question: 'Vilken älv rinner genom Sundsvall?', answer: 'Selångersån', options: ['Selångersån', 'Ljungan', 'Indalsälven', 'Ångermanälven'] },
  { question: 'Vilket landskap gränsar till flest andra landskap?', answer: 'Västergötland', options: ['Västergötland', 'Dalarna', 'Uppland', 'Östergötland'] },
  { question: 'Vad kallas den sydsvenska höglandet?', answer: 'Småländska höglandet', options: ['Småländska höglandet', 'Skånska höglandet', 'Blekingska höglandet', 'Halländska höglandet'] },
  { question: 'Vilken sjö är djupast i Sverige?', answer: 'Hornavan', options: ['Hornavan', 'Vättern', 'Vänern', 'Siljan'] },
]

function pickQ(difficulty: number): Q {
  const pool = difficulty < 4 ? EASY : difficulty < 8 ? MEDIUM : HARD
  const q = pool[Math.floor(Math.random() * pool.length)]
  return { ...q, options: [...q.options].sort(() => Math.random() - 0.5) }
}

export const SweGeographyGame = memo(function SweGeographyGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'play' | 'feedback' | 'done'>('ready')
  const [round, setRound] = useState(0)
  const [q, setQ] = useState(() => pickQ(0))
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT)
  const [score, setScore] = useState(0)
  const [wasCorrect, setWasCorrect] = useState(false)
  const [chosen, setChosen] = useState<string | null>(null)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_swgeo_best') ?? 0))
  const scoreRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const toRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const answeredRef = useRef(false)

  const nextRound = useCallback((r: number) => {
    if (r >= ROUNDS) {
      const s = scoreRef.current
      const prev = Number(localStorage.getItem('k0509_swgeo_best') ?? 0)
      if (s > prev) localStorage.setItem('k0509_swgeo_best', String(s))
      onWin(s * 15, s * 45)
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

  const accent = '#34d399'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🗺️ Sverigekarta</span>
        <span className={styles.scoreDisplay}>{score}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🗺️</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Sverigekarta</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Geografifrågor om Sverige — landskap, sjöar, berg och städer. {TIME_LIMIT} sek, {ROUNDS} ronder.
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
              <button key={i} onClick={() => answer(opt)} style={{ height: 64, borderRadius: 16, fontSize: 13, fontWeight: 700, background: 'rgba(52,211,153,.1)', color: accent, border: '2px solid rgba(52,211,153,.3)', cursor: 'pointer', padding: '0 6px', lineHeight: 1.3 }}>{opt}</button>
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
            {wasCorrect ? 'Rätt! 🗺️' : chosen === '--' ? 'Timeout!' : `Fel! Du valde: ${chosen}`}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{score >= 10 ? '🏆' : score >= 7 ? '⭐' : '🗺️'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{score} / {ROUNDS}</div>
          <div style={{ fontSize: 13, color: score >= 10 ? '#4ade80' : '#fbbf24' }}>
            {score === 12 ? 'PERFEKT! 🏆' : score >= 10 ? 'Utmärkt! ⭐' : score >= 7 ? 'Bra! 👍' : 'Öva mer! 🗺️'}
          </div>
          {score > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{score * 15}🪙 +{score * 45} XP</div>
          <button className="btn-primary" style={{ padding: '14px 32px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
