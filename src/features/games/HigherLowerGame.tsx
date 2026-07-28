import { memo, useState, useCallback, useEffect } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const FACTS = [
  { subject: 'Antal ben på en spindel', value: 8 },
  { subject: 'Antalet planeter i solsystemet', value: 8 },
  { subject: 'Sekunder på en minut', value: 60 },
  { subject: 'Dagar på ett år', value: 365 },
  { subject: 'Månader på ett år', value: 12 },
  { subject: 'Sidor på en tärning', value: 6 },
  { subject: 'Lager i jordens atmosfär', value: 5 },
  { subject: 'Tänder hos en vuxen människa', value: 32 },
  { subject: 'Ben i kroppen (vuxen)', value: 206 },
  { subject: 'Länder i världen (ungefär)', value: 195 },
  { subject: 'Olimpiska ringar', value: 5 },
  { subject: 'Sidor på en hexagon', value: 6 },
  { subject: 'Ögon på en bi', value: 5 },
  { subject: 'Grader i en cirkel', value: 360 },
  { subject: 'Procent av jordens yta som är hav', value: 71 },
  { subject: 'Kalorier i ett äpple (ungefär)', value: 95 },
  { subject: 'Länder i EU (2024)', value: 27 },
  { subject: 'Minuter på en timme', value: 60 },
  { subject: 'Timmar på ett dygn', value: 24 },
  { subject: 'Veckodagar', value: 7 },
  { subject: 'Km/h som ljuset reser (miljoner)', value: 300 },
  { subject: 'Kilo som ett nyfödd barn väger (ungefär)', value: 3 },
  { subject: 'Procent av kroppen som är vatten', value: 60 },
  { subject: 'Sidor på en pentagon', value: 5 },
  { subject: 'Finger på en hand', value: 5 },
]

const ROUNDS = 8

export const HigherLowerGame = memo(function HigherLowerGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [pool, setPool] = useState<typeof FACTS>([])
  const [idx, setIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [feedback, setFeedback] = useState<boolean | null>(null)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_hl_best') ?? 0))

  const start = useCallback(() => {
    const shuffled = [...FACTS].sort(() => Math.random() - 0.5).slice(0, ROUNDS + 1)
    setPool(shuffled); setIdx(0); setScore(0); setStreak(0); setRevealed(false); setFeedback(null)
    setPhase('playing')
  }, [])

  const pick = useCallback((higher: boolean) => {
    if (revealed || feedback !== null) return
    const curr = pool[idx]
    const next = pool[idx + 1]
    if (!curr || !next) return
    const correct = higher ? next.value >= curr.value : next.value <= curr.value
    setFeedback(correct)
    setRevealed(true)
    if (correct) {
      const ns = streak + 1; setStreak(ns); setScore(s => s + (ns >= 3 ? 2 : 1)); audio.coin()
    } else { setStreak(0); audio.click() }
    setTimeout(() => {
      setFeedback(null); setRevealed(false)
      if (idx + 1 >= ROUNDS) setPhase('done')
      else setIdx(i => i + 1)
    }, 1200)
  }, [revealed, feedback, pool, idx, streak])

  useEffect(() => {
    if (phase === 'done') {
      const prev = Number(localStorage.getItem('k0509_hl_best') ?? 0)
      if (score > prev) localStorage.setItem('k0509_hl_best', String(score))
      onWin(score * 12, score * 15)
      audio.achievement()
    }
  }, [phase, score, onWin])

  const curr = pool[idx]
  const next = pool[idx + 1]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>📊 Högre/Lägre</span>
        <span className={styles.scoreDisplay}>{score}/{idx}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>📊</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Högre eller Lägre?</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Är nästa faktum högre eller lägre?<br />{ROUNDS} jämförelser · Streak-bonus vid 3+ i rad
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore} poäng</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && curr && next && (
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 11, color: 'var(--t3)', textAlign: 'center' }}>Fråga {idx + 1}/{ROUNDS} {streak >= 3 && <span style={{ color: '#fbbf24' }}>🔥{streak}×</span>}</div>

          {/* Current card */}
          <div style={{ background: 'rgba(99,102,241,.1)', border: '2px solid rgba(99,102,241,.3)', borderRadius: 18, padding: '20px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 6 }}>{curr.subject}</div>
            <div style={{ fontFamily: 'var(--ff-head)', fontSize: 36, fontWeight: 900, color: '#818cf8' }}>{curr.value}</div>
          </div>

          <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--t3)', fontWeight: 700 }}>VS →</div>

          {/* Next card */}
          <div style={{
            background: feedback === true ? 'rgba(74,222,128,.1)' : feedback === false ? 'rgba(248,113,113,.1)' : 'rgba(255,255,255,.05)',
            border: `2px solid ${feedback === true ? 'rgba(74,222,128,.4)' : feedback === false ? 'rgba(248,113,113,.4)' : 'rgba(255,255,255,.12)'}`,
            borderRadius: 18, padding: '20px 16px', textAlign: 'center', transition: 'all .2s',
          }}>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 6 }}>{next.subject}</div>
            <div style={{ fontFamily: 'var(--ff-head)', fontSize: 36, fontWeight: 900, color: revealed ? (feedback ? '#4ade80' : '#f87171') : '#555' }}>
              {revealed ? next.value : '?'}
            </div>
          </div>

          {!revealed && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <button onClick={() => pick(true)} style={{ padding: 18, borderRadius: 16, fontSize: 14, fontWeight: 900, background: 'rgba(74,222,128,.1)', border: '2px solid rgba(74,222,128,.4)', cursor: 'pointer', color: '#4ade80' }}>
                ↑ HÖGRE
              </button>
              <button onClick={() => pick(false)} style={{ padding: 18, borderRadius: 16, fontSize: 14, fontWeight: 900, background: 'rgba(248,113,113,.1)', border: '2px solid rgba(248,113,113,.4)', cursor: 'pointer', color: '#f87171' }}>
                ↓ LÄGRE
              </button>
            </div>
          )}
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{score >= 12 ? '🧠' : score >= 6 ? '⭐' : '📊'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{score} poäng</div>
          <div style={{ fontSize: 14, color: score >= 12 ? '#4ade80' : '#fbbf24' }}>
            {score >= 12 ? 'Faktaexpert! 🧠' : score >= 6 ? 'Bra! ⭐' : 'Öva mer! 📊'}
          </div>
          {score > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{score * 12}🪙 +{score * 15} XP</div>
          <button className="btn-primary" style={{ padding: '14px 32px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
