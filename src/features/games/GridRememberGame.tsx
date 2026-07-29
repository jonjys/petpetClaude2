import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const ROUNDS = 10

function makeGrid(round: number): boolean[] {
  const size = 16
  const count = Math.min(10, 3 + Math.floor(round / 2))
  const grid = Array(size).fill(false) as boolean[]
  const indices = [...Array(size).keys()].sort(() => Math.random() - 0.5).slice(0, count)
  indices.forEach(i => { grid[i] = true })
  return grid
}

export const GridRememberGame = memo(function GridRememberGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'memorize' | 'recall' | 'feedback' | 'done'>('ready')
  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)
  const [correct, setCorrect] = useState<boolean[]>(Array(16).fill(false))
  const [selected, setSelected] = useState<boolean[]>(Array(16).fill(false))
  const [countdown, setCountdown] = useState(3)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_gr_best') ?? 0))
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startRound = useCallback((r: number) => {
    const grid = makeGrid(r)
    const showTime = Math.max(1500, 3500 - r * 200)
    const dots = Math.ceil(showTime / 1000)
    setCorrect(grid); setSelected(Array(16).fill(false)); setRound(r); setCountdown(dots); setPhase('memorize')
    timerRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          setPhase('recall')
          return 0
        }
        return c - 1
      })
    }, 1000)
  }, [])

  const start = useCallback(() => { setScore(0); startRound(0) }, [startRound])

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  const toggle = useCallback((i: number) => {
    if (phase !== 'recall') return
    setSelected(prev => { const n = [...prev]; n[i] = !n[i]; return n })
  }, [phase])

  const submit = useCallback(() => {
    let hits = 0; let misses = 0; let wrong = 0
    correct.forEach((c, i) => {
      if (c && selected[i]) hits++
      if (c && !selected[i]) misses++
      if (!c && selected[i]) wrong++
    })
    const total = correct.filter(Boolean).length
    const pts = Math.max(0, Math.round((hits / total) * 100) - wrong * 10)
    const newScore = score + pts
    setScore(newScore); setPhase('feedback')
    audio[hits === total && wrong === 0 ? 'achievement' : hits > 0 ? 'coin' : 'tap']()
    setTimeout(() => {
      const nr = round + 1
      if (nr >= ROUNDS) {
        const prev = Number(localStorage.getItem('k0509_gr_best') ?? 0)
        if (newScore > prev) localStorage.setItem('k0509_gr_best', String(newScore))
        if (newScore > 0) onWin(Math.round(newScore / 8), newScore)
        setPhase('done')
      } else {
        startRound(nr)
      }
    }, 1500)
  }, [correct, selected, score, round, startRound, onWin])

  const cellColor = (i: number) => {
    if (phase === 'memorize') return correct[i] ? '#4ade80' : 'rgba(255,255,255,.06)'
    if (phase === 'recall') return selected[i] ? '#60a5fa' : 'rgba(255,255,255,.06)'
    if (phase === 'feedback') {
      if (correct[i] && selected[i]) return '#4ade80'
      if (correct[i] && !selected[i]) return '#fbbf24'
      if (!correct[i] && selected[i]) return '#f87171'
      return 'rgba(255,255,255,.04)'
    }
    return 'rgba(255,255,255,.06)'
  }

  const count = correct.filter(Boolean).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🟩 Rutnätsminne</span>
        <span className={styles.scoreDisplay}>{score}p · {round}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🟩</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Rutnätsminne</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Memorera de gröna rutorna i ett 4×4 rutnät — de försvinner, sedan ska du trycka på rätt platser! Fler rutor per runda.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}p</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {(phase === 'memorize' || phase === 'recall' || phase === 'feedback') && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
          <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--t3)' }}>
            {phase === 'memorize' && `Memorera ${count} rutor! (${countdown}s)`}
            {phase === 'recall' && `Tryck på de ${count} rutorna du såg!`}
            {phase === 'feedback' && '...'}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, width: '100%', maxWidth: 300 }}>
            {Array.from({ length: 16 }, (_, i) => (
              <button
                key={i}
                onClick={() => toggle(i)}
                style={{
                  aspectRatio: '1', borderRadius: 12, background: cellColor(i),
                  border: `2px solid ${phase === 'recall' && selected[i] ? '#60a5fa' : 'rgba(255,255,255,.1)'}`,
                  cursor: phase === 'recall' ? 'pointer' : 'default',
                  transition: 'background .15s',
                  fontSize: phase === 'feedback' && correct[i] ? 16 : 0,
                }}
              >
                {phase === 'feedback' && correct[i] && (selected[i] ? '✓' : '○')}
              </button>
            ))}
          </div>

          {phase === 'recall' && (
            <button className="btn-primary" style={{ padding: '12px 32px' }} onClick={submit}>Klar!</button>
          )}
          {phase === 'feedback' && (
            <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--t3)' }}>
              <span style={{ color: '#4ade80' }}>■ Rätt </span>
              <span style={{ color: '#fbbf24' }}>■ Missat </span>
              <span style={{ color: '#f87171' }}>■ Fel</span>
            </div>
          )}
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <div style={{ fontWeight: 900, color: '#4ade80', fontSize: 20 }}>🟩 {score}p / {ROUNDS * 100}!</div>
          <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
