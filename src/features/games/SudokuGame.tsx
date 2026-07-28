import { memo, useState, useCallback, useEffect } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

type Board = (number | null)[][]

const PUZZLES: { clues: Board; solution: number[][] }[] = [
  {
    clues: [
      [5,3,null,null,7,null,null,null,null],
      [6,null,null,1,9,5,null,null,null],
      [null,9,8,null,null,null,null,6,null],
      [8,null,null,null,6,null,null,null,3],
      [4,null,null,8,null,3,null,null,1],
      [7,null,null,null,2,null,null,null,6],
      [null,6,null,null,null,null,2,8,null],
      [null,null,null,4,1,9,null,null,5],
      [null,null,null,null,8,null,null,7,9],
    ],
    solution: [
      [5,3,4,6,7,8,9,1,2],
      [6,7,2,1,9,5,3,4,8],
      [1,9,8,3,4,2,5,6,7],
      [8,5,9,7,6,1,4,2,3],
      [4,2,6,8,5,3,7,9,1],
      [7,1,3,9,2,4,8,5,6],
      [9,6,1,5,3,7,2,8,4],
      [2,8,7,4,1,9,6,3,5],
      [3,4,5,2,8,6,1,7,9],
    ],
  },
  {
    clues: [
      [null,null,null,2,6,null,7,null,1],
      [6,8,null,null,7,null,null,9,null],
      [1,9,null,null,null,4,5,null,null],
      [8,2,null,1,null,null,null,4,null],
      [null,null,4,6,null,2,9,null,null],
      [null,5,null,null,null,3,null,2,8],
      [null,null,9,3,null,null,null,7,4],
      [null,4,null,null,5,null,null,3,6],
      [7,null,3,null,1,8,null,null,null],
    ],
    solution: [
      [4,3,5,2,6,9,7,8,1],
      [6,8,2,5,7,1,4,9,3],
      [1,9,7,8,3,4,5,6,2],
      [8,2,6,1,9,5,3,4,7],
      [3,7,4,6,8,2,9,1,5],
      [9,5,1,7,4,3,6,2,8],
      [5,1,9,3,2,6,8,7,4],
      [2,4,8,9,5,7,1,3,6],
      [7,6,3,4,1,8,2,5,9],
    ],
  },
]

export const SudokuGame = memo(function SudokuGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [puzzleIdx] = useState(() => Math.floor(Math.random() * PUZZLES.length))
  const [board, setBoard] = useState<Board>([])
  const [selected, setSelected] = useState<[number, number] | null>(null)
  const [errors, setErrors] = useState(0)
  const [startTime, setStartTime] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [bestTime] = useState(() => Number(localStorage.getItem('k0509_sudoku_best') ?? 0))

  const puzzle = PUZZLES[puzzleIdx]

  useEffect(() => {
    if (phase !== 'playing') return
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000)
    return () => clearInterval(t)
  }, [phase, startTime])

  const start = useCallback(() => {
    setBoard(puzzle.clues.map(row => [...row]))
    setSelected(null); setErrors(0); setElapsed(0); setStartTime(Date.now())
    setPhase('playing')
  }, [puzzle])

  const input = useCallback((num: number) => {
    if (!selected || phase !== 'playing') return
    const [r, c] = selected
    if (puzzle.clues[r][c] !== null) return
    const next = board.map(row => [...row])
    if (num === 0) { next[r][c] = null; setBoard(next); return }
    next[r][c] = num
    setBoard(next)
    if (num !== puzzle.solution[r][c]) { setErrors(e => e + 1); audio.click() }
    else {
      audio.coin()
      const filled = next.flat().filter((v, i) => {
        const br = Math.floor(i / 9), bc = i % 9
        return v !== null && v === puzzle.solution[br][bc]
      }).length
      if (filled === 81) {
        const t = Math.floor((Date.now() - startTime) / 1000)
        const prev = Number(localStorage.getItem('k0509_sudoku_best') ?? 0)
        if (!prev || t < prev) localStorage.setItem('k0509_sudoku_best', String(t))
        setPhase('done')
        onWin(Math.max(800 - t - errors * 20, 200), Math.max(600 - t / 2, 100))
        audio.achievement()
      }
    }
  }, [selected, phase, board, puzzle, startTime, errors, onWin])

  const cellBg = (r: number, c: number) => {
    if (!selected) return 'transparent'
    const [sr, sc] = selected
    if (sr === r && sc === c) return 'rgba(99,102,241,.35)'
    if (sr === r || sc === c || (Math.floor(sr/3)===Math.floor(r/3) && Math.floor(sc/3)===Math.floor(c/3))) return 'rgba(99,102,241,.08)'
    return 'transparent'
  }

  const cellColor = (r: number, c: number, val: number | null) => {
    if (val === null) return '#555'
    if (puzzle.clues[r][c] !== null) return '#e8e8f0'
    return val === puzzle.solution[r][c] ? '#4ade80' : '#f87171'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🔢 Sudoku</span>
        <span className={styles.scoreDisplay}>{elapsed}s · ✗{errors}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🔢</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Sudoku</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Fyll i 1–9 i varje rad, kolumn och 3×3-ruta<br />Snabbare = fler mynt!
          </div>
          {bestTime > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestTime}s</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {(phase === 'playing' || phase === 'done') && board.length > 0 && (
        <div style={{ padding: '0 8px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9,1fr)', gap: 1, border: '2px solid rgba(255,255,255,.2)', borderRadius: 8, overflow: 'hidden', maxWidth: 324, width: '100%' }}>
            {board.map((row, r) => row.map((val, c) => (
              <button key={`${r}-${c}`} onClick={() => setSelected([r, c])} style={{
                aspectRatio: '1', fontSize: 13, fontWeight: 900, padding: 0, border: 'none',
                borderRight: (c+1) % 3 === 0 && c < 8 ? '1.5px solid rgba(255,255,255,.3)' : '1px solid rgba(255,255,255,.08)',
                borderBottom: (r+1) % 3 === 0 && r < 8 ? '1.5px solid rgba(255,255,255,.3)' : '1px solid rgba(255,255,255,.08)',
                background: cellBg(r, c), color: cellColor(r, c, val), cursor: 'pointer',
              }}>
                {val ?? ''}
              </button>
            )))}
          </div>
          {phase === 'playing' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 6, maxWidth: 280, width: '100%' }}>
              {[1,2,3,4,5,6,7,8,9,0].map(n => (
                <button key={n} onClick={() => input(n)} style={{ padding: '10px 0', borderRadius: 8, fontSize: 14, fontWeight: 900, background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)', color: n === 0 ? '#f87171' : '#e8e8f0', cursor: 'pointer' }}>
                  {n === 0 ? '✕' : n}
                </button>
              ))}
            </div>
          )}
          {phase === 'done' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>🎉 Sudoku klar!</div>
              <div style={{ fontSize: 13, color: '#fbbf24', marginBottom: 8 }}>+{Math.max(800 - elapsed - errors * 20, 200)}🪙</div>
              <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Ny Sudoku</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
})
