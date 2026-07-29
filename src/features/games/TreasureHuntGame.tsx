import { memo, useState, useCallback } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const SIZE = 6
const TREASURES = 4
const TRAPS = 6

type Cell = 'hidden' | 'empty' | 'near' | 'treasure' | 'trap'

function makeBoard(): { board: Cell[][], solution: Cell[][], positions: { treasures: number[], traps: number[] } } {
  const solution: Cell[][] = Array.from({ length: SIZE }, () => Array(SIZE).fill('empty'))
  const all = Array.from({ length: SIZE * SIZE }, (_, i) => i)
  const shuffled = all.sort(() => Math.random() - 0.5)
  const treasureIdxs = shuffled.slice(0, TREASURES)
  const trapIdxs = shuffled.slice(TREASURES, TREASURES + TRAPS)
  for (const idx of treasureIdxs) solution[Math.floor(idx / SIZE)][idx % SIZE] = 'treasure'
  for (const idx of trapIdxs) solution[Math.floor(idx / SIZE)][idx % SIZE] = 'trap'
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
    if (solution[r][c] !== 'empty') continue
    let nearTreasure = false
    for (const [dr, dc] of [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]]) {
      const nr = r + dr, nc = c + dc
      if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && solution[nr][nc] === 'treasure') { nearTreasure = true; break }
    }
    if (nearTreasure) solution[r][c] = 'near'
  }
  const board: Cell[][] = Array.from({ length: SIZE }, () => Array(SIZE).fill('hidden'))
  return { board, solution, positions: { treasures: treasureIdxs, traps: trapIdxs } }
}

export const TreasureHuntGame = memo(function TreasureHuntGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [board, setBoard] = useState<Cell[][]>([])
  const [solution, setSolution] = useState<Cell[][]>([])
  const [found, setFound] = useState(0)
  const [moves, setMoves] = useState(0)
  const [result, setResult] = useState<'win' | 'lose' | null>(null)
  const [bestFound] = useState(() => Number(localStorage.getItem('k0509_th_best') ?? 0))

  const start = useCallback(() => {
    const { board: b, solution: s } = makeBoard()
    setBoard(b); setSolution(s); setFound(0); setMoves(0); setResult(null); setPhase('playing')
  }, [])

  const reveal = useCallback((r: number, c: number) => {
    if (phase !== 'playing' || board[r][c] !== 'hidden') return
    const cell = solution[r][c]
    setBoard(prev => {
      const nb = prev.map(row => [...row])
      nb[r][c] = cell
      return nb
    })
    setMoves(m => m + 1)
    if (cell === 'treasure') {
      const newFound = found + 1
      setFound(newFound)
      audio.coin()
      if (newFound >= TREASURES) {
        const score = Math.max(0, (TREASURES * 200) - moves * 20)
        const prev = Number(localStorage.getItem('k0509_th_best') ?? 0)
        if (newFound > prev) localStorage.setItem('k0509_th_best', String(newFound))
        audio.achievement()
        onWin(Math.round(score / 5), score)
        setResult('win'); setPhase('done')
      }
    } else if (cell === 'trap') {
      audio.tap()
      const score = found * 80
      const prev = Number(localStorage.getItem('k0509_th_best') ?? 0)
      if (found > prev) localStorage.setItem('k0509_th_best', String(found))
      if (score > 0) onWin(Math.round(score / 5), score)
      setSolution(prev => {
        const ns = prev.map(row => [...row])
        setBoard(b => b.map((row, ri) => row.map((cell, ci) => cell === 'hidden' ? ns[ri][ci] : cell)))
        return ns
      })
      setResult('lose'); setPhase('done')
    } else {
      audio.tap()
    }
  }, [phase, board, solution, found, moves, onWin])

  const cellStyle = (cell: Cell): React.CSSProperties => {
    const base: React.CSSProperties = { aspectRatio: '1', borderRadius: 8, border: 'none', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .12s' }
    if (cell === 'hidden') return { ...base, background: 'rgba(129,140,248,.15)', border: '1px solid rgba(129,140,248,.2)' }
    if (cell === 'treasure') return { ...base, background: 'rgba(251,191,36,.2)', border: '2px solid #fbbf24', cursor: 'default' }
    if (cell === 'trap') return { ...base, background: 'rgba(248,113,113,.2)', border: '2px solid #f87171', cursor: 'default' }
    if (cell === 'near') return { ...base, background: 'rgba(74,222,128,.1)', border: '1px solid rgba(74,222,128,.2)', cursor: 'default' }
    return { ...base, background: 'rgba(255,255,255,.04)', cursor: 'default' }
  }

  const cellContent = (cell: Cell) => {
    if (cell === 'hidden') return '❓'
    if (cell === 'treasure') return '💎'
    if (cell === 'trap') return '💀'
    if (cell === 'near') return '✨'
    return '⬜'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🗺️ Skattjakt</span>
        <span className={styles.scoreDisplay}>{found}/{TREASURES} 💎 · {moves} drag</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🗺️</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Skattjakt</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Hitta alla {TREASURES} skatter utan att gå i fällan!<br />✨ = nära en skatt · 💀 = fälla (game over)
          </div>
          {bestFound > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestFound} skatter hittade</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {(phase === 'playing' || phase === 'done') && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${SIZE}, 1fr)`, gap: 5 }}>
            {board.map((row, r) => row.map((cell, c) => (
              <button key={`${r}-${c}`} style={cellStyle(cell)} onClick={() => reveal(r, c)}>
                {cellContent(cell)}
              </button>
            )))}
          </div>

          {phase === 'done' && (
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
              <div style={{ fontWeight: 900, fontSize: 16, color: result === 'win' ? '#4ade80' : '#f87171' }}>
                {result === 'win' ? `🎉 Alla skatter hittade på ${moves} drag!` : `💀 Fälla! ${found}/${TREASURES} skatter hittade`}
              </div>
              <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Spela igen!</button>
            </div>
          )}

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', fontSize: 11, color: 'var(--t3)' }}>
            <span>❓ = Okänd</span><span>✨ = Nära</span><span>💎 = Skatt</span><span>💀 = Fälla</span>
          </div>
        </div>
      )}
    </div>
  )
})
