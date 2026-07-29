import { memo, useState, useCallback, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const COLS = 9, ROWS = 7
const COLORS = ['🔴', '🟡', '🟢', '🔵', '🟣']

type Grid = (string | null)[][]

function makeGrid(): Grid {
  return Array.from({ length: ROWS }, (_, r) =>
    r < 5 ? Array.from({ length: COLS }, () => COLORS[Math.floor(Math.random() * COLORS.length)]) : Array(COLS).fill(null)
  )
}

function findGroup(grid: Grid, r: number, c: number, color: string): [number, number][] {
  const visited = new Set<string>()
  const group: [number, number][] = []
  const queue: [number, number][] = [[r, c]]
  while (queue.length) {
    const [cr, cc] = queue.shift()!
    const key = `${cr},${cc}`
    if (visited.has(key)) continue
    visited.add(key)
    if (cr < 0 || cr >= ROWS || cc < 0 || cc >= COLS || grid[cr][cc] !== color) continue
    group.push([cr, cc])
    queue.push([cr - 1, cc], [cr + 1, cc], [cr, cc - 1], [cr, cc + 1])
  }
  return group
}

function findFloating(grid: Grid): [number, number][] {
  const connected = new Set<string>()
  const queue: [number, number][] = []
  for (let c = 0; c < COLS; c++) {
    if (grid[0][c]) { connected.add(`0,${c}`); queue.push([0, c]) }
  }
  while (queue.length) {
    const [r, c] = queue.shift()!
    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const nr = r + dr, nc = c + dc
      const key = `${nr},${nc}`
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && grid[nr][nc] && !connected.has(key)) {
        connected.add(key); queue.push([nr, nc])
      }
    }
  }
  const floating: [number, number][] = []
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    if (grid[r][c] && !connected.has(`${r},${c}`)) floating.push([r, c])
  }
  return floating
}

export const BubbleShooterGame = memo(function BubbleShooterGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [grid, setGrid] = useState<Grid>([])
  const [current, setCurrent] = useState(COLORS[0])
  const [score, setScore] = useState(0)
  const [shots, setShots] = useState(0)
  const [aimCol, setAimCol] = useState(4)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_bs_best') ?? 0))
  const containerRef = useRef<HTMLDivElement>(null)

  const start = useCallback(() => {
    setGrid(makeGrid()); setCurrent(COLORS[Math.floor(Math.random() * COLORS.length)])
    setScore(0); setShots(0); setAimCol(4); setPhase('playing')
  }, [])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = e.clientX - rect.left
    const col = Math.max(0, Math.min(COLS - 1, Math.floor((x / rect.width) * COLS)))
    setAimCol(col)
  }, [])

  const shoot = useCallback(() => {
    setGrid(prev => {
      const ng = prev.map(r => [...r]) as Grid
      let r = ROWS - 1
      while (r > 0 && ng[r][aimCol] !== null) r--
      if (r < 0) return prev
      ng[r][aimCol] = current
      let newScore = score
      const group = findGroup(ng, r, aimCol, current)
      if (group.length >= 3) {
        group.forEach(([gr, gc]) => { ng[gr][gc] = null })
        const floating = findFloating(ng)
        floating.forEach(([fr, fc]) => { ng[fr][fc] = null })
        newScore = score + (group.length + floating.length) * 10
        setScore(newScore); audio.coin()
      } else {
        audio.tap()
      }
      const allClear = ng.every(row => row.every(c => c === null))
      if (allClear || r === ROWS - 1) {
        const prev2 = Number(localStorage.getItem('k0509_bs_best') ?? 0)
        if (newScore > prev2) localStorage.setItem('k0509_bs_best', String(newScore))
        if (newScore > 0) { audio.achievement(); onWin(Math.round(newScore / 5), newScore) } else audio.click()
        setTimeout(() => setPhase('done'), 100)
      }
      return ng
    })
    setCurrent(COLORS[Math.floor(Math.random() * COLORS.length)])
    setShots(s => s + 1)
  }, [aimCol, current, score, onWin])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🫧 Bubbel Shooter</span>
        <span className={styles.scoreDisplay}>{score}p · {shots} skott</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🫧</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Bubbel Shooter</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Rör musen & klicka/tryck för att skjuta!<br />Träffa 3+ bubblor av samma färg för att ta bort dem.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}p</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {(phase === 'playing' || phase === 'done') && (
        <div style={{ padding: '0 10px' }}>
          <div
            ref={containerRef}
            onPointerMove={handlePointerMove}
            onClick={phase === 'playing' ? shoot : undefined}
            style={{ position: 'relative', background: 'rgba(0,10,20,.85)', border: '2px solid rgba(255,255,255,.1)', borderRadius: 12, overflow: 'hidden', cursor: 'crosshair', touchAction: 'none' }}
          >
            {/* Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${COLS}, 1fr)`, gap: 2, padding: 4 }}>
              {grid.map((row, r) => row.map((cell, c) => (
                <div key={`${r}-${c}`} style={{ height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, background: cell ? 'rgba(255,255,255,.04)' : 'transparent', borderRadius: 4 }}>
                  {cell ?? ''}
                </div>
              )))}
            </div>
            {/* Aim indicator */}
            <div style={{ position: 'relative', height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              <div style={{ position: 'absolute', left: `${(aimCol / COLS) * 100 + 50 / COLS}%`, bottom: 0, width: 2, height: 30, background: 'rgba(255,255,255,.2)', transform: 'translateX(-50%)' }} />
              <div style={{ fontSize: 28 }}>{current}</div>
              <div style={{ fontSize: 11, color: 'var(--t3)' }}>← Sikta & tryck →</div>
            </div>
          </div>
          {phase === 'done' && (
            <div style={{ textAlign: 'center', marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
              <div style={{ fontWeight: 900, color: '#4ade80', fontSize: 16 }}>{score}p på {shots} skott</div>
              <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Spela igen!</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
})
