import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const COLORS = [
  { id: 'red', label: '🔴', bg: '#ef4444', text: 'RÖD' },
  { id: 'blue', label: '🔵', bg: '#3b82f6', text: 'BLÅ' },
  { id: 'green', label: '🟢', bg: '#22c55e', text: 'GRÖN' },
  { id: 'yellow', label: '🟡', bg: '#eab308', text: 'GUL' },
]

const TOTAL_ROUNDS = 15

export const ReflexColorGame = memo(function ReflexColorGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [target, setTarget] = useState<(typeof COLORS)[0] | null>(null)
  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [showTarget, setShowTarget] = useState(false)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_rc_best') ?? 0))
  const roundStartRef = useRef(0)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const nextRound = useCallback((r: number, currentScore: number, currentStreak: number) => {
    setFeedback(null)
    setShowTarget(false)
    const delay = Math.max(400, 900 - r * 30)
    timeoutRef.current = setTimeout(() => {
      const c = COLORS[Math.floor(Math.random() * COLORS.length)]
      setTarget(c)
      setShowTarget(true)
      roundStartRef.current = Date.now()
      timeoutRef.current = setTimeout(() => {
        setFeedback('⏱ Timeout!')
        setStreak(0)
        audio.tap()
        setTimeout(() => {
          const nextR = r + 1
          if (nextR >= TOTAL_ROUNDS) {
            const prev = Number(localStorage.getItem('k0509_rc_best') ?? 0)
            if (currentScore > prev) localStorage.setItem('k0509_rc_best', String(currentScore))
            onWin(Math.round(currentScore / 5), currentScore)
            setPhase('done')
          } else {
            setRound(nextR)
            nextRound(nextR, currentScore, 0)
          }
        }, 600)
      }, 1200)
    }, delay)
  }, [onWin])

  const start = useCallback(() => {
    setRound(0); setScore(0); setStreak(0); setPhase('playing')
    nextRound(0, 0, 0)
  }, [nextRound])

  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current) }, [])

  const handlePress = useCallback((colorId: string) => {
    if (!showTarget || !target || feedback !== null) return
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    const rt = Date.now() - roundStartRef.current
    const correct = colorId === target.id
    const newStreak = correct ? streak + 1 : 0
    const pts = correct ? Math.max(10, Math.round((1200 - rt) / 10)) * (newStreak > 1 ? Math.min(newStreak, 4) : 1) : 0
    const newScore = score + pts
    setStreak(newStreak)
    setScore(newScore)
    if (correct) {
      setFeedback(`✅ ${rt}ms +${pts}p${newStreak > 1 ? ` 🔥×${newStreak}` : ''}`)
      audio.coin()
    } else {
      setFeedback('❌ Fel färg!')
      audio.tap()
    }
    setShowTarget(false)
    setTimeout(() => {
      const nextR = round + 1
      if (nextR >= TOTAL_ROUNDS) {
        const prev = Number(localStorage.getItem('k0509_rc_best') ?? 0)
        if (newScore > prev) localStorage.setItem('k0509_rc_best', String(newScore))
        onWin(Math.round(newScore / 5), newScore)
        setPhase('done')
      } else {
        setRound(nextR)
        nextRound(nextR, newScore, newStreak)
      }
    }, 700)
  }, [showTarget, target, feedback, streak, score, round, nextRound, onWin])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🌈 Reflex Färg</span>
        <span className={styles.scoreDisplay}>{score}p · {round}/{TOTAL_ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🌈</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Reflex Färg</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            En färg blinkar — tryck rätt knapp så snabbt du kan!<br />Snabbt + streak = mer poäng. ({TOTAL_ROUNDS} runder)
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}p</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {(phase === 'playing' || phase === 'done') && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{
            height: 100, borderRadius: 16,
            background: showTarget && target ? target.bg : 'rgba(255,255,255,.06)',
            border: '2px solid rgba(255,255,255,.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background .08s',
            boxShadow: showTarget && target ? `0 0 30px ${target.bg}66` : 'none',
          }}>
            {showTarget && target
              ? <div style={{ fontFamily: 'var(--ff-head)', fontSize: 32, fontWeight: 900, color: '#fff', letterSpacing: 4 }}>{target.text}</div>
              : <div style={{ fontSize: 13, color: 'var(--t3)' }}>{phase === 'done' ? 'Spelet klart!' : 'Vänta...'}</div>
            }
          </div>

          {feedback && (
            <div style={{ textAlign: 'center', fontSize: 14, fontWeight: 700, color: feedback.startsWith('✅') ? '#4ade80' : '#f87171' }}>
              {feedback}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {COLORS.map(c => (
              <button
                key={c.id}
                onClick={() => handlePress(c.id)}
                style={{
                  padding: '18px 10px', borderRadius: 14, border: 'none',
                  background: c.bg + (phase === 'playing' ? 'cc' : '44'),
                  color: '#fff', fontSize: 22, cursor: phase === 'playing' ? 'pointer' : 'default',
                  fontFamily: 'var(--ff-head)', fontWeight: 900,
                  transition: 'opacity .15s, transform .1s',
                  boxShadow: phase === 'playing' ? `0 4px 14px ${c.bg}55` : 'none',
                }}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
            {Array.from({ length: TOTAL_ROUNDS }, (_, i) => (
              <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: i < round ? '#4ade80' : i === round && phase === 'playing' ? '#fbbf24' : 'rgba(255,255,255,.15)' }} />
            ))}
          </div>

          {phase === 'done' && (
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
              <div style={{ fontWeight: 900, color: '#4ade80', fontSize: 16 }}>🎉 {score}p på {TOTAL_ROUNDS} runder!</div>
              <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Spela igen!</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
})
