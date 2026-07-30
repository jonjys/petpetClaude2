import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const GAME_DURATION = 30
const COLORS = [
  { name: 'RÖD', color: '#f87171' },
  { name: 'BLÅ', color: '#60a5fa' },
  { name: 'GRÖN', color: '#4ade80' },
  { name: 'GUL', color: '#fbbf24' },
  { name: 'LILA', color: '#c084fc' },
]

function makeRound() {
  const wordIdx = Math.floor(Math.random() * COLORS.length)
  let inkIdx = Math.floor(Math.random() * COLORS.length)
  const matches = Math.random() < 0.5
  if (matches) inkIdx = wordIdx
  else while (inkIdx === wordIdx) inkIdx = Math.floor(Math.random() * COLORS.length)
  return { word: COLORS[wordIdx].name, inkColor: COLORS[inkIdx].color, matches }
}

export const ColorWordGame = memo(function ColorWordGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [round, setRound] = useState(() => makeRound())
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION)
  const [feedback, setFeedback] = useState<'right' | 'wrong' | null>(null)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_cwg_best') ?? 0))
  const scoreRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const endGame = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    const s = scoreRef.current
    const prev = Number(localStorage.getItem('k0509_cwg_best') ?? 0)
    if (s > prev) localStorage.setItem('k0509_cwg_best', String(s))
    if (s > 0) onWin(Math.round(s * 8), s * 30)
    setPhase('done')
  }, [onWin])

  const start = useCallback(() => {
    scoreRef.current = 0; setScore(0); setStreak(0); setTimeLeft(GAME_DURATION)
    setRound(makeRound()); setFeedback(null); setPhase('playing')
    timerRef.current = setInterval(() => {
      setTimeLeft(t => { if (t <= 1) { endGame(); return 0 } return t - 1 })
    }, 1000)
  }, [endGame])

  const answer = useCallback((yes: boolean) => {
    if (feedback) return
    const correct = yes === round.matches
    if (correct) {
      audio.coin(); setFeedback('right')
      scoreRef.current++; setScore(scoreRef.current)
      setStreak(s => s + 1)
    } else {
      audio.tap(); setFeedback('wrong'); setStreak(0)
    }
    setTimeout(() => { setRound(makeRound()); setFeedback(null) }, 300)
  }, [round, feedback])

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🎨 Färgord JA/NEJ</span>
        <span className={styles.scoreDisplay}>{score}p · {timeLeft}s</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🎨</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Färgord JA/NEJ</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Matchar ordets INK-FÄRG med dess TEXT? Tryck JA eller NEJ! 30 sekunder.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}p</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,.08)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(timeLeft / GAME_DURATION) * 100}%`, background: timeLeft <= 8 ? '#f87171' : '#4ade80', transition: 'width 1s linear' }} />
          </div>
          <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--t3)' }}>Streak: {streak}</div>
          <div style={{
            textAlign: 'center', padding: '36px 16px', borderRadius: 16,
            background: feedback === 'right' ? 'rgba(74,222,128,.1)' : feedback === 'wrong' ? 'rgba(248,113,113,.1)' : 'rgba(255,255,255,.05)',
            border: `2px solid ${feedback === 'right' ? '#4ade80' : feedback === 'wrong' ? '#f87171' : 'rgba(255,255,255,.1)'}`,
          }}>
            <div style={{ fontFamily: 'var(--ff-head)', fontSize: 44, fontWeight: 900, color: round.inkColor }}>
              {round.word}
            </div>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 8 }}>Matchar texten färgen?</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <button onClick={() => answer(true)} style={{ padding: '18px 0', borderRadius: 14, fontFamily: 'var(--ff-head)', fontSize: 20, fontWeight: 900, background: 'rgba(74,222,128,.15)', border: '2px solid rgba(74,222,128,.3)', color: '#4ade80', cursor: 'pointer' }}>JA ✓</button>
            <button onClick={() => answer(false)} style={{ padding: '18px 0', borderRadius: 14, fontFamily: 'var(--ff-head)', fontSize: 20, fontWeight: 900, background: 'rgba(248,113,113,.15)', border: '2px solid rgba(248,113,113,.3)', color: '#f87171', cursor: 'pointer' }}>NEJ ✗</button>
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <div style={{ fontWeight: 900, color: '#4ade80', fontSize: 20 }}>🎨 {score} rätt!</div>
          <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
