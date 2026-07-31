import { memo, useState, useCallback } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const GRID = 6
const MAX_MOVES = 22
const COLORS = ['#f87171', '#60a5fa', '#4ade80', '#fbbf24', '#c084fc', '#fb923c']

function makeGrid(): number[][] {
  return Array.from({ length: GRID }, () =>
    Array.from({ length: GRID }, () => Math.floor(Math.random() * COLORS.length))
  )
}

function flood(grid: number[][], targetColor: number, newColor: number): number[][] {
  if (targetColor === newColor) return grid
  const g = grid.map(r => [...r])
  const fill = (r: number, c: number) => {
    if (r < 0 || r >= GRID || c < 0 || c >= GRID || g[r][c] !== targetColor) return
    g[r][c] = newColor
    fill(r + 1, c); fill(r - 1, c); fill(r, c + 1); fill(r, c - 1)
  }
  fill(0, 0)
  return g
}

function countFilled(grid: number[][]): number {
  const color = grid[0][0]
  let count = 0
  const visited = Array.from({ length: GRID }, () => Array(GRID).fill(false))
  const dfs = (r: number, c: number) => {
    if (r < 0 || r >= GRID || c < 0 || c >= GRID || visited[r][c] || grid[r][c] !== color) return
    visited[r][c] = true; count++
    dfs(r + 1, c); dfs(r - 1, c); dfs(r, c + 1); dfs(r, c - 1)
  }
  dfs(0, 0)
  return count
}

export const ColorFloodGame = memo(function ColorFloodGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [grid, setGrid] = useState<number[][]>([])
  const [moves, setMoves] = useState(0)
  const [won, setWon] = useState(false)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_cf2_best') ?? 0))

  const start = useCallback(() => {
    setGrid(makeGrid())
    setMoves(0); setWon(false)
    setPhase('playing')
  }, [])

  const pick = useCallback((colorIdx: number) => {
    if (phase !== 'playing') return
    setGrid(prev => {
      const cur = prev[0][0]
      if (cur === colorIdx) return prev
      const next = flood(prev, cur, colorIdx)
      const filled = countFilled(next)
      const newMoves = moves + 1
      setMoves(newMoves)

      if (filled === GRID * GRID) {
        const score = Math.max(1, MAX_MOVES - newMoves + 1)
        const prev2 = Number(localStorage.getItem('k0509_cf2_best') ?? 0)
        if (score > prev2) localStorage.setItem('k0509_cf2_best', String(score))
        setWon(true); setPhase('done')
        onWin(score * 10, score * 35)
        audio.achievement()
      } else if (newMoves >= MAX_MOVES) {
        setPhase('done'); setWon(false)
        audio.click()
      } else {
        audio.tap()
      }
      return next
    })
  }, [phase, moves, onWin])

  const filled = grid.length > 0 ? countFilled(grid) : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🌊 Färgflod</span>
        <span className={styles.scoreDisplay}>{moves}/{MAX_MOVES}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🌊</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Färgflod</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Välj färg för att fylla från hörnet. Täck hela brädan med en färg på max {MAX_MOVES} drag!
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Bäst: {bestScore}p (drag kvar)</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <div style={{ fontSize: 11, color: 'var(--t3)' }}>Drag kvar: {MAX_MOVES - moves} · Täckt: {filled}/{GRID * GRID}</div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${GRID}, 1fr)`, gap: 2, borderRadius: 12, overflow: 'hidden', width: '100%', maxWidth: 280 }}>
            {grid.flat().map((c, i) => (
              <div key={i} style={{ aspectRatio: '1', background: COLORS[c] }} />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {COLORS.map((c, i) => (
              <button
                key={i}
                onClick={() => pick(i)}
                style={{
                  width: 44, height: 44, borderRadius: 10,
                  background: c,
                  border: grid[0]?.[0] === i ? '3px solid #fff' : '3px solid transparent',
                  cursor: 'pointer',
                  boxShadow: `0 0 10px ${c}66`,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{won ? '🏆' : '❌'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>
            {won ? 'Klar på ' + moves + ' drag!' : 'Slut på drag!'}
          </div>
          {won && <div style={{ fontSize: 13, color: '#4ade80' }}>+{Math.max(1, MAX_MOVES - moves + 1) * 10}🪙</div>}
          <button className="btn-primary" style={{ padding: '14px 32px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
