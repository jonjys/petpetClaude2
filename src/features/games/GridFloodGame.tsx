import { memo, useState, useCallback } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const ROWS = 7
const COLS = 7
const MAX_MOVES = 22
const COLORS = ['#f87171', '#fb923c', '#4ade80', '#60a5fa', '#c084fc', '#fbbf24']

function makeGrid(): number[][] {
  return Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => Math.floor(Math.random() * 6))
  )
}

function initOwned(g: number[][]): boolean[][] {
  const o: boolean[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(false))
  const start = g[0][0]
  const queue: [number, number][] = [[0, 0]]
  o[0][0] = true
  let qi = 0
  while (qi < queue.length) {
    const [r, c] = queue[qi++]
    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const nr = r + dr, nc = c + dc
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && !o[nr][nc] && g[nr][nc] === start) {
        o[nr][nc] = true; queue.push([nr, nc])
      }
    }
  }
  return o
}

function applyFlood(grid: number[][], owned: boolean[][], color: number) {
  const ng = grid.map(r => [...r])
  const no = owned.map(r => [...r])
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (no[r][c]) ng[r][c] = color
  const queue: [number, number][] = []
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (no[r][c]) queue.push([r, c])
  let qi = 0
  while (qi < queue.length) {
    const [r, c] = queue[qi++]
    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const nr = r + dr, nc = c + dc
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && !no[nr][nc] && ng[nr][nc] === color) {
        no[nr][nc] = true; queue.push([nr, nc])
      }
    }
  }
  return { ng, no }
}

export const GridFloodGame = memo(function GridFloodGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [grid, setGrid] = useState<number[][]>([])
  const [owned, setOwned] = useState<boolean[][]>([])
  const [moves, setMoves] = useState(0)
  const [curColor, setCurColor] = useState(0)
  const [score, setScore] = useState(0)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_gf_best') ?? 0))

  const start = useCallback(() => {
    const g = makeGrid()
    const o = initOwned(g)
    setGrid(g); setOwned(o); setMoves(0); setCurColor(g[0][0]); setScore(0)
    setPhase('playing')
  }, [])

  const pick = useCallback((color: number) => {
    if (color === curColor) return
    const { ng, no } = applyFlood(grid, owned, color)
    const count = no.flat().filter(Boolean).length
    const total = ROWS * COLS
    const nm = moves + 1
    audio.tap()
    setGrid(ng); setOwned(no); setMoves(nm); setCurColor(color)
    if (count === total) {
      const pts = Math.max(0, MAX_MOVES - nm) * 100 + 500
      setScore(pts)
      const prev = Number(localStorage.getItem('k0509_gf_best') ?? 0)
      if (pts > prev) localStorage.setItem('k0509_gf_best', String(pts))
      onWin(Math.round(pts / 8), pts); audio.coin()
      setPhase('done')
    } else if (nm >= MAX_MOVES) {
      const pts = Math.floor((count / total) * 300)
      setScore(pts)
      const prev = Number(localStorage.getItem('k0509_gf_best') ?? 0)
      if (pts > prev) localStorage.setItem('k0509_gf_best', String(pts))
      if (pts > 0) onWin(Math.round(pts / 8), pts)
      setPhase('done')
    }
  }, [curColor, grid, owned, moves, onWin])

  const ownedCount = owned.flat ? owned.flat().filter(Boolean).length : 0
  const pct = Math.floor((ownedCount / (ROWS * COLS)) * 100)
  const movesLeft = MAX_MOVES - moves

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🌊 Färgflod</span>
        <span className={styles.scoreDisplay}>{pct}% · {movesLeft} drag</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🌊</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Färgflod</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Välj en färg — din region (övre vänster) expanderar till grannarna med den färgen. Täck hela brädet på {MAX_MOVES} drag!
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}p</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && grid.length > 0 && (
        <div style={{ padding: '0 10px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,.08)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: '#60a5fa', transition: 'width .3s' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${COLS}, 1fr)`, gap: 2 }}>
            {grid.map((row, r) => row.map((col, c) => (
              <div key={`${r}-${c}`} style={{
                height: 34, borderRadius: 4,
                background: COLORS[col],
                opacity: owned[r]?.[c] ? 1 : 0.4,
                border: owned[r]?.[c] ? '1.5px solid rgba(255,255,255,.35)' : '1.5px solid transparent',
                transition: 'all .2s',
              }} />
            )))}
          </div>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
            {COLORS.map((col, i) => (
              <button key={i} onClick={() => pick(i)} style={{
                width: 40, height: 40, borderRadius: 10,
                background: col,
                border: `3px solid ${curColor === i ? '#fff' : 'transparent'}`,
                cursor: curColor === i ? 'default' : 'pointer',
                opacity: curColor === i ? 0.5 : 1,
                fontSize: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {curColor === i ? '✓' : ''}
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <div style={{ fontWeight: 900, color: '#4ade80', fontSize: 20 }}>🌊 {score}p!</div>
          <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
