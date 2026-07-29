import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const DIRECTIONS = ['↑', '↓', '←', '→']
const GAME_TIME = 30
const SEQ_LEN = 5

export const DirectionGame = memo(function DirectionGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [sequence, setSequence] = useState<string[]>([])
  const [userPos, setUserPos] = useState(0)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_TIME)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_dir_best') ?? 0))
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const scoreRef = useRef(0)
  const fbRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const newSequence = useCallback(() => Array.from({ length: SEQ_LEN }, () => DIRECTIONS[Math.floor(Math.random() * 4)]), [])

  const start = useCallback(() => {
    scoreRef.current = 0; setScore(0); setTimeLeft(GAME_TIME)
    setSequence(newSequence()); setUserPos(0); setFeedback(null)
    setPhase('playing')
  }, [newSequence])

  useEffect(() => {
    if (phase !== 'playing') return
    timerRef.current = setInterval(() => setTimeLeft(t => {
      if (t <= 1) {
        if (timerRef.current) clearInterval(timerRef.current)
        const s = scoreRef.current
        const prev = Number(localStorage.getItem('k0509_dir_best') ?? 0)
        if (s > prev) localStorage.setItem('k0509_dir_best', String(s))
        if (s > 0) onWin(Math.round(s / 6), s)
        setPhase('done'); return 0
      }
      return t - 1
    }), 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase, onWin])

  const press = useCallback((dir: string) => {
    if (phase !== 'playing' || feedback) return
    const correct = sequence[userPos] === dir
    if (correct) {
      audio.tap()
      const np = userPos + 1
      if (np >= SEQ_LEN) {
        const pts = 100
        scoreRef.current += pts; setScore(s => s + pts)
        audio.coin()
        setFeedback('✅')
        if (fbRef.current) clearTimeout(fbRef.current)
        fbRef.current = setTimeout(() => {
          setSequence(newSequence()); setUserPos(0); setFeedback(null)
        }, 400)
      } else {
        setUserPos(np)
      }
    } else {
      scoreRef.current = Math.max(0, scoreRef.current - 20); setScore(s => Math.max(0, s - 20))
      audio.tap()
      setFeedback('❌')
      if (fbRef.current) clearTimeout(fbRef.current)
      fbRef.current = setTimeout(() => {
        setSequence(newSequence()); setUserPos(0); setFeedback(null)
      }, 600)
    }
  }, [phase, feedback, sequence, userPos, newSequence])

  const timerPct = (timeLeft / GAME_TIME) * 100
  const timerColor = timeLeft <= 8 ? '#f87171' : timeLeft <= 15 ? '#fbbf24' : '#60a5fa'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🧭 Pilkompassen</span>
        <span className={styles.scoreDisplay}>{score}p · {timeLeft}s</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🧭</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Pilkompassen</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Tryck pilarna i rätt ordning i 30 sekunder! Varje komplett sekvens = +100p. Fel = -20p.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}p</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,.08)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${timerPct}%`, background: timerColor, transition: 'width 1s linear' }} />
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            {sequence.map((dir, i) => (
              <div key={i} style={{ width: 36, height: 36, borderRadius: 8, background: i < userPos ? 'rgba(74,222,128,.2)' : i === userPos ? 'rgba(255,255,255,.15)' : 'rgba(255,255,255,.05)', border: `2px solid ${i < userPos ? 'rgba(74,222,128,.5)' : i === userPos ? 'rgba(255,255,255,.4)' : 'rgba(255,255,255,.1)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: i < userPos ? '#4ade80' : i === userPos ? '#fff' : 'rgba(255,255,255,.3)' }}>
                {i < userPos ? '✓' : dir}
              </div>
            ))}
          </div>

          {feedback && <div style={{ textAlign: 'center', fontSize: 24, fontWeight: 900, color: feedback === '✅' ? '#4ade80' : '#f87171' }}>{feedback}</div>}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, maxWidth: 220, margin: '0 auto', width: '100%' }}>
            {[
              { dir: '↑', label: '↑' },
              { dir: '→', label: '→' },
              { dir: '←', label: '←' },
              { dir: '↓', label: '↓' },
            ].map(({ dir, label }) => (
              <button key={dir} onClick={() => press(dir)} style={{ padding: '22px', borderRadius: 16, fontSize: 28, fontWeight: 900, background: 'rgba(255,255,255,.06)', border: '2px solid rgba(255,255,255,.1)', color: '#fff', cursor: 'pointer' }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <div style={{ fontWeight: 900, color: '#4ade80', fontSize: 20 }}>🧭 {score}p!</div>
          <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
