import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const ROUNDS = 10
const TIME_PER_Q = 8

const CURRENCIES = [
  { country: '🇸🇪 Sverige', currency: 'Krona (SEK)', choices: ['Krona (SEK)','Euro (EUR)','Krone (DKK)','Krone (NOK)'] },
  { country: '🇩🇪 Tyskland', currency: 'Euro (EUR)', choices: ['Euro (EUR)','Mark (DEM)','Franc (CHF)','Krone (DKK)'] },
  { country: '🇺🇸 USA', currency: 'Dollar (USD)', choices: ['Dollar (USD)','Pound (GBP)','Franc (CHF)','Peso (MXN)'] },
  { country: '🇬🇧 UK', currency: 'Pound (GBP)', choices: ['Pound (GBP)','Euro (EUR)','Dollar (USD)','Franc (CHF)'] },
  { country: '🇯🇵 Japan', currency: 'Yen (JPY)', choices: ['Yen (JPY)','Yuan (CNY)','Won (KRW)','Baht (THB)'] },
  { country: '🇨🇳 Kina', currency: 'Yuan (CNY)', choices: ['Yuan (CNY)','Yen (JPY)','Won (KRW)','Dong (VND)'] },
  { country: '🇨🇭 Schweiz', currency: 'Franc (CHF)', choices: ['Franc (CHF)','Euro (EUR)','Krone (DKK)','Lire (TRY)'] },
  { country: '🇳🇴 Norge', currency: 'Krone (NOK)', choices: ['Krone (NOK)','Krona (SEK)','Krone (DKK)','Euro (EUR)'] },
  { country: '🇩🇰 Danmark', currency: 'Krone (DKK)', choices: ['Krone (DKK)','Krone (NOK)','Krona (SEK)','Euro (EUR)'] },
  { country: '🇧🇷 Brasilien', currency: 'Real (BRL)', choices: ['Real (BRL)','Peso (ARS)','Peso (MXN)','Dollar (USD)'] },
  { country: '🇮🇳 Indien', currency: 'Rupie (INR)', choices: ['Rupie (INR)','Taka (BDT)','Rupi (PKR)','Yuan (CNY)'] },
  { country: '🇷🇺 Ryssland', currency: 'Rubel (RUB)', choices: ['Rubel (RUB)','Krone (DKK)','Zloty (PLN)','Forint (HUF)'] },
]

function pickRounds(n: number) {
  return [...CURRENCIES].sort(() => Math.random() - 0.5).slice(0, n)
}

export const CurrencyQuizGame = memo(function CurrencyQuizGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [questions] = useState(() => pickRounds(ROUNDS))
  const [qIdx, setQIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(TIME_PER_Q)
  const [feedback, setFeedback] = useState<'right' | 'wrong' | null>(null)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_cq_best') ?? 0))
  const scoreRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const roundRef = useRef(0)

  const nextQ = useCallback((r: number) => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (r >= ROUNDS) {
      const s = scoreRef.current
      const prev = Number(localStorage.getItem('k0509_cq_best') ?? 0)
      if (s > prev) localStorage.setItem('k0509_cq_best', String(s))
      if (s > 0) onWin(Math.round(s * 15), s * 50)
      setPhase('done'); return
    }
    setFeedback(null); setTimeLeft(TIME_PER_Q)
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          setFeedback('wrong')
          setTimeout(() => { roundRef.current++; setQIdx(roundRef.current); nextQ(roundRef.current) }, 700)
          return 0
        }
        return t - 1
      })
    }, 1000)
  }, [onWin])

  const start = useCallback(() => {
    scoreRef.current = 0; setScore(0); roundRef.current = 0; setQIdx(0)
    setPhase('playing'); nextQ(0)
  }, [nextQ])

  const answer = useCallback((choice: string) => {
    if (feedback) return
    if (timerRef.current) clearInterval(timerRef.current)
    const q = questions[qIdx]
    if (choice === q.currency) { audio.coin(); scoreRef.current++; setScore(scoreRef.current); setFeedback('right') }
    else { audio.tap(); setFeedback('wrong') }
    setTimeout(() => { roundRef.current++; setQIdx(roundRef.current); nextQ(roundRef.current) }, 700)
  }, [feedback, questions, qIdx, nextQ])

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  const q = questions[qIdx]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>💰 Valutaquiz</span>
        <span className={styles.scoreDisplay}>{score}/{ROUNDS} · {timeLeft}s</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>💰</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Valutaquiz</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Vilket lands valuta är det? 10 frågor, 8 sekunder var!
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}/{ROUNDS}</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && q && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,.08)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(timeLeft / TIME_PER_Q) * 100}%`, background: timeLeft <= 3 ? '#f87171' : '#4ade80', transition: 'width 1s linear' }} />
          </div>
          <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--t3)' }}>Fråga {qIdx + 1}/{ROUNDS}</div>
          <div style={{
            textAlign: 'center', padding: '24px 16px', borderRadius: 16,
            background: feedback === 'right' ? 'rgba(74,222,128,.1)' : feedback === 'wrong' ? 'rgba(248,113,113,.1)' : 'rgba(255,255,255,.05)',
            border: `2px solid ${feedback === 'right' ? '#4ade80' : feedback === 'wrong' ? '#f87171' : 'rgba(255,255,255,.1)'}`,
          }}>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 8 }}>Vilken valuta används i:</div>
            <div style={{ fontFamily: 'var(--ff-head)', fontSize: 24, fontWeight: 900, color: '#fff' }}>{q.country}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {q.choices.map((c, i) => (
              <button key={i} onClick={() => answer(c)} style={{
                padding: '12px 14px', borderRadius: 12, fontSize: 13, fontWeight: 700,
                background: feedback && c === q.currency ? 'rgba(74,222,128,.2)' : 'rgba(255,255,255,.07)',
                border: `2px solid ${feedback && c === q.currency ? '#4ade80' : 'rgba(255,255,255,.1)'}`,
                color: '#fff', cursor: 'pointer', textAlign: 'left',
              }}>{c}</button>
            ))}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <div style={{ fontWeight: 900, color: '#4ade80', fontSize: 20 }}>💰 {score}/{ROUNDS} rätt!</div>
          <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
