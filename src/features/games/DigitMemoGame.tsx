import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const ROUNDS = 8

function makeSequence(len: number) {
  return Array.from({ length: len }, () => Math.floor(Math.random() * 10))
}

export const DigitMemoGame = memo(function DigitMemoGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'show' | 'input' | 'done'>('ready')
  const [round, setRound] = useState(1)
  const [sequence, setSequence] = useState<number[]>([])
  const [entered, setEntered] = useState<number[]>([])
  const [score, setScore] = useState(0)
  const [showTimer, setShowTimer] = useState(3)
  const [feedback, setFeedback] = useState<'right' | 'wrong' | null>(null)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_dm_best') ?? 0))
  const scoreRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startRound = useCallback((r: number) => {
    const len = 3 + Math.floor((r - 1) / 2)
    const seq = makeSequence(len)
    setSequence(seq); setEntered([]); setFeedback(null); setShowTimer(2 + Math.floor(len / 3))
    setPhase('show')
    let t = 2 + Math.floor(len / 3)
    timerRef.current = setInterval(() => {
      t--; setShowTimer(t)
      if (t <= 0) { clearInterval(timerRef.current!); setPhase('input') }
    }, 1000)
  }, [])

  const start = useCallback(() => {
    scoreRef.current = 0; setScore(0); setRound(1); setPhase('ready')
    setTimeout(() => startRound(1), 100)
  }, [startRound])

  const tap = useCallback((digit: number) => {
    if (phase !== 'input') return
    const next = [...entered, digit]
    setEntered(next)
    if (next.length === sequence.length) {
      const correct = next.every((d, i) => d === sequence[i])
      if (correct) { audio.achievement(); setFeedback('right'); scoreRef.current++; setScore(scoreRef.current) }
      else { audio.tap(); setFeedback('wrong') }
      const nr = round + 1
      setTimeout(() => {
        if (nr > ROUNDS) {
          const s = scoreRef.current
          const prev = Number(localStorage.getItem('k0509_dm_best') ?? 0)
          if (s > prev) localStorage.setItem('k0509_dm_best', String(s))
          if (s > 0) onWin(Math.round(s * 20), s * 70)
          setPhase('done')
        } else {
          setRound(nr); startRound(nr)
        }
      }, 700)
    }
  }, [phase, entered, sequence, round, startRound, onWin])

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🔢 Sifferminne</span>
        <span className={styles.scoreDisplay}>{score}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🔢</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Sifferminne</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Memorera siffersekvenssen och skriv in den! 8 ronder med ökande svårighet.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}/{ROUNDS}</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'show' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
          <div style={{ fontSize: 11, color: 'var(--t3)' }}>Rond {round}/{ROUNDS} — memorera! ({showTimer}s)</div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            {sequence.map((d, i) => (
              <div key={i} style={{ width: 48, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12, background: 'rgba(251,191,36,.2)', border: '2px solid #fbbf24', fontFamily: 'var(--ff-head)', fontSize: 28, fontWeight: 900, color: '#fbbf24' }}>{d}</div>
            ))}
          </div>
        </div>
      )}

      {phase === 'input' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--t3)' }}>Rond {round}/{ROUNDS} — skriv in sekvensen!</div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', minHeight: 60, flexWrap: 'wrap', alignItems: 'center' }}>
            {sequence.map((_, i) => (
              <div key={i} style={{ width: 44, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12, background: entered[i] !== undefined ? (feedback === 'right' ? 'rgba(74,222,128,.2)' : feedback === 'wrong' ? 'rgba(248,113,113,.2)' : 'rgba(251,191,36,.2)') : 'rgba(255,255,255,.06)', border: `2px solid ${entered[i] !== undefined ? (feedback ? (feedback === 'right' ? '#4ade80' : '#f87171') : '#fbbf24') : 'rgba(255,255,255,.12)'}`, fontFamily: 'var(--ff-head)', fontSize: 26, fontWeight: 900, color: '#fff' }}>
                {entered[i] !== undefined ? entered[i] : ''}
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
            {[1,2,3,4,5,6,7,8,9,0].map(d => (
              <button key={d} onClick={() => tap(d)} style={{ padding: '16px 0', borderRadius: 12, fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, background: 'rgba(255,255,255,.08)', border: '2px solid rgba(255,255,255,.12)', color: '#fff', cursor: 'pointer' }}>{d}</button>
            ))}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <div style={{ fontWeight: 900, color: '#fbbf24', fontSize: 20 }}>🔢 {score}/{ROUNDS} rätt!</div>
          <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
