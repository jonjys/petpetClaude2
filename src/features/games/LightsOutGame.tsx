import { memo, useState, useCallback } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const SIZE = 5

function makeBoard(difficulty: number): boolean[][] {
  const board = Array.from({ length: SIZE }, () => Array(SIZE).fill(false) as boolean[])
  const clicks = 5 + difficulty * 3
  for (let i = 0; i < clicks; i++) {
    const r = Math.floor(Math.random() * SIZE)
    const c = Math.floor(Math.random() * SIZE)
    toggle(board, r, c)
  }
  if (board.every(row => row.every(v => !v))) return makeBoard(difficulty)
  return board
}

function toggle(board: boolean[][], r: number, c: number): void {
  for (const [dr, dc] of [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1]]) {
    const nr = r + dr, nc = c + dc
    if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE) board[nr][nc] = !board[nr][nc]
  }
}

export const LightsOutGame = memo(function LightsOutGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [board, setBoard] = useState<boolean[][]>([])
  const [moves, setMoves] = useState(0)
  const [difficulty, setDifficulty] = useState(1)
  const [bestMoves] = useState(() => Number(localStorage.getItem('k0509_lo_best') ?? 0))

  const start = useCallback((diff: number) => {
    setBoard(makeBoard(diff)); setMoves(0); setDifficulty(diff); setPhase('playing')
  }, [])

  const handleCell = useCallback((r: number, c: number) => {
    setBoard(prev => {
      const nb = prev.map(row => [...row])
      toggle(nb, r, c)
      const allOff = nb.every(row => row.every(v => !v))
      if (allOff) {
        const m = moves + 1
        const score = Math.max(0, (50 - m) * (difficulty + 1) * 10)
        const prev2 = Number(localStorage.getItem('k0509_lo_best') ?? 0)
        if (!prev2 || m < prev2) localStorage.setItem('k0509_lo_best', String(m))
        audio.achievement()
        onWin(Math.round(score / 5), score)
        setTimeout(() => setPhase('done'), 100)
      } else {
        audio.tap()
      }
      return nb
    })
    setMoves(m => m + 1)
  }, [moves, difficulty, onWin])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>💡 Lights Out</span>
        <span className={styles.scoreDisplay}>{moves} drag</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '20px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>💡</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Lights Out</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Klicka en cell för att toggla den och grannarna.<br />Släck alla lampor för att vinna!
          </div>
          {bestMoves > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestMoves} drag</div>}
          <div style={{ display: 'flex', gap: 8 }}>
            {['Lätt', 'Medel', 'Svårt'].map((label, i) => (
              <button key={i} className="btn-primary" style={{ padding: '10px 18px', fontSize: 14, background: i === 0 ? 'rgba(74,222,128,.2)' : i === 1 ? 'rgba(251,191,36,.2)' : 'rgba(248,113,113,.2)', border: `1px solid ${i === 0 ? '#4ade80' : i === 1 ? '#fbbf24' : '#f87171'}`, color: i === 0 ? '#4ade80' : i === 1 ? '#fbbf24' : '#f87171' }} onClick={() => start(i)}>{label}</button>
            ))}
          </div>
        </div>
      )}

      {(phase === 'playing' || phase === 'done') && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${SIZE}, 1fr)`, gap: 6, width: '100%', maxWidth: 280 }}>
            {board.map((row, r) => row.map((cell, c) => (
              <button
                key={`${r}-${c}`}
                onClick={phase === 'playing' ? () => handleCell(r, c) : undefined}
                style={{
                  aspectRatio: '1',
                  borderRadius: 10,
                  border: 'none',
                  background: cell
                    ? 'radial-gradient(circle, #fef08a, #fbbf24)'
                    : 'rgba(255,255,255,.06)',
                  boxShadow: cell ? '0 0 12px rgba(251,191,36,.6), 0 0 4px rgba(251,191,36,.8)' : 'none',
                  cursor: phase === 'playing' ? 'pointer' : 'default',
                  transition: 'background .12s, box-shadow .12s',
                  fontSize: 18,
                }}
              >
                {cell ? '💡' : '🔵'}
              </button>
            )))}
          </div>

          {phase === 'done' && (
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
              <div style={{ fontWeight: 900, color: '#4ade80', fontSize: 16 }}>🎉 Klar på {moves} drag!</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {['Lätt', 'Medel', 'Svårt'].map((label, i) => (
                  <button key={i} className="btn-primary" style={{ padding: '8px 14px', fontSize: 13 }} onClick={() => start(i)}>{label}</button>
                ))}
              </div>
            </div>
          )}

          {phase === 'playing' && (
            <div style={{ fontSize: 11, color: 'var(--t3)' }}>
              {board.flat().filter(Boolean).length} lampor kvar · {moves} drag
            </div>
          )}
        </div>
      )}
    </div>
  )
})
