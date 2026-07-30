import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const ROUNDS = 12
const ROUND_TIME = 8

const QA: { country: string; capital: string; emoji: string }[] = [
  { country: 'Sverige', capital: 'Stockholm', emoji: '🇸🇪' },
  { country: 'Frankrike', capital: 'Paris', emoji: '🇫🇷' },
  { country: 'Japan', capital: 'Tokyo', emoji: '🇯🇵' },
  { country: 'Brasilien', capital: 'Brasília', emoji: '🇧🇷' },
  { country: 'Australien', capital: 'Canberra', emoji: '🇦🇺' },
  { country: 'Kanada', capital: 'Ottawa', emoji: '🇨🇦' },
  { country: 'Mexiko', capital: 'Mexico City', emoji: '🇲🇽' },
  { country: 'Ryssland', capital: 'Moskva', emoji: '🇷🇺' },
  { country: 'Kina', capital: 'Peking', emoji: '🇨🇳' },
  { country: 'Indien', capital: 'New Delhi', emoji: '🇮🇳' },
  { country: 'Argentina', capital: 'Buenos Aires', emoji: '🇦🇷' },
  { country: 'Nigeria', capital: 'Abuja', emoji: '🇳🇬' },
  { country: 'Egypten', capital: 'Kairo', emoji: '🇪🇬' },
  { country: 'Sydafrika', capital: 'Pretoria', emoji: '🇿🇦' },
  { country: 'Turkiet', capital: 'Ankara', emoji: '🇹🇷' },
  { country: 'USA', capital: 'Washington D.C.', emoji: '🇺🇸' },
  { country: 'Tyskland', capital: 'Berlin', emoji: '🇩🇪' },
  { country: 'Spanien', capital: 'Madrid', emoji: '🇪🇸' },
  { country: 'Italien', capital: 'Rom', emoji: '🇮🇹' },
  { country: 'Portugal', capital: 'Lissabon', emoji: '🇵🇹' },
  { country: 'Polen', capital: 'Warszawa', emoji: '🇵🇱' },
  { country: 'Ukraina', capital: 'Kyiv', emoji: '🇺🇦' },
  { country: 'Sydkorea', capital: 'Seoul', emoji: '🇰🇷' },
  { country: 'Thailand', capital: 'Bangkok', emoji: '🇹🇭' },
  { country: 'Norge', capital: 'Oslo', emoji: '🇳🇴' },
]

function makeQuestion(used: Set<number>) {
  const available = QA.map((_, i) => i).filter(i => !used.has(i))
  const qIdx = available[Math.floor(Math.random() * available.length)]
  const q = QA[qIdx]
  const others = QA.filter((_, i) => i !== qIdx)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map(x => x.capital)
  const options = [q.capital, ...others].sort(() => Math.random() - 0.5)
  return { qIdx, question: q, options }
}

export const CapitalsGame = memo(function CapitalsGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [round, setRound] = useState(1)
  const [roundKey, setRoundKey] = useState(0)
  const [question, setQuestion] = useState<ReturnType<typeof makeQuestion> | null>(null)
  const [picked, setPicked] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME)
  const [score, setScore] = useState(0)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_cap_best') ?? 0))
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const scoreRef = useRef(0)
  const roundRef = useRef(1)
  const answerRef = useRef('')
  const usedRef = useRef(new Set<number>())

  const finishRound = useCallback((r: number) => {
    if (timerRef.current) clearInterval(timerRef.current)
    const nr = r + 1
    if (nr > ROUNDS) {
      const s = scoreRef.current
      const prev = Number(localStorage.getItem('k0509_cap_best') ?? 0)
      if (s > prev) localStorage.setItem('k0509_cap_best', String(s))
      if (s > 0) onWin(Math.round(s / 4), s)
      setPhase('done')
    } else {
      setTimeout(() => loadRound(nr), 700)
    }
  }, [onWin])

  const loadRound = useCallback((r: number) => {
    const q = makeQuestion(usedRef.current)
    usedRef.current.add(q.qIdx)
    answerRef.current = q.question.capital
    roundRef.current = r
    setQuestion(q); setPicked(null); setRound(r); setTimeLeft(ROUND_TIME)
    setRoundKey(k => k + 1)
  }, [])

  useEffect(() => {
    if (phase !== 'playing') return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { finishRound(roundRef.current); return 0 }
        return t - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase, roundKey, finishRound])

  const pick = useCallback((opt: string) => {
    if (phase !== 'playing' || picked !== null) return
    if (timerRef.current) clearInterval(timerRef.current)
    setPicked(opt)
    if (opt === answerRef.current) {
      audio.coin(); scoreRef.current += 10; setScore(scoreRef.current)
    } else { audio.tap() }
    setTimeout(() => finishRound(roundRef.current), 700)
  }, [phase, picked, finishRound])

  const start = useCallback(() => {
    scoreRef.current = 0; setScore(0); usedRef.current = new Set()
    loadRound(1); setPhase('playing')
  }, [loadRound])

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🌍 Huvudstäder</span>
        <span className={styles.scoreDisplay}>{score}p · {round}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🌍</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Huvudstäder</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Vilken stad är landets huvudstad? 12 frågor, 8 sekunder var. +10p rätt.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}p</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && question && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,.08)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(timeLeft / ROUND_TIME) * 100}%`, background: timeLeft <= 3 ? '#f87171' : '#60a5fa', transition: 'width 1s linear' }} />
          </div>
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 6 }}>{question.question.emoji}</div>
            <div style={{ fontSize: 14, color: 'var(--t3)' }}>Vad är huvudstaden i</div>
            <div style={{ fontFamily: 'var(--ff-head)', fontSize: 24, fontWeight: 900, color: '#fff' }}>{question.question.country}?</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {question.options.map(opt => (
              <button key={opt} onClick={() => pick(opt)} disabled={picked !== null} style={{
                padding: '14px 16px', borderRadius: 14, textAlign: 'left', fontSize: 14, fontWeight: 700,
                background: picked === null ? 'rgba(255,255,255,.07)'
                  : opt === question.question.capital ? 'rgba(74,222,128,.2)'
                  : opt === picked ? 'rgba(248,113,113,.2)' : 'rgba(255,255,255,.04)',
                border: `2px solid ${picked === null ? 'rgba(255,255,255,.15)'
                  : opt === question.question.capital ? '#4ade80'
                  : opt === picked ? '#f87171' : 'rgba(255,255,255,.06)'}`,
                color: picked === null ? '#fff' : opt === question.question.capital ? '#4ade80' : opt === picked ? '#f87171' : 'var(--t3)',
                cursor: picked !== null ? 'default' : 'pointer', transition: 'all .15s',
              }}>{opt}</button>
            ))}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <div style={{ fontWeight: 900, color: '#4ade80', fontSize: 20 }}>🌍 {score}p!</div>
          <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
