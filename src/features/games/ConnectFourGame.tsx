import { memo, useState, useCallback } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const COLS = 7
const ROWS = 6

type Cell = 0 | 1 | 2
type Board = Cell[][]

function emptyBoard(): Board {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(0) as Cell[])
}

function drop(board: Board, col: number, player: 1 | 2): Board | null {
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r][col] === 0) {
      const nb = board.map(row => [...row]) as Board
      nb[r][col] = player
      return nb
    }
  }
  return null
}

function checkWin(board: Board, p: 1 | 2): [number, number][] | null {
  const dirs = [[0,1],[1,0],[1,1],[1,-1]]
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c] !== p) continue
      for (const [dr, dc] of dirs) {
        const cells: [number,number][] = [[r,c]]
        for (let k = 1; k < 4; k++) {
          const nr = r + dr*k, nc = c + dc*k
          if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || board[nr][nc] !== p) break
          cells.push([nr,nc])
        }
        if (cells.length === 4) return cells
      }
    }
  }
  return null
}

function isFull(board: Board): boolean {
  return board[0].every(c => c !== 0)
}

function scoreBoard(board: Board, p: 1 | 2): number {
  let score = 0
  const opp = p === 2 ? 1 : 2
  const dirs = [[0,1],[1,0],[1,1],[1,-1]]
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      for (const [dr, dc] of dirs) {
        let mine = 0, empty = 0
        for (let k = 0; k < 4; k++) {
          const nr = r + dr*k, nc = c + dc*k
          if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) { mine = -99; break }
          if (board[nr][nc] === p) mine++
          else if (board[nr][nc] === 0) empty++
          else { mine = -99; break }
        }
        if (mine >= 0) score += mine === 3 && empty === 1 ? 100 : mine === 2 && empty === 2 ? 5 : mine === 1 && empty === 3 ? 1 : 0
        let theirs = 0; let e2 = 0
        for (let k = 0; k < 4; k++) {
          const nr = r + dr*k, nc = c + dc*k
          if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) { theirs = -99; break }
          if (board[nr][nc] === opp) theirs++
          else if (board[nr][nc] === 0) e2++
          else { theirs = -99; break }
        }
        if (theirs >= 0) score -= theirs === 3 && e2 === 1 ? 200 : 0
      }
    }
  }
  return score
}

function aiMove(board: Board): number {
  let best = -Infinity, col = 3
  for (let c = 0; c < COLS; c++) {
    const nb = drop(board, c, 2)
    if (!nb) continue
    if (checkWin(nb, 2)) return c
    const score = scoreBoard(nb, 2)
    if (score > best) { best = score; col = c }
  }
  return col
}

export const ConnectFourGame = memo(function ConnectFourGame({ onExit, onWin }: Props) {
  const [board, setBoard] = useState<Board>(emptyBoard())
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [result, setResult] = useState<'win' | 'lose' | 'draw' | null>(null)
  const [winCells, setWinCells] = useState<[number, number][] | null>(null)
  const [wins, setWins] = useState(0)
  const [thinking, setThinking] = useState(false)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_c4_best') ?? 0))

  const start = useCallback(() => {
    setBoard(emptyBoard()); setResult(null); setWinCells(null); setThinking(false); setPhase('playing')
  }, [])

  const handleCol = useCallback((col: number) => {
    if (thinking || result) return
    setBoard(prev => {
      const nb = drop(prev, col, 1)
      if (!nb) return prev
      const w1 = checkWin(nb, 1)
      if (w1) {
        const newWins = wins + 1
        setWins(newWins); setWinCells(w1); setResult('win')
        const prev2 = Number(localStorage.getItem('k0509_c4_best') ?? 0)
        if (newWins > prev2) localStorage.setItem('k0509_c4_best', String(newWins))
        audio.achievement(); onWin(newWins * 80, newWins * 160); setPhase('done')
        return nb
      }
      if (isFull(nb)) { setResult('draw'); audio.click(); setPhase('done'); return nb }
      setThinking(true)
      setTimeout(() => {
        const aiCol = aiMove(nb)
        const nb2 = drop(nb, aiCol, 2) ?? nb
        const w2 = checkWin(nb2, 2)
        if (w2) { setWinCells(w2); setResult('lose'); audio.click(); setPhase('done') }
        else if (isFull(nb2)) { setResult('draw'); audio.click(); setPhase('done') }
        setBoard(nb2); setThinking(false)
      }, 500)
      return nb
    })
  }, [thinking, result, wins, onWin])

  const COLORS = ['transparent', '#818cf8', '#f87171']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🔵 Fyra i rad</span>
        <span className={styles.scoreDisplay}>{wins} vinster</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🔵</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Fyra i rad</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Du är 🟣 · Datorn är 🔴<br />Få fyra i rad — horisontellt, vertikalt eller diagonalt!
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Bäst: {bestScore} vinster</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {(phase === 'playing' || phase === 'done') && (
        <div style={{ padding: '0 8px' }}>
          {/* Column click buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${COLS}, 1fr)`, gap: 3, marginBottom: 4 }}>
            {Array(COLS).fill(null).map((_, c) => (
              <button key={c} onClick={() => handleCol(c)} disabled={!!result || thinking} style={{ height: 22, borderRadius: 6, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', cursor: 'pointer', fontSize: 10 }}>▼</button>
            ))}
          </div>
          {/* Board */}
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${COLS}, 1fr)`, gap: 3 }}>
            {board.map((row, r) => row.map((cell, c) => {
              const isWin = winCells?.some(([wr, wc]) => wr === r && wc === c)
              return (
                <div key={`${r}-${c}`} style={{ height: 36, borderRadius: 50, background: isWin ? 'rgba(251,191,36,.5)' : cell ? COLORS[cell] : 'rgba(255,255,255,.06)', border: `2px solid ${isWin ? '#fbbf24' : 'rgba(255,255,255,.08)'}`, transition: 'background .15s' }} />
              )
            }))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 8, minHeight: 20 }}>
            {thinking && <span style={{ fontSize: 12, color: 'var(--t3)' }}>Datorn tänker...</span>}
            {result === 'win' && <span style={{ fontSize: 14, fontWeight: 900, color: '#4ade80' }}>🎉 Du vann!</span>}
            {result === 'lose' && <span style={{ fontSize: 14, fontWeight: 900, color: '#f87171' }}>Datorn vann!</span>}
            {result === 'draw' && <span style={{ fontSize: 14, fontWeight: 900, color: '#fbbf24' }}>Oavgjort!</span>}
          </div>
          <div style={{ textAlign: 'center', marginTop: 6 }}>
            <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Nytt spel</button>
          </div>
        </div>
      )}
    </div>
  )
})
