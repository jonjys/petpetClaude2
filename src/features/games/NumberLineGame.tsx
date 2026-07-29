import { memo, useState, useCallback, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const ROUNDS = 10

export const NumberLineGame = memo(function NumberLineGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [round, setRound] = useState(0)
  const [target, setTarget] = useState(0)
  const [score, setScore] = useState(0)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [guessMarker, setGuessMarker] = useState<number | null>(null)
  const [totalError, setTotalError] = useState(0)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_nl_best') ?? 0))
  const lineRef = useRef<HTMLDivElement>(null)
  const pendingRef = useRef(false)

  const nextRound = useCallback((r: number) => {
    setTarget(5 + Math.floor(Math.random() * 91))
    setFeedback(null)
    setGuessMarker(null)
    setRound(r)
    pendingRef.current = false
  }, [])

  const start = useCallback(() => {
    setScore(0); setTotalError(0); setPhase('playing'); nextRound(0)
  }, [nextRound])

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (feedback !== null || pendingRef.current) return
    const rect = lineRef.current!.getBoundingClientRect()
    const pct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
    const guess = Math.round(pct)
    const diff = Math.abs(guess - target)
    const pts = Math.max(0, 100 - diff * 2)
    pendingRef.current = true
    setGuessMarker(pct)
    setFeedback(`${diff <= 2 ? '🎯 Perfekt!' : diff <= 8 ? '✅ Bra!' : diff <= 20 ? '😬 Nära...' : '❌ Långt!'} Mål: ${target} | Du: ~${guess} | +${pts}p`)
    audio[pts >= 80 ? 'coin' : 'tap']()
    const newScore = score + pts
    const newErr = totalError + diff
    setTimeout(() => {
      const nr = round + 1
      if (nr >= ROUNDS) {
        const prev = Number(localStorage.getItem('k0509_nl_best') ?? 0)
        if (newScore > prev) localStorage.setItem('k0509_nl_best', String(newScore))
        if (newScore > 0) onWin(Math.round(newScore / 10), newScore)
        setScore(newScore); setTotalError(newErr); setPhase('done')
      } else {
        setScore(newScore); setTotalError(newErr); nextRound(nr)
      }
    }, 1300)
  }, [feedback, target, round, score, totalError, nextRound, onWin])

  const accuracy = ROUNDS > 0 ? Math.round(totalError / ROUNDS) : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>📏 Nummerlinje</span>
        <span className={styles.scoreDisplay}>{score}p · {round}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>📏</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Nummerlinje</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            En siffra visas — tryck på rätt plats på linjen 0–100! Ju noggrannare desto fler poäng. 10 runder.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}p</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 4 }}>Var sitter siffran?</div>
            <div style={{ fontFamily: 'var(--ff-head)', fontSize: 72, fontWeight: 900, color: '#4ade80', lineHeight: 1 }}>{target}</div>
          </div>

          <div
            ref={lineRef}
            onClick={handleClick}
            style={{ position: 'relative', height: 72, cursor: 'crosshair', padding: '0 2px' }}
          >
            {/* track */}
            <div style={{ position: 'absolute', left: 12, right: 12, top: '50%', height: 8, background: 'rgba(255,255,255,.1)', borderRadius: 4, transform: 'translateY(-50%)' }} />
            {/* midpoint tick */}
            <div style={{ position: 'absolute', left: '50%', top: '30%', bottom: '30%', width: 2, background: 'rgba(255,255,255,.15)', transform: 'translateX(-50%)' }} />
            {/* quarter ticks */}
            <div style={{ position: 'absolute', left: '25%', top: '38%', bottom: '38%', width: 1, background: 'rgba(255,255,255,.1)', transform: 'translateX(-50%)' }} />
            <div style={{ position: 'absolute', left: '75%', top: '38%', bottom: '38%', width: 1, background: 'rgba(255,255,255,.1)', transform: 'translateX(-50%)' }} />
            {/* labels */}
            <div style={{ position: 'absolute', left: 0, top: '65%', fontSize: 11, color: 'var(--t3)', fontWeight: 700 }}>0</div>
            <div style={{ position: 'absolute', left: '50%', top: '65%', fontSize: 10, color: 'rgba(255,255,255,.3)', transform: 'translateX(-50%)' }}>50</div>
            <div style={{ position: 'absolute', right: 0, top: '65%', fontSize: 11, color: 'var(--t3)', fontWeight: 700 }}>100</div>
            {/* guess marker */}
            {guessMarker !== null && (
              <div style={{
                position: 'absolute',
                left: `calc(${guessMarker}% - 1px)`,
                top: '20%', bottom: '20%',
                width: 3, background: '#60a5fa', borderRadius: 2,
                boxShadow: '0 0 6px #60a5fa',
              }} />
            )}
            {/* true answer marker shown after guess */}
            {guessMarker !== null && (
              <div style={{
                position: 'absolute',
                left: `calc(${target}% - 1px)`,
                top: '20%', bottom: '20%',
                width: 3, background: '#4ade80', borderRadius: 2,
                boxShadow: '0 0 6px #4ade80',
              }} />
            )}
          </div>

          {guessMarker !== null && (
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', fontSize: 11, color: 'var(--t3)' }}>
              <span style={{ color: '#60a5fa' }}>■ Du</span>
              <span style={{ color: '#4ade80' }}>■ Rätt</span>
            </div>
          )}

          {feedback && (
            <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: feedback.includes('🎯') || feedback.includes('✅') ? '#4ade80' : '#f87171' }}>
              {feedback}
            </div>
          )}

          {!feedback && (
            <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--t3)' }}>
              Tryck på linjen ↑
            </div>
          )}
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <div style={{ fontWeight: 900, color: '#4ade80', fontSize: 20 }}>🎉 {score}p / {ROUNDS * 100}!</div>
          <div style={{ fontSize: 12, color: 'var(--t3)' }}>Snittfel: ±{accuracy} enheter</div>
          {score === ROUNDS * 100 && <div style={{ fontSize: 13, color: '#fbbf24', fontWeight: 700 }}>🏆 Perfekt!</div>}
          <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
