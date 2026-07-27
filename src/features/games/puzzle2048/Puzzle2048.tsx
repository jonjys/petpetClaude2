import { memo, useState, useCallback, useEffect, useRef } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

type Grid = number[][]
type Direction = 'up' | 'down' | 'left' | 'right'

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'puzzle2048_best'
const WIN_TILE = 2048
const WIN_COINS = 500
const WIN_XP = 200

const TILE_COLORS: Record<number, string> = {
  2:    'rgba(255,255,255,.08)',
  4:    'rgba(0,255,136,.15)',
  8:    'rgba(68,136,255,.25)',
  16:   'rgba(170,102,255,.3)',
  32:   'rgba(255,136,68,.35)',
  64:   'rgba(255,68,85,.4)',
  128:  'rgba(255,204,0,.45)',
  256:  'rgba(255,204,0,.6)',
  512:  'rgba(0,255,136,.7)',
  1024: 'rgba(68,136,255,.8)',
  2048: 'rgba(255,204,0,1)',
}

// ─── Pure game logic ──────────────────────────────────────────────────────────

function makeGrid(): Grid {
  return Array.from({ length: 4 }, () => new Array<number>(4).fill(0))
}

function addRandom(grid: Grid): Grid {
  const empties: [number, number][] = []
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++)
      if (grid[r][c] === 0) empties.push([r, c])
  if (empties.length === 0) return grid
  const [r, c] = empties[Math.floor(Math.random() * empties.length)]
  const next = grid.map(row => [...row])
  next[r][c] = Math.random() < 0.9 ? 2 : 4
  return next
}

function slideRow(row: number[]): { result: number[]; score: number } {
  const compact = row.filter(v => v !== 0)
  let score = 0
  const merged: number[] = []
  let i = 0
  while (i < compact.length) {
    if (i + 1 < compact.length && compact[i] === compact[i + 1]) {
      const val = compact[i] * 2
      merged.push(val)
      score += val
      i += 2
    } else {
      merged.push(compact[i])
      i++
    }
  }
  while (merged.length < 4) merged.push(0)
  return { result: merged, score }
}

function slideLeftAll(grid: Grid): { grid: Grid; score: number; moved: boolean } {
  let totalScore = 0
  let moved = false
  const next = grid.map(row => {
    const { result, score } = slideRow(row)
    totalScore += score
    if (result.some((v, idx) => v !== row[idx])) moved = true
    return result
  })
  return { grid: next, score: totalScore, moved }
}

function transpose(grid: Grid): Grid {
  return Array.from({ length: 4 }, (_a, r) =>
    Array.from({ length: 4 }, (_b, c) => grid[c][r])
  )
}

function applyMove(grid: Grid, dir: Direction): { grid: Grid; score: number; moved: boolean } {
  if (dir === 'left') {
    return slideLeftAll(grid)
  }
  if (dir === 'right') {
    const flipped = grid.map(row => [...row].reverse())
    const { grid: res, score, moved } = slideLeftAll(flipped)
    return { grid: res.map(row => [...row].reverse()), score, moved }
  }
  if (dir === 'up') {
    const t = transpose(grid)
    const { grid: res, score, moved } = slideLeftAll(t)
    return { grid: transpose(res), score, moved }
  }
  // down
  const t = transpose(grid)
  const flipped = t.map(row => [...row].reverse())
  const { grid: res, score, moved } = slideLeftAll(flipped)
  return { grid: transpose(res.map(row => [...row].reverse())), score, moved }
}

function hasMovesLeft(grid: Grid): boolean {
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (grid[r][c] === 0) return true
      if (c < 3 && grid[r][c] === grid[r][c + 1]) return true
      if (r < 3 && grid[r][c] === grid[r + 1][c]) return true
    }
  }
  return false
}

function gridHasWon(grid: Grid): boolean {
  return grid.some(row => row.some(v => v >= WIN_TILE))
}

function initGame(): Grid {
  let g = makeGrid()
  g = addRandom(g)
  g = addRandom(g)
  return g
}

function loadBest(): number {
  try {
    return parseInt(localStorage.getItem(STORAGE_KEY) ?? '0', 10) || 0
  } catch (_err) {
    return 0
  }
}

function saveBest(val: number): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(val))
  } catch (_err) {
    // storage unavailable – ignore
  }
}

// ─── Style helpers ─────────────────────────────────────────────────────────────

function getTileColor(val: number): string {
  return TILE_COLORS[val] ?? 'rgba(255,204,0,1)'
}

function getTileFontColor(val: number): string {
  // Gold / fully-opaque tiles need dark text for contrast
  return val >= 2048 ? '#1a0e00' : '#e8e8f0'
}

function getTileFontSize(val: number): string {
  if (val < 100) return '26px'
  if (val < 1000) return '20px'
  return '15px'
}

// ─── Static style objects (defined outside component to avoid GC churn) ───────

const backBtnStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,.08)',
  border: 'none',
  borderRadius: 10,
  color: '#e8e8f0',
  fontSize: 20,
  width: 40,
  height: 40,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
}

const newGameBtnStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,.1)',
  border: '1px solid rgba(255,255,255,.15)',
  borderRadius: 10,
  color: '#e8e8f0',
  fontFamily: 'var(--ff-head)',
  fontSize: 12,
  fontWeight: 700,
  padding: '7px 14px',
  cursor: 'pointer',
  letterSpacing: '0.5px',
  whiteSpace: 'nowrap',
}

const scorePillStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  background: 'rgba(255,255,255,.07)',
  border: '1px solid rgba(255,255,255,.1)',
  borderRadius: 10,
  padding: '4px 12px',
  minWidth: 56,
}

const overlayStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  borderRadius: 16,
  background: 'rgba(0,0,0,.88)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 14,
  zIndex: 10,
}

// ─── Component ────────────────────────────────────────────────────────────────

export const Puzzle2048 = memo(function Puzzle2048({ onExit, onWin }: Props) {
  const [grid, setGrid] = useState<Grid>(initGame)
  const [score, setScore] = useState(0)
  const [best, setBest] = useState<number>(loadBest)
  const [gameOver, setGameOver] = useState(false)
  const [wonOverlay, setWonOverlay] = useState(false)  // controls the overlay visibility
  const winClaimedRef = useRef(false)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)

  // Fire onWin exactly once when the win overlay appears
  useEffect(() => {
    if (wonOverlay && !winClaimedRef.current) {
      winClaimedRef.current = true
      onWin(WIN_COINS, WIN_XP)
    }
  }, [wonOverlay, onWin])

  const handleMove = useCallback((dir: Direction) => {
    if (gameOver || wonOverlay) return

    const { grid: next, score: gained, moved } = applyMove(grid, dir)
    if (!moved) return

    const withNew = addRandom(next)
    setGrid(withNew)

    const newScore = score + gained
    setScore(newScore)

    const newBest = Math.max(best, newScore)
    if (newBest > best) {
      setBest(newBest)
      saveBest(newBest)
    }

    if (!winClaimedRef.current && gridHasWon(withNew)) {
      setWonOverlay(true)
    } else if (!hasMovesLeft(withNew)) {
      setGameOver(true)
    }
  }, [grid, score, best, gameOver, wonOverlay])

  const newGame = useCallback(() => {
    setGrid(initGame())
    setScore(0)
    setGameOver(false)
    setWonOverlay(false)
    winClaimedRef.current = false
  }, [])

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':  e.preventDefault(); handleMove('left');  break
        case 'ArrowRight': e.preventDefault(); handleMove('right'); break
        case 'ArrowUp':    e.preventDefault(); handleMove('up');    break
        case 'ArrowDown':  e.preventDefault(); handleMove('down');  break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleMove])

  // Touch/swipe handlers
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0]
    touchStartRef.current = { x: t.clientX, y: t.clientY }
  }, [])

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return
    const t = e.changedTouches[0]
    const dx = t.clientX - touchStartRef.current.x
    const dy = t.clientY - touchStartRef.current.y
    touchStartRef.current = null
    const absDx = Math.abs(dx)
    const absDy = Math.abs(dy)
    if (Math.max(absDx, absDy) < 24) return // too short – ignore
    if (absDx > absDy) {
      handleMove(dx > 0 ? 'right' : 'left')
    } else {
      handleMove(dy > 0 ? 'down' : 'up')
    }
  }, [handleMove])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    // Prevent page scroll while swiping on the board
    e.preventDefault()
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, background: 'var(--bg)', minHeight: '100%' }}>

      {/* Injected keyframes for tile pop + 2048 pulse */}
      <style>{`
        @keyframes p2048-pop {
          0%   { transform: scale(0.5); opacity: 0; }
          70%  { transform: scale(1.08); }
          100% { transform: scale(1);   opacity: 1; }
        }
        @keyframes p2048-merge {
          0%   { transform: scale(1); }
          40%  { transform: scale(1.18); }
          100% { transform: scale(1); }
        }
        @keyframes p2048-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(255,204,0,.65), 0 0 44px rgba(255,204,0,.3); }
          50%       { box-shadow: 0 0 32px rgba(255,204,0,.95), 0 0 64px rgba(255,204,0,.5); }
        }
      `}</style>

      {/* ── Header ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '12px 14px 6px',
        flexWrap: 'nowrap',
      }}>
        <button style={backBtnStyle} onClick={onExit} aria-label="Back">←</button>

        <span style={{
          fontFamily: 'var(--ff-head)',
          fontSize: 18,
          fontWeight: 900,
          color: '#e8e8f0',
          flex: 1,
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          🧩 2048
        </span>

        {/* Score pill */}
        <div style={scorePillStyle}>
          <span style={{
            fontSize: 8,
            fontFamily: 'var(--ff-head)',
            letterSpacing: '0.8px',
            color: 'rgba(232,232,240,.55)',
            textTransform: 'uppercase',
          }}>
            SCORE
          </span>
          <span style={{
            fontSize: 15,
            fontFamily: 'var(--ff-head)',
            fontWeight: 700,
            color: '#e8e8f0',
            lineHeight: 1.2,
          }}>
            {score}
          </span>
        </div>

        {/* Best score pill */}
        <div style={{
          ...scorePillStyle,
          background: 'rgba(255,204,0,.08)',
          border: '1px solid rgba(255,204,0,.25)',
        }}>
          <span style={{
            fontSize: 8,
            fontFamily: 'var(--ff-head)',
            letterSpacing: '0.8px',
            color: 'rgba(255,204,0,.6)',
            textTransform: 'uppercase',
          }}>
            BEST
          </span>
          <span style={{
            fontSize: 15,
            fontFamily: 'var(--ff-head)',
            fontWeight: 700,
            color: 'var(--gold)',
            lineHeight: 1.2,
          }}>
            {best}
          </span>
        </div>

        {/* New game */}
        <button style={newGameBtnStyle} onClick={newGame}>New</button>
      </div>

      {/* ── Game board ── */}
      <div
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onTouchMove={onTouchMove}
        style={{ position: 'relative', margin: '6px 14px 0' }}
      >
        {/* Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 8,
          background: 'rgba(255,255,255,.04)',
          border: '1px solid rgba(255,255,255,.08)',
          borderRadius: 16,
          padding: 8,
        }}>
          {grid.flat().map((val, idx) => {
            const is2048 = val === WIN_TILE
            return (
              <div
                key={`${idx}-${val}`}
                style={{
                  aspectRatio: '1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 10,
                  background: val ? getTileColor(val) : 'rgba(255,255,255,.04)',
                  border: val
                    ? '1px solid rgba(255,255,255,.08)'
                    : '1px solid rgba(255,255,255,.06)',
                  color: val ? getTileFontColor(val) : 'transparent',
                  fontSize: getTileFontSize(val),
                  fontFamily: 'var(--ff-head)',
                  fontWeight: 800,
                  lineHeight: 1,
                  letterSpacing: '-0.5px',
                  userSelect: 'none',
                  animation: val
                    ? is2048
                      ? 'p2048-glow 1.4s ease-in-out infinite'
                      : 'p2048-pop .14s ease-out'
                    : 'none',
                  boxShadow: is2048
                    ? '0 0 24px rgba(255,204,0,.7), 0 0 52px rgba(255,204,0,.35)'
                    : 'none',
                  transition: 'background .12s, box-shadow .2s',
                }}
              >
                {val > 0 ? val : ''}
              </div>
            )
          })}
        </div>

        {/* ── Game Over overlay ── */}
        {gameOver && (
          <div style={overlayStyle}>
            <div style={{
              fontFamily: 'var(--ff-head)',
              fontSize: 30,
              fontWeight: 900,
              color: '#ff4455',
              textShadow: '0 0 20px rgba(255,68,85,.5)',
            }}>
              Game Over
            </div>
            <div style={{ fontFamily: 'var(--ff-body)', fontSize: 14, color: '#888' }}>
              Score: <strong style={{ color: '#e8e8f0' }}>{score}</strong>
            </div>
            {score > 0 && score >= best && (
              <div style={{
                fontFamily: 'var(--ff-head)',
                fontSize: 12,
                color: 'var(--gold)',
                background: 'rgba(255,204,0,.1)',
                border: '1px solid rgba(255,204,0,.25)',
                borderRadius: 8,
                padding: '4px 12px',
              }}>
                🏆 New best!
              </div>
            )}
            <button
              style={{
                ...newGameBtnStyle,
                background: 'rgba(255,68,85,.15)',
                border: '1px solid rgba(255,68,85,.4)',
                color: '#ff4455',
                fontSize: 14,
                padding: '10px 28px',
                borderRadius: 12,
              }}
              onClick={newGame}
            >
              Try Again
            </button>
          </div>
        )}

        {/* ── Win overlay ── */}
        {wonOverlay && (
          <div style={overlayStyle}>
            <div style={{
              fontFamily: 'var(--ff-head)',
              fontSize: 30,
              fontWeight: 900,
              color: 'var(--gold)',
              textShadow: '0 0 24px rgba(255,204,0,.7)',
            }}>
              You Win! 🎉
            </div>
            <div style={{
              fontFamily: 'var(--ff-body)',
              fontSize: 13,
              color: '#aaa',
              textAlign: 'center',
              lineHeight: 1.6,
            }}>
              You reached the 2048 tile!
            </div>
            <div style={{
              display: 'flex',
              gap: 8,
              background: 'rgba(255,204,0,.08)',
              border: '1px solid rgba(255,204,0,.2)',
              borderRadius: 10,
              padding: '6px 16px',
              fontFamily: 'var(--ff-head)',
              fontSize: 14,
              fontWeight: 700,
              color: 'var(--gold)',
            }}>
              +{WIN_COINS} 🪙 &nbsp; +{WIN_XP} XP
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button
                style={{
                  ...newGameBtnStyle,
                  background: 'rgba(0,255,136,.12)',
                  border: '1px solid rgba(0,255,136,.3)',
                  color: 'var(--green)',
                  fontSize: 13,
                  padding: '9px 18px',
                  borderRadius: 11,
                }}
                onClick={() => setWonOverlay(false)}
              >
                Keep Going
              </button>
              <button
                style={{
                  ...newGameBtnStyle,
                  fontSize: 13,
                  padding: '9px 18px',
                  borderRadius: 11,
                }}
                onClick={newGame}
              >
                New Game
              </button>
              <button
                style={{
                  ...newGameBtnStyle,
                  background: 'rgba(255,204,0,.12)',
                  border: '1px solid rgba(255,204,0,.3)',
                  color: 'var(--gold)',
                  fontSize: 13,
                  padding: '9px 18px',
                  borderRadius: 11,
                }}
                onClick={onExit}
              >
                Exit
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Hint ── */}
      <div style={{
        textAlign: 'center',
        fontSize: 11,
        color: '#444',
        fontFamily: 'var(--ff-body)',
        padding: '10px 0 4px',
        letterSpacing: '0.3px',
      }}>
        Swipe or use arrow keys to move tiles
      </div>
    </div>
  )
})
