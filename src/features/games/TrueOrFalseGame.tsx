import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const STATEMENTS = [
  { text: 'Sverige har tre kronor som symbol', answer: true },
  { text: 'En blåval är det minsta däggdjuret', answer: false },
  { text: 'Pi börjar med 3.14', answer: true },
  { text: 'Månen är större än solen', answer: false },
  { text: 'DNA har en dubbelspiral-struktur', answer: true },
  { text: 'Guldfish har ett minne på 3 sekunder', answer: false },
  { text: 'Jordens kärna är flytande järn och nickel', answer: true },
  { text: 'En bläckfisk har åtta hjärtan', answer: false },
  { text: 'Ljud reser snabbare i vatten än i luft', answer: true },
  { text: 'Regnbågen har sju färger', answer: true },
  { text: 'Kameleonter förändrar färg för kamoflage', answer: false },
  { text: 'Honungsbin kan se ultraviolett ljus', answer: true },
  { text: 'Hajar har skelett av ben', answer: false },
  { text: 'Vattnet kokar vid 100°C på havsnivå', answer: true },
  { text: 'En flodhäst är närmast besläktad med grisar', answer: false },
  { text: 'Sjöstjärnor har inget hjärta eller hjärna', answer: true },
  { text: 'Den mänskliga hjärnan är fullt utvecklad vid 18 år', answer: false },
  { text: 'En bläckfisk har tre hjärtan', answer: true },
  { text: 'Katter sväljer alltid hela sin mat', answer: false },
  { text: 'Vulkaner finns också på havets botten', answer: true },
  { text: 'En fladdermöss är faktiskt en fågel', answer: false },
  { text: 'Örnar kan se 4-5 gånger skarpare än människor', answer: true },
  { text: 'Noshörningens horn är gjort av ben', answer: false },
  { text: 'Ljuset tar ca 8 minuter från solen till Jorden', answer: true },
  { text: 'Alla planeter i solsystemet är runda', answer: true },
  { text: 'En krokodil kan springa snabbare än en häst', answer: false },
  { text: 'Honungsbin dör om de sticker en gång', answer: true },
  { text: 'Temperaturen på solen är ca 5 500°C yttemperatur', answer: true },
  { text: 'Sjöhästar kan simma väldigt snabbt', answer: false },
  { text: 'Alla fingeravtryck är unika', answer: true },
]

const ROUNDS = 10
const TIME_PER_Q = 8

export const TrueOrFalseGame = memo(function TrueOrFalseGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [questions, setQuestions] = useState<typeof STATEMENTS>([])
  const [idx, setIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [timeLeft, setTimeLeft] = useState(TIME_PER_Q)
  const [feedback, setFeedback] = useState<boolean | null>(null)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_tof_best') ?? 0))
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const nextQ = useCallback((wasCorrect: boolean) => {
    if (wasCorrect) {
      const ns = streak + 1
      setStreak(ns); setScore(s => s + (ns >= 3 ? 2 : 1)); audio.coin()
    } else { setStreak(0); audio.click() }
    setFeedback(wasCorrect)
    setTimeout(() => {
      setFeedback(null)
      if (idx + 1 >= ROUNDS) { setPhase('done') }
      else { setIdx(i => i + 1); setTimeLeft(TIME_PER_Q) }
    }, 700)
  }, [streak, idx])

  useEffect(() => {
    if (phase !== 'playing') return
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current!); nextQ(false); return 0 }
        return t - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase, idx, nextQ])

  const start = useCallback(() => {
    const pool = [...STATEMENTS].sort(() => Math.random() - 0.5).slice(0, ROUNDS)
    setQuestions(pool); setIdx(0); setScore(0); setStreak(0); setFeedback(null)
    setTimeLeft(TIME_PER_Q)
    setPhase('playing')
  }, [])

  const pick = useCallback((answer: boolean) => {
    if (feedback !== null) return
    if (timerRef.current) clearInterval(timerRef.current)
    nextQ(answer === questions[idx]?.answer)
  }, [feedback, questions, idx, nextQ])

  useEffect(() => {
    if (phase === 'done') {
      const prev = Number(localStorage.getItem('k0509_tof_best') ?? 0)
      if (score > prev) localStorage.setItem('k0509_tof_best', String(score))
      onWin(score * 10, score * 15)
      audio.achievement()
    }
  }, [phase, score, onWin])

  const timerColor = timeLeft > 5 ? '#4ade80' : timeLeft > 2 ? '#fbbf24' : '#f87171'
  const q = questions[idx]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>✅ Sant eller Falskt</span>
        <span className={styles.scoreDisplay}>{score}/{idx}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🤔</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Sant eller Falskt?</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Är påståendet sant eller falskt?<br />{ROUNDS} frågor · {TIME_PER_Q}s per fråga · Streakbonus!
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore} poäng</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && q && (
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,.08)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(timeLeft / TIME_PER_Q) * 100}%`, background: timerColor, borderRadius: 2, transition: 'width 1s linear' }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 900, color: timerColor }}>{timeLeft}s</span>
            {streak >= 3 && <span style={{ fontSize: 11, color: '#fbbf24' }}>🔥{streak}×</span>}
          </div>

          <div style={{
            background: feedback === true ? 'rgba(74,222,128,.1)' : feedback === false ? 'rgba(248,113,113,.1)' : 'rgba(255,255,255,.04)',
            border: `1px solid ${feedback === true ? 'rgba(74,222,128,.4)' : feedback === false ? 'rgba(248,113,113,.4)' : 'rgba(255,255,255,.1)'}`,
            borderRadius: 20, padding: '28px 20px', textAlign: 'center', transition: 'all .2s', minHeight: 120, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 8,
          }}>
            <div style={{ fontSize: 11, color: 'var(--t3)' }}>Fråga {idx + 1}/{ROUNDS}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#e8e8f0', lineHeight: 1.5 }}>{q.text}</div>
            {feedback === true && <div style={{ fontSize: 20 }}>✅ Rätt!</div>}
            {feedback === false && <div style={{ fontSize: 20 }}>❌ Fel!</div>}
          </div>

          {feedback === null && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <button
                onClick={() => pick(true)}
                style={{ padding: '20px 0', borderRadius: 16, fontSize: 22, background: 'rgba(74,222,128,.1)', border: '2px solid rgba(74,222,128,.4)', cursor: 'pointer', fontWeight: 900, color: '#4ade80', transition: 'all .15s' }}
              >
                ✅ SANT
              </button>
              <button
                onClick={() => pick(false)}
                style={{ padding: '20px 0', borderRadius: 16, fontSize: 22, background: 'rgba(248,113,113,.1)', border: '2px solid rgba(248,113,113,.4)', cursor: 'pointer', fontWeight: 900, color: '#f87171', transition: 'all .15s' }}
              >
                ❌ FALSKT
              </button>
            </div>
          )}
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{score >= 15 ? '🧠' : score >= 8 ? '⭐' : '🤔'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{score} poäng</div>
          <div style={{ fontSize: 14, color: score >= 15 ? '#4ade80' : '#fbbf24' }}>
            {score >= 15 ? 'Trivia-genius! 🧠' : score >= 8 ? 'Bra fakta! ⭐' : 'Lär dig mer! 📚'}
          </div>
          {score > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{score * 10}🪙 +{score * 15} XP</div>
          <button className="btn-primary" style={{ padding: '14px 32px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
