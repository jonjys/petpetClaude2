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

type QDef = { q: string; a: string; w: string[] }

const CAPITALS: QDef[] = [
  { q: 'Vad är Japans huvudstad?', a: 'Tokyo', w: ['Osaka', 'Kyoto', 'Hiroshima'] },
  { q: 'Vad är Brasiliens huvudstad?', a: 'Brasília', w: ['São Paulo', 'Rio de Janeiro', 'Salvador'] },
  { q: 'Vad är Australiens huvudstad?', a: 'Canberra', w: ['Sydney', 'Melbourne', 'Brisbane'] },
  { q: 'Vad är Kanadas huvudstad?', a: 'Ottawa', w: ['Toronto', 'Vancouver', 'Montréal'] },
  { q: 'Vad är Indiens huvudstad?', a: 'New Delhi', w: ['Mumbai', 'Kolkata', 'Chennai'] },
  { q: 'Vad är Kinas huvudstad?', a: 'Peking', w: ['Shanghai', 'Guangzhou', 'Wuhan'] },
  { q: 'Vad är USAs huvudstad?', a: 'Washington D.C.', w: ['New York', 'Los Angeles', 'Chicago'] },
  { q: 'Vad är Mexikos huvudstad?', a: 'Mexico City', w: ['Guadalajara', 'Monterrey', 'Cancún'] },
]

const LARGEST: QDef[] = [
  { q: 'Vilket är världens största land till ytan?', a: 'Ryssland', w: ['Kanada', 'USA', 'Kina'] },
  { q: 'Vilket är världens folkrikaste land?', a: 'Indien', w: ['Kina', 'USA', 'Indonesien'] },
  { q: 'Vilket är världens längsta flod?', a: 'Nilen', w: ['Amazonas', 'Yangtze', 'Mississippi'] },
  { q: 'Vilket är världens högsta berg?', a: 'Mount Everest', w: ['K2', 'Kangchenjunga', 'Makalu'] },
  { q: 'Vilket är världens största hav?', a: 'Stilla havet', w: ['Atlanten', 'Indiska oceanen', 'Arktis'] },
  { q: 'Vilket är Afrikas högsta berg?', a: 'Kilimanjaro', w: ['Mount Kenya', 'Ruwenzori', 'Atlas'] },
  { q: 'Vilken är världens längsta flod i Sydamerika?', a: 'Amazonas', w: ['Paraná', 'Orinoco', 'São Francisco'] },
]

const CONTINENT: QDef[] = [
  { q: 'På vilken kontinent ligger Egypten?', a: 'Afrika', w: ['Asien', 'Europa', 'Mellanöstern'] },
  { q: 'På vilken kontinent ligger Argentina?', a: 'Sydamerika', w: ['Nordamerika', 'Afrika', 'Oceanien'] },
  { q: 'Hur många kontinenter finns det?', a: '7', w: ['5', '6', '8'] },
  { q: 'Vilken kontinent är störst till ytan?', a: 'Asien', w: ['Afrika', 'Nordamerika', 'Europa'] },
  { q: 'Vilket hav skiljer Europa och Amerika?', a: 'Atlanten', w: ['Stilla havet', 'Indiska oceanen', 'Arktis'] },
  { q: 'På vilken kontinent ligger Australien?', a: 'Oceanien', w: ['Asien', 'Antarktis', 'Afrika'] },
]

function makeQ(difficulty: number): Q {
  const tier = difficulty < 4 ? 0 : difficulty < 8 ? 1 : 2
  let pool: QDef[]
  if (tier === 0) pool = CAPITALS
  else if (tier === 1) pool = LARGEST
  else pool = CONTINENT

  const def = pool[Math.floor(Math.random() * pool.length)]
  return { question: def.q, answer: def.a, options: uniqueFourStr(def.a, () => def.w[Math.floor(Math.random() * def.w.length)]) }
}

export const WorldGeographyGame = memo(function WorldGeographyGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'play' | 'feedback' | 'done'>('ready')
  const [round, setRound] = useState(0)
  const [q, setQ] = useState(() => makeQ(0))
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT)
  const [score, setScore] = useState(0)
  const [wasCorrect, setWasCorrect] = useState(false)
  const [chosen, setChosen] = useState<string | null>(null)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_worldgeo_best') ?? 0))
  const scoreRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const toRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const answeredRef = useRef(false)

  const nextRound = useCallback((r: number) => {
    if (r >= ROUNDS) {
      const s = scoreRef.current
      const prev = Number(localStorage.getItem('k0509_worldgeo_best') ?? 0)
      if (s > prev) localStorage.setItem('k0509_worldgeo_best', String(s))
      onWin(s * 16, s * 48)
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
        <span className={styles.gameTitle}>🌍 Världen</span>
        <span className={styles.scoreDisplay}>{score}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🌍</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Världsgeografi</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Huvudstäder, världsrekord och kontinenter! {TIME_LIMIT} sek, {ROUNDS} ronder.
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
              <button key={i} onClick={() => answer(opt)} style={{ height: 64, borderRadius: 16, fontSize: 13, fontWeight: 900, background: 'rgba(34,211,238,.1)', color: accent, border: '2px solid rgba(34,211,238,.3)', cursor: 'pointer', padding: '0 6px' }}>{opt}</button>
            ))}
          </div>
        </div>
      )}

      {phase === 'feedback' && (
        <div style={{ padding: '32px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 48 }}>{wasCorrect ? '✅' : '❌'}</div>
          <div style={{ fontSize: 14, color: 'var(--t3)', lineHeight: 1.6 }}>{q.question}</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: accent }}>{q.answer}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: wasCorrect ? '#4ade80' : '#f87171' }}>
            {wasCorrect ? 'Rätt! 🌍' : chosen === '--' ? 'Timeout!' : `Fel! Du valde: ${chosen}`}
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
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{score * 16}🪙 +{score * 48} XP</div>
          <button className="btn-primary" style={{ padding: '14px 32px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
