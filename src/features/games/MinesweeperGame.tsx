import { memo, useState, useCallback, useEffect } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const ROWS = 8, COLS = 8, MINES = 10

type Cell = { mine: boolean; revealed: boolean; flagged: boolean; adj: number }

function buildGrid(): Cell[][] {
  const grid: Cell[][] = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => ({ mine: false, revealed: false, flagged: false, adj: 0 }))
  )
  let placed = 0
  while (placed < MINES) {
    const r = Math.floor(Math.random() * ROWS)
    const c = Math.floor(Math.random() * COLS)
    if (!grid[r][c].mine) { grid[r][c].mine = true; placed++ }
  }
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (grid[r][c].mine) continue
      let adj = 0
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        const nr = r + dr, nc = c + dc
        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && grid[nr][nc].mine) adj++
      }
      grid[r][c].adj = adj
    }
  }
  return grid
}

function revealFlood(grid: Cell[][], r: number, c: number): Cell[][] {
  const next = grid.map(row => row.map(cell => ({ ...cell })))
  const queue: [number, number][] = [[r, c]]
  while (queue.length) {
    const [cr, cc] = queue.shift()!
    if (cr < 0 || cr >= ROWS || cc < 0 || cc >= COLS) continue
    const cell = next[cr][cc]
    if (cell.revealed || cell.flagged || cell.mine) continue
    cell.revealed = true
    if (cell.adj === 0) {
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        if (dr !== 0 || dc !== 0) queue.push([cr + dr, cc + dc])
      }
    }
  }
  return next
}

const ADJ_COLORS = ['', '#818cf8', '#4ade80', '#f87171', '#fbbf24', '#f87171', '#22d3ee', '#e8e8f0', '#9ca3af']

export const MinesweeperGame = memo(function MinesweeperGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'won' | 'dead'>('ready')
  const [grid, setGrid] = useState<Cell[][]>([])
  const [flagMode, setFlagMode] = useState(false)
  const [revealed, setRevealed] = useState(0)
  const [startTime, setStartTime] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [bestTime] = useState(() => Number(localStorage.getItem('k0509_ms_best') ?? 0))

  useEffect(() => {
    if (phase !== 'playing') return
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 500)
    return () => clearInterval(t)
  }, [phase, startTime])

  const start = useCallback(() => {
    setGrid(buildGrid()); setFlagMode(false); setRevealed(0); setElapsed(0)
    setStartTime(Date.now()); setPhase('playing')
  }, [])

  const tap = useCallback((r: number, c: number) => {
    if (phase !== 'playing') return
    setGrid(prev => {
      const cell = prev[r][c]
      if (cell.revealed) return prev
      if (flagMode) {
        const next = prev.map(row => row.map(cl => ({ ...cl })))
        next[r][c].flagged = !next[r][c].flagged
        audio.click()
        return next
      }
      if (cell.flagged) return prev
      if (cell.mine) {
        const next = prev.map(row => row.map(cl => ({ ...cl, revealed: cl.mine ? true : cl.revealed })))
        setPhase('dead'); audio.click()
        onWin(10, 5)
        return next
      }
      const next = revealFlood(prev, r, c)
      const count = next.flat().filter(cl => cl.revealed && !cl.mine).length
      setRevealed(count)
      audio.coin()
      if (count >= ROWS * COLS - MINES) {
        const t = Math.floor((Date.now() - startTime) / 1000)
        const prev2 = Number(localStorage.getItem('k0509_ms_best') ?? 0)
        if (!prev2 || t < prev2) localStorage.setItem('k0509_ms_best', String(t))
        setPhase('won')
        const coins = Math.max(500 - t * 3, 100)
        onWin(coins, coins * 2)
        audio.achievement()
      }
      return next
    })
  }, [phase, flagMode, startTime, onWin])

  const safeLeft = ROWS * COLS - MINES - revealed
  const flagsLeft = MINES - grid.flat().filter(c => c.flagged).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>💣 Minröjning</span>
        <span className={styles.scoreDisplay}>{elapsed}s · 🚩{flagsLeft}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>💣</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Minröjning</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            {ROWS}×{COLS} rutnät · {MINES} minor<br />Avtäck alla säkra rutor!
          </div>
          {bestTime > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestTime}s</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {(phase === 'playing' || phase === 'won' || phase === 'dead') && (
        <div style={{ padding: '0 10px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button onClick={() => setFlagMode(false)} style={{ padding: '6px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, background: !flagMode ? 'rgba(74,222,128,.2)' : 'rgba(255,255,255,.06)', border: `1px solid ${!flagMode ? 'rgba(74,222,128,.4)' : 'rgba(255,255,255,.12)'}`, color: !flagMode ? '#4ade80' : '#888', cursor: 'pointer' }}>⛏ Avtäck</button>
            <button onClick={() => setFlagMode(true)} style={{ padding: '6px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, background: flagMode ? 'rgba(248,113,113,.2)' : 'rgba(255,255,255,.06)', border: `1px solid ${flagMode ? 'rgba(248,113,113,.4)' : 'rgba(255,255,255,.12)'}`, color: flagMode ? '#f87171' : '#888', cursor: 'pointer' }}>🚩 Flagga</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${COLS}, 1fr)`, gap: 2, maxWidth: 340, margin: '0 auto', width: '100%' }}>
            {grid.map((row, r) => row.map((cell, c) => {
              const isBlown = phase === 'dead' && cell.mine && cell.revealed
              return (
                <button key={`${r}-${c}`} onClick={() => tap(r, c)} style={{
                  aspectRatio: '1', fontSize: 10, fontWeight: 900, borderRadius: 4, border: 'none',
                  background: cell.revealed ? (isBlown ? 'rgba(248,113,113,.3)' : 'rgba(255,255,255,.04)') : 'rgba(255,255,255,.1)',
                  color: cell.mine ? '#f87171' : ADJ_COLORS[cell.adj] ?? '#e8e8f0',
                  cursor: 'pointer', padding: 0,
                }}>
                  {cell.flagged && !cell.revealed ? '🚩' : cell.revealed ? (cell.mine ? '💣' : cell.adj > 0 ? String(cell.adj) : '') : ''}
                </button>
              )
            }))}
          </div>
          {(phase === 'won' || phase === 'dead') && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>{phase === 'won' ? '🎉 Klarat!' : '💥 Boom!'}</div>
              {phase === 'won' && <div style={{ fontSize: 12, color: '#fbbf24', marginBottom: 8 }}>+{Math.max(500 - elapsed * 3, 100)}🪙</div>}
              <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Spela igen</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
})
