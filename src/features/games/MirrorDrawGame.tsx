import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const GRID = 5
const ROUNDS = 8

function makePattern(): boolean[][] {
  const grid: boolean[][] = Array.from({ length: GRID }, () => Array(GRID).fill(false))
  const count = 4 + Math.floor(Math.random() * 5)
  let placed = 0
  while (placed < count) {
    const r = Math.floor(Math.random() * GRID)
    const c = Math.floor(Math.random() * Math.ceil(GRID / 2))
    if (!grid[r][c]) { grid[r][c] = true; placed++ }
  }
  return grid
}

function mirrorGrid(grid: boolean[][]): boolean[][] {
  return grid.map(row => {
    const mirrored = [...row]
    for (let c = 0; c < GRID; c++) {
      mirrored[GRID - 1 - c] = row[c]
    }
    return mirrored
  })
}

function countCorrect(user: boolean[][], correct: boolean[][]): number {
  let c = 0
  for (let r = 0; r < GRID; r++) for (let cc = 0; cc < GRID; cc++) if (user[r][cc] === correct[r][cc]) c++
  return c
}

export const MirrorDrawGame = memo(function MirrorDrawGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'memorize' | 'draw' | 'feedback' | 'done'>('ready')
  const [round, setRound] = useState(0)
  const [pattern, setPattern] = useState<boolean[][]>([])
  const [solution, setSolution] = useState<boolean[][]>([])
  const [userGrid, setUserGrid] = useState<boolean[][]>([])
  const [score, setScore] = useState(0)
  const [countdown, setCountdown] = useState(3)
  const [feedback, setFeedback] = useState('')
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_md_best') ?? 0))
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const scoreRef = useRef(0)

  const emptyGrid = useCallback(() => Array.from({ length: GRID }, () => Array(GRID).fill(false) as boolean[]), [])

  const startRound = useCallback((r: number) => {
    const p = makePattern()
    const sol = mirrorGrid(p)
    setPattern(p); setSolution(sol)
    setUserGrid(emptyGrid())
    setCountdown(3); setRound(r); setPhase('memorize')
  }, [emptyGrid])

  const start = useCallback(() => {
    scoreRef.current = 0; setScore(0); startRound(0)
  }, [startRound])

  useEffect(() => {
    if (phase !== 'memorize') return
    timerRef.current = setInterval(() => setCountdown(c => {
      if (c <= 1) {
        if (timerRef.current) clearInterval(timerRef.current)
        setPhase('draw')
        return 0
      }
      return c - 1
    }), 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase])

  const toggleCell = useCallback((r: number, c: number) => {
    if (phase !== 'draw') return
    setUserGrid(prev => prev.map((row, ri) => ri === r ? row.map((v, ci) => ci === c ? !v : v) : row))
  }, [phase])

  const submit = useCallback(() => {
    const correct = countCorrect(userGrid, solution)
    const total = GRID * GRID
    const pct = correct / total
    const pts = Math.round(pct * 100)
    scoreRef.current += pts; setScore(s => s + pts)
    const msg = pct >= 0.9 ? `✅ Perfekt! +${pts}p` : pct >= 0.7 ? `🟡 Bra! +${pts}p` : `❌ +${pts}p`
    setFeedback(msg)
    audio[pct >= 0.7 ? 'coin' : 'tap']()
    setPhase('feedback')
    setTimeout(() => {
      const nr = round + 1
      if (nr >= ROUNDS) {
        const s = scoreRef.current
        const prev = Number(localStorage.getItem('k0509_md_best') ?? 0)
        if (s > prev) localStorage.setItem('k0509_md_best', String(s))
        if (s > 0) onWin(Math.round(s / 8), s)
        setPhase('done')
      } else {
        startRound(nr)
      }
    }, 1400)
  }, [userGrid, solution, round, onWin, startRound])

  const renderGrid = (grid: boolean[][], interactive = false) => (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${GRID}, 1fr)`, gap: 4 }}>
      {grid.map((row, r) => row.map((v, c) => (
        <div
          key={`${r}-${c}`}
          onClick={() => interactive && toggleCell(r, c)}
          style={{
            width: 44, height: 44, borderRadius: 8,
            background: v ? 'rgba(96,165,250,.5)' : 'rgba(255,255,255,.05)',
            border: `2px solid ${v ? 'rgba(96,165,250,.7)' : 'rgba(255,255,255,.1)'}`,
            cursor: interactive ? 'pointer' : 'default',
            transition: 'all .1s',
          }}
        />
      )))}
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🪞 Spegelritning</span>
        <span className={styles.scoreDisplay}>{score}p · {round}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🪞</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Spegelritning</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Se mönstret i 3 sekunder, rita sedan spegelbilden! 8 runder, mer precision = mer poäng.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}p</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'memorize' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#fbbf24' }}>Memorera! {countdown}s</div>
          <div style={{ fontSize: 12, color: 'var(--t3)' }}>Se mönstret noga — rita sedan spegelbilden</div>
          {renderGrid(pattern)}
        </div>
      )}

      {(phase === 'draw' || phase === 'feedback') && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          {phase === 'draw'
            ? <div style={{ fontSize: 12, color: '#60a5fa' }}>Rita spegelbilden (vänster↔höger)</div>
            : <div style={{ fontWeight: 700, fontSize: 13, color: feedback.startsWith('✅') ? '#4ade80' : feedback.startsWith('🟡') ? '#fbbf24' : '#f87171' }}>{feedback}</div>
          }
          {renderGrid(phase === 'feedback' ? solution : userGrid, phase === 'draw')}
          {phase === 'draw' && (
            <button className="btn-primary" style={{ padding: '10px 28px' }} onClick={submit}>Klar!</button>
          )}
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <div style={{ fontWeight: 900, color: '#4ade80', fontSize: 20 }}>🪞 {score}p!</div>
          <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
