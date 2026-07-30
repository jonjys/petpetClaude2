import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const GAME_TIME = 45
const POOL = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼']
const ROWS = 5
const COLS = 5

type Cell = { emoji: string; found: boolean }

function makePuzzle(): { cells: Cell[]; target: string; count: number } {
  const target = POOL[Math.floor(Math.random() * POOL.length)]
  const count = 3 + Math.floor(Math.random() * 4)
  const cells: Cell[] = Array.from({ length: ROWS * COLS }, () => {
    const others = POOL.filter(e => e !== target)
    return { emoji: others[Math.floor(Math.random() * others.length)], found: false }
  })
  const positions = Array.from({ length: ROWS * COLS }, (_, i) => i)
    .sort(() => Math.random() - 0.5)
    .slice(0, count)
  positions.forEach(i => { cells[i] = { emoji: target, found: false } })
  return { cells, target, count }
}

export const EmojiFindGame = memo(function EmojiFindGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [cells, setCells] = useState<Cell[]>([])
  const [target, setTarget] = useState('')
  const [remaining, setRemaining] = useState(0)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_TIME)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_ef_best') ?? 0))
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const scoreRef = useRef(0)

  const nextPuzzle = useCallback(() => {
    const { cells: c, target: t, count } = makePuzzle()
    setCells(c); setTarget(t); setRemaining(count)
  }, [])

  const start = useCallback(() => {
    scoreRef.current = 0; setScore(0); setTimeLeft(GAME_TIME)
    nextPuzzle()
    setPhase('playing')
  }, [nextPuzzle])

  useEffect(() => {
    if (phase !== 'playing') return
    timerRef.current = setInterval(() => setTimeLeft(t => {
      if (t <= 1) {
        if (timerRef.current) clearInterval(timerRef.current)
        const s = scoreRef.current
        const prev = Number(localStorage.getItem('k0509_ef_best') ?? 0)
        if (s > prev) localStorage.setItem('k0509_ef_best', String(s))
        if (s > 0) onWin(Math.round(s / 8), s)
        setPhase('done'); return 0
      }
      return t - 1
    }), 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase, onWin])

  const tap = useCallback((idx: number) => {
    if (phase !== 'playing') return
    setCells(prev => {
      if (prev[idx].found) return prev
      const isTarget = prev[idx].emoji === target
      if (isTarget) {
        audio.tap()
        scoreRef.current += 20; setScore(s => s + 20)
        const n = [...prev]
        n[idx] = { ...n[idx], found: true }
        const newRem = remaining - 1
        setRemaining(newRem)
        if (newRem <= 0) {
          scoreRef.current += 50; setScore(s => s + 50)
          audio.coin()
          setTimeout(nextPuzzle, 300)
        }
        return n
      } else {
        audio.tap()
        scoreRef.current = Math.max(0, scoreRef.current - 15); setScore(s => Math.max(0, s - 15))
        return prev
      }
    })
  }, [phase, target, remaining, nextPuzzle])

  const timerPct = (timeLeft / GAME_TIME) * 100

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🔍 Emojijakt</span>
        <span className={styles.scoreDisplay}>{score}p · {timeLeft}s</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🔍</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Emojijakt</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Hitta och tryck ALLA instanser av målemojin på brädet! +20p korrekt, -15p fel. Bonuspoäng när alla hittas!
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}p</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && cells.length > 0 && (
        <div style={{ padding: '0 10px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,.08)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${timerPct}%`, background: timerPct <= 25 ? '#f87171' : '#60a5fa', transition: 'width 1s linear' }} />
          </div>
          <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--t2)' }}>
            Hitta alla: <span style={{ fontSize: 28 }}>{target}</span>
            <span style={{ fontSize: 11, color: 'var(--t3)', marginLeft: 6 }}>({remaining} kvar)</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${COLS}, 1fr)`, gap: 4 }}>
            {cells.map((cell, i) => (
              <button
                key={i}
                onClick={() => tap(i)}
                disabled={cell.found}
                style={{
                  height: 46, borderRadius: 10,
                  fontSize: cell.found ? 0 : 24,
                  background: cell.found ? 'rgba(74,222,128,.15)' : 'rgba(255,255,255,.07)',
                  border: `1.5px solid ${cell.found ? 'rgba(74,222,128,.3)' : 'rgba(255,255,255,.1)'}`,
                  cursor: cell.found ? 'default' : 'pointer',
                  transition: 'all .15s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {cell.found ? '✓' : cell.emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <div style={{ fontWeight: 900, color: '#4ade80', fontSize: 20 }}>🔍 {score}p!</div>
          <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
