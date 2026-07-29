import { memo, useState, useCallback } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const GRID = 6
type Cell = 'empty' | 'wall' | 'start' | 'end' | 'path' | 'wrong'

function makeLevel(seed: number): { grid: Cell[][]; startR: number; startC: number; endR: number; endC: number } {
  const g: Cell[][] = Array.from({ length: GRID }, () => Array(GRID).fill('empty') as Cell[])
  const walls: [number, number][] = [
    [[1,1],[1,2],[2,4],[3,1],[3,3],[4,2],[4,4]],
    [[0,2],[1,3],[2,1],[3,4],[4,0],[4,3],[2,3]],
    [[1,0],[2,2],[2,4],[3,1],[4,3],[0,4],[3,3]],
    [[0,3],[1,2],[2,0],[3,3],[4,1],[1,4],[3,2]],
  ][seed % 4] as [number, number][]
  walls.forEach(([r, c]) => { g[r][c] = 'wall' })
  g[0][0] = 'start'; g[GRID-1][GRID-1] = 'end'
  return { grid: g, startR: 0, startC: 0, endR: GRID-1, endC: GRID-1 }
}

function hasPath(grid: Cell[][], visited: [number, number][]): boolean {
  if (visited.length === 0) return false
  const last = visited[visited.length - 1]
  return last[0] === GRID - 1 && last[1] === GRID - 1
}

export const PathfinderGame = memo(function PathfinderGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [level, setLevel] = useState(0)
  const [grid, setGrid] = useState<Cell[][]>([])
  const [visited, setVisited] = useState<[number, number][]>([])
  const [score, setScore] = useState(0)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_pf_best') ?? 0))
  const [feedback, setFeedback] = useState<string | null>(null)
  const LEVELS = 5

  const startLevel = useCallback((lvl: number) => {
    const { grid: g } = makeLevel(lvl)
    setGrid(g); setVisited([[0, 0]]); setFeedback(null)
  }, [])

  const start = useCallback(() => {
    setScore(0); setLevel(0); setPhase('playing')
    startLevel(0)
  }, [startLevel])

  const tap = useCallback((r: number, c: number) => {
    if (feedback !== null) return
    if (grid[r][c] === 'wall') {
      setFeedback('❌ Vägg!')
      audio.tap()
      setTimeout(() => {
        const pts = score
        const prev = Number(localStorage.getItem('k0509_pf_best') ?? 0)
        if (pts > prev) localStorage.setItem('k0509_pf_best', String(pts))
        if (pts > 0) onWin(Math.round(pts / 8), pts)
        setPhase('done')
      }, 1000)
      return
    }
    const last = visited[visited.length - 1]
    const dr = Math.abs(r - last[0]); const dc = Math.abs(c - last[1])
    if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) {
      const alreadyVisited = visited.some(([vr, vc]) => vr === r && vc === c)
      if (!alreadyVisited) {
        const nv: [number, number][] = [...visited, [r, c]]
        setVisited(nv)
        audio.coin()
        if (r === GRID - 1 && c === GRID - 1) {
          const pts = score + (LEVELS - level) * 100 + nv.length * 5
          setScore(pts)
          setFeedback(`✅ Nivå ${level + 1} klar! +${(LEVELS - level) * 100 + nv.length * 5}p`)
          setTimeout(() => {
            const nl = level + 1
            if (nl >= LEVELS) {
              const prev = Number(localStorage.getItem('k0509_pf_best') ?? 0)
              if (pts > prev) localStorage.setItem('k0509_pf_best', String(pts))
              onWin(Math.round(pts / 7), pts)
              setPhase('done')
            } else {
              setLevel(nl); startLevel(nl)
            }
          }, 1200)
        }
      }
    }
  }, [grid, visited, feedback, score, level, onWin, startLevel])

  const getCellColor = (r: number, c: number): string => {
    const isVisited = visited.some(([vr, vc]) => vr === r && vc === c)
    const cell = grid[r]?.[c]
    if (cell === 'wall') return 'rgba(239,68,68,.25)'
    if (cell === 'end') return 'rgba(74,222,128,.2)'
    if (cell === 'start') return 'rgba(96,165,250,.3)'
    if (isVisited) return 'rgba(96,165,250,.18)'
    return 'rgba(255,255,255,.04)'
  }
  const getCellBorder = (r: number, c: number): string => {
    const isVisited = visited.some(([vr, vc]) => vr === r && vc === c)
    const cell = grid[r]?.[c]
    if (cell === 'wall') return '1px solid rgba(239,68,68,.4)'
    if (cell === 'end') return '1px solid rgba(74,222,128,.4)'
    if (isVisited) return '1px solid rgba(96,165,250,.35)'
    return '1px solid rgba(255,255,255,.08)'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🗺️ Vägfinnaren</span>
        <span className={styles.scoreDisplay}>{score}p · Niv {phase === 'playing' ? level + 1 : 0}/{LEVELS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🗺️</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Vägfinnaren</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Hitta vägen från ● till ■ i 5 nivåer! Tryck intilliggande celler i ordning — vägg = game over.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}p</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && grid.length > 0 && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--t3)' }}>Hitta vägen från 🔵 till 🟩</div>
          {feedback && <div style={{ textAlign: 'center', fontWeight: 700, fontSize: 13, color: feedback.startsWith('✅') ? '#4ade80' : '#f87171' }}>{feedback}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${GRID}, 1fr)`, gap: 4 }}>
            {grid.map((row, r) => row.map((cell, c) => {
              const isLast = visited.length > 0 && visited[visited.length - 1][0] === r && visited[visited.length - 1][1] === c
              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => tap(r, c)}
                  style={{
                    height: 48,
                    borderRadius: 8,
                    background: getCellColor(r, c),
                    border: getCellBorder(r, c),
                    fontSize: cell === 'wall' ? 16 : cell === 'end' ? 16 : cell === 'start' ? 16 : 11,
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: isLast ? '0 0 10px rgba(96,165,250,.5)' : 'none',
                  }}
                >
                  {cell === 'wall' ? '🧱' : cell === 'end' ? '🏁' : isLast ? '●' : ''}
                </button>
              )
            }))}
          </div>
          <div style={{ fontSize: 10, color: 'var(--t3)', textAlign: 'center' }}>Tryck celler intill varandra för att rita vägen</div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <div style={{ fontWeight: 900, color: '#4ade80', fontSize: 20 }}>🗺️ {score}p!</div>
          <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
