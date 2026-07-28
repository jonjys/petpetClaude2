import { memo, useState, useCallback } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

type Cell = 'X' | 'O' | null
type Board = Cell[]

function checkWinner(b: Board): Cell | 'draw' | null {
  const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]
  for (const [a, c, d] of lines) {
    if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a]
  }
  if (b.every(c => c !== null)) return 'draw'
  return null
}

function minimax(b: Board, isMax: boolean, depth: number): number {
  const w = checkWinner(b)
  if (w === 'O') return 10 - depth
  if (w === 'X') return depth - 10
  if (w === 'draw') return 0
  const moves = b.map((c, i) => c === null ? i : -1).filter(i => i >= 0)
  if (isMax) {
    let best = -Infinity
    for (const m of moves) {
      b[m] = 'O'; best = Math.max(best, minimax(b, false, depth + 1)); b[m] = null
    }
    return best
  } else {
    let best = Infinity
    for (const m of moves) {
      b[m] = 'X'; best = Math.min(best, minimax(b, true, depth + 1)); b[m] = null
    }
    return best
  }
}

function bestMove(b: Board): number {
  let best = -Infinity, move = -1
  for (let i = 0; i < 9; i++) {
    if (b[i] === null) {
      b[i] = 'O'
      const score = minimax(b, false, 0)
      b[i] = null
      if (score > best) { best = score; move = i }
    }
  }
  return move
}

export const TicTacToeGame = memo(function TicTacToeGame({ onExit, onWin }: Props) {
  const [board, setBoard] = useState<Board>(Array(9).fill(null))
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [result, setResult] = useState<'win' | 'lose' | 'draw' | null>(null)
  const [wins, setWins] = useState(0)
  const [games, setGames] = useState(0)
  const [thinking, setThinking] = useState(false)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_ttt_best') ?? 0))

  const start = useCallback(() => {
    setBoard(Array(9).fill(null))
    setResult(null)
    setPhase('playing')
    setThinking(false)
  }, [])

  const handleClick = useCallback((i: number) => {
    if (thinking || result) return
    setBoard(prev => {
      if (prev[i] !== null) return prev
      const nb = [...prev]
      nb[i] = 'X'
      const w = checkWinner(nb)
      if (w) {
        const won = w === 'X'
        const draw = w === 'draw'
        const newWins = won ? wins + 1 : wins
        const newGames = games + 1
        setWins(newWins); setGames(newGames)
        setResult(won ? 'win' : draw ? 'draw' : 'lose')
        const score = won ? newWins * 50 : draw ? 10 : 0
        if (won) { audio.achievement(); const prev2 = Number(localStorage.getItem('k0509_ttt_best') ?? 0); if (newWins > prev2) localStorage.setItem('k0509_ttt_best', String(newWins)) }
        else audio.click()
        if (won) onWin(score, score * 2)
        setPhase('done')
        return nb
      }
      // Computer move
      setThinking(true)
      setTimeout(() => {
        const nb2 = [...nb]
        const m = bestMove(nb2)
        if (m >= 0) nb2[m] = 'O'
        const w2 = checkWinner(nb2)
        if (w2) {
          const won2 = w2 === 'X'
          const draw2 = w2 === 'draw'
          const newWins2 = won2 ? wins + 1 : wins
          setWins(newWins2); setGames(games + 1)
          setResult(won2 ? 'win' : draw2 ? 'draw' : 'lose')
          if (won2) { audio.achievement(); const prev2 = Number(localStorage.getItem('k0509_ttt_best') ?? 0); if (newWins2 > prev2) localStorage.setItem('k0509_ttt_best', String(newWins2)) }
          else audio.click()
          if (won2) onWin((wins + 1) * 50, (wins + 1) * 100)
          setPhase('done')
        }
        setBoard(nb2)
        setThinking(false)
      }, 400)
      return nb
    })
  }, [thinking, result, wins, games, onWin])

  const winner = checkWinner(board)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>⭕ Tre-i-rad</span>
        <span className={styles.scoreDisplay}>{wins}V · {games}S</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>⭕</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Tre-i-rad</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Du är X · Datorn är O (minimax AI)<br />Klicka för att spela!
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Bäst: {bestScore} vinster</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {(phase === 'playing' || phase === 'done') && (
        <div style={{ padding: '0 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
            {thinking && <div style={{ fontSize: 12, color: 'var(--t3)' }}>Datorn tänker...</div>}
            {result === 'win' && <div style={{ fontSize: 14, fontWeight: 900, color: '#4ade80' }}>🎉 Du vann!</div>}
            {result === 'lose' && <div style={{ fontSize: 14, fontWeight: 900, color: '#f87171' }}>😅 Datorn vann!</div>}
            {result === 'draw' && <div style={{ fontSize: 14, fontWeight: 900, color: '#fbbf24' }}>🤝 Oavgjort!</div>}
            {!result && !thinking && <div style={{ fontSize: 12, color: 'var(--t3)' }}>Din tur (X)</div>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, maxWidth: 240, margin: '0 auto' }}>
            {board.map((cell, i) => {
              const winCells = winner && winner !== 'draw'
                ? [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]].find(l => board[l[0]] === winner && board[l[1]] === winner && board[l[2]] === winner)
                : null
              const isWinCell = winCells?.includes(i)
              return (
                <button
                  key={i}
                  onClick={() => handleClick(i)}
                  disabled={cell !== null || !!result || thinking}
                  style={{ height: 72, borderRadius: 14, background: isWinCell ? 'rgba(74,222,128,.15)' : 'rgba(255,255,255,.05)', border: `2px solid ${isWinCell ? 'rgba(74,222,128,.4)' : 'rgba(255,255,255,.1)'}`, fontSize: 32, cursor: cell ? 'default' : 'pointer', color: cell === 'X' ? '#818cf8' : '#f87171', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {cell ?? ''}
                </button>
              )
            })}
          </div>
          <div style={{ textAlign: 'center', marginTop: 14, display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Nytt spel</button>
            {wins > 0 && <button className="btn-primary" style={{ padding: '10px 24px', background: 'rgba(251,191,36,.2)' }} onClick={() => { onWin(wins * 50, wins * 100); setPhase('ready') }}>Hämta belöning</button>}
          </div>
        </div>
      )}
    </div>
  )
})
