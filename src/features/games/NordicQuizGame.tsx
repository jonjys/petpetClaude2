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
  { question: 'Vilken är Norges huvudstad?', answer: 'Oslo', options: ['Oslo', 'Bergen', 'Trondheim', 'Stavanger'] },
  { question: 'Vilken är Danmarks huvudstad?', answer: 'Köpenhamn', options: ['Köpenhamn', 'Aarhus', 'Odense', 'Aalborg'] },
  { question: 'Vilken är Finlands huvudstad?', answer: 'Helsingfors', options: ['Helsingfors', 'Tammerfors', 'Åbo', 'Uleåborg'] },
  { question: 'Vilken är Islands huvudstad?', answer: 'Reykjavik', options: ['Reykjavik', 'Akureyri', 'Keflavik', 'Hafnarfjörður'] },
  { question: 'Vilket nordiskt land är störst till ytan?', answer: 'Sverige', options: ['Sverige', 'Norge', 'Finland', 'Danmark'] },
  { question: 'Vilket nordiskt land har flest invånare?', answer: 'Sverige', options: ['Sverige', 'Norge', 'Danmark', 'Finland'] },
  { question: 'Vilket nordiskt land är inte EU-medlem?', answer: 'Norge', options: ['Norge', 'Sverige', 'Finland', 'Danmark'] },
  { question: 'Vilket hav ligger öster om Sverige?', answer: 'Östersjön', options: ['Östersjön', 'Nordsjön', 'Atlanten', 'Barents hav'] },
  { question: 'Vad heter det längsta skandinaviska bergskedjan?', answer: 'Skanderna', options: ['Skanderna', 'Alperna', 'Uralen', 'Karpaterna'] },
  { question: 'Vilket nordiskt land har mest fjordar?', answer: 'Norge', options: ['Norge', 'Sverige', 'Finland', 'Island'] },
  { question: 'Vad heter Norges nationella helgdag?', answer: '17 maj', options: ['17 maj', '6 juni', '5 juni', '1 december'] },
  { question: 'Vilket år bildades Nordiska rådet?', answer: '1952', options: ['1952', '1945', '1960', '1973'] },
  { question: 'Vilken finsk stad är känd som "Täby i norr"?', answer: 'Tammerfors', options: ['Tammerfors', 'Åbo', 'Uleåborg', 'Rovaniemi'] },
  { question: 'Vad kallas platsen där Nordpolen ligger?', answer: 'Arktis', options: ['Arktis', 'Antarktis', 'Grönland', 'Spetsbergen'] },
  { question: 'Vilket nordiskt land använde kronan som valuta först?', answer: 'Sverige', options: ['Sverige', 'Danmark', 'Norge', 'Finland'] },
  { question: 'Vad heter den danska ögruppen i Atlanten?', answer: 'Färöarna', options: ['Färöarna', 'Bornholm', 'Åland', 'Lofoten'] },
  { question: 'Vilken norsk stad är mest nordlig?', answer: 'Tromsø', options: ['Tromsø', 'Narvik', 'Hammerfest', 'Alta'] },
  { question: 'Vad är Sveriges nationalsång?', answer: 'Du gamla, du fria', options: ['Du gamla, du fria', 'Sverige, Sverige fosterland', 'I denna stund', 'Ur svenska hjärtans djup'] },
  { question: 'Vilket nordiskt land är känt för Aurora Borealis-turism?', answer: 'Norge', options: ['Norge', 'Sverige', 'Finland', 'Island'] },
  { question: 'Vilket år fick Island självständighet från Danmark?', answer: '1944', options: ['1944', '1918', '1940', '1950'] },
]

function pickQ(difficulty: number): Q {
  const q = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)]
  const shuffled = [...q.options].sort(() => Math.random() - 0.5)
  return { ...q, options: shuffled }
}

export const NordicQuizGame = memo(function NordicQuizGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'play' | 'feedback' | 'done'>('ready')
  const [round, setRound] = useState(0)
  const [q, setQ] = useState(() => pickQ(0))
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT)
  const [score, setScore] = useState(0)
  const [wasCorrect, setWasCorrect] = useState(false)
  const [chosen, setChosen] = useState<string | null>(null)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_nor_best') ?? 0))
  const scoreRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const toRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const answeredRef = useRef(false)

  const nextRound = useCallback((r: number) => {
    if (r >= ROUNDS) {
      const s = scoreRef.current
      const prev = Number(localStorage.getItem('k0509_nor_best') ?? 0)
      if (s > prev) localStorage.setItem('k0509_nor_best', String(s))
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
        <span className={styles.gameTitle}>🧭 Norden</span>
        <span className={styles.scoreDisplay}>{score}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🧭</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Norden</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Nordisk geografi och fakta! {TIME_LIMIT} sek per fråga, {ROUNDS} ronder.
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
              <button key={i} onClick={() => answer(opt)} style={{ height: 60, borderRadius: 16, fontSize: 13, fontWeight: 700, background: 'rgba(52,211,153,.1)', color: accent, border: '2px solid rgba(52,211,153,.3)', cursor: 'pointer', padding: '0 8px' }}>{opt}</button>
            ))}
          </div>
        </div>
      )}

      {phase === 'feedback' && (
        <div style={{ padding: '32px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 48 }}>{wasCorrect ? '✅' : '❌'}</div>
          <div style={{ fontSize: 13, color: 'var(--t3)', maxWidth: 280, lineHeight: 1.5 }}>{q.question}</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: accent }}>{q.answer}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: wasCorrect ? '#4ade80' : '#f87171' }}>
            {wasCorrect ? 'Rätt! 🧭' : chosen === '--' ? 'Timeout!' : `Fel! Du valde: ${chosen}`}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{score >= 8 ? '🏆' : score >= 6 ? '⭐' : '🧭'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{score} / {ROUNDS}</div>
          <div style={{ fontSize: 13, color: score >= 8 ? '#4ade80' : '#fbbf24' }}>
            {score === 10 ? 'PERFEKT! 🏆' : score >= 8 ? 'Utmärkt! ⭐' : score >= 6 ? 'Bra! 👍' : 'Öva mer! 🧭'}
          </div>
          {score > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{score * 15}🪙 +{score * 45} XP</div>
          <button className="btn-primary" style={{ padding: '14px 32px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
