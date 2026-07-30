import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const ROUNDS = 5
const GRID = 4
const ROUND_TIME = 10

function makeGrid(): number[][] {
  return Array.from({ length: GRID }, () =>
    Array.from({ length: GRID }, () => 1 + Math.floor(Math.random() * 9))
  )
}

function bestPath(grid: number[][]): number {
  const dp: number[][] = Array.from({ length: GRID }, () => Array(GRID).fill(0))
  dp[0][0] = grid[0][0]
  for (let c = 1; c < GRID; c++) dp[0][c] = dp[0][c - 1] + grid[0][c]
  for (let r = 1; r < GRID; r++) dp[r][0] = dp[r - 1][0] + grid[r][0]
  for (let r = 1; r < GRID; r++)
    for (let c = 1; c < GRID; c++)
      dp[r][c] = Math.max(dp[r - 1][c], dp[r][c - 1]) + grid[r][c]
  return dp[GRID - 1][GRID - 1]
}

export const MathPathGame = memo(function MathPathGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'result' | 'done'>('ready')
  const [round, setRound] = useState(1)
  const [grid, setGrid] = useState<number[][]>([])
  const [path, setPath] = useState<[number, number][]>([[0, 0]])
  const [score, setScore] = useState(0)
  const [roundScore, setRoundScore] = useState(0)
  const [maxScore, setMaxScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_mp_best') ?? 0))
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const scoreRef = useRef(0)
  const roundRef = useRef(1)
  const pathRef = useRef<[number, number][]>([[0, 0]])

  const finishRound = useCallback((finalPath: [number, number][], g: number[][], currentScore: number, r: number) => {
    if (timerRef.current) clearInterval(timerRef.current)
    const pts = finalPath.reduce((s, [row, col]) => s + g[row][col], 0)
    const mx = bestPath(g)
    scoreRef.current += pts; setScore(scoreRef.current)
    setRoundScore(pts); setMaxScore(mx)
    audio.tap()
    setPhase('result')
    setTimeout(() => {
      const nr = r + 1
      if (nr > ROUNDS) {
        const s = scoreRef.current
        const prev = Number(localStorage.getItem('k0509_mp_best') ?? 0)
        if (s > prev) localStorage.setItem('k0509_mp_best', String(s))
        if (s > 0) onWin(Math.round(s / 8), s)
        setPhase('done')
      } else {
        startRound(nr, currentScore)
      }
    }, 1500)
  }, [onWin])

  const startRound = useCallback((r: number, currentScore: number) => {
    const g = makeGrid()
    const initialPath: [number, number][] = [[0, 0]]
    pathRef.current = initialPath
    roundRef.current = r
    setGrid(g); setPath(initialPath); setRound(r); setTimeLeft(ROUND_TIME)
    setPhase('playing')
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          finishRound(pathRef.current, g, currentScore, r)
          return 0
        }
        return t - 1
      })
    }, 1000)
  }, [finishRound])

  const start = useCallback(() => {
    scoreRef.current = 0; setScore(0)
    startRound(1, 0)
  }, [startRound])

  const handleCell = useCallback((row: number, col: number) => {
    if (phase !== 'playing') return
    const [cr, cc] = pathRef.current[pathRef.current.length - 1]
    const goRight = row === cr && col === cc + 1
    const goDown = col === cc && row === cr + 1
    if (!goRight && !goDown) return
    const newPath: [number, number][] = [...pathRef.current, [row, col]]
    pathRef.current = newPath
    setPath(newPath)
    if (row === GRID - 1 && col === GRID - 1) {
      finishRound(newPath, grid, scoreRef.current, roundRef.current)
    }
  }, [phase, grid, finishRound])

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  const isOnPath = (r: number, c: number) => path.some(([pr, pc]) => pr === r && pc === c)
  const [cr, cc] = path[path.length - 1] ?? [0, 0]
  const timerPct = (timeLeft / ROUND_TIME) * 100

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🗺️ Talstigen</span>
        <span className={styles.scoreDisplay}>{score}p · {round}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🗺️</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Talstigen</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 270, lineHeight: 1.6 }}>
            Navigera från ↖ till ↘ (höger eller ned). Samla så stor summa som möjligt! 10 sekunder per runda, 5 rundor.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}p</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {(phase === 'playing' || phase === 'result') && grid.length > 0 && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,.08)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${timerPct}%`, background: timerPct <= 30 ? '#f87171' : '#fbbf24', transition: 'width 1s linear' }} />
          </div>
          {phase === 'result' && (
            <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: roundScore >= maxScore * 0.9 ? '#4ade80' : roundScore >= maxScore * 0.7 ? '#fbbf24' : '#f87171' }}>
              {roundScore}p / max {maxScore}p {roundScore >= maxScore ? ' 🏆 PERFEKT!' : ''}
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${GRID}, 1fr)`, gap: 4 }}>
            {grid.map((row, r) => row.map((val, c) => {
              const onPath = isOnPath(r, c)
              const isHead = r === cr && c === cc
              const canMove = phase === 'playing' && ((r === cr && c === cc + 1) || (c === cc && r === cr + 1))
              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => handleCell(r, c)}
                  disabled={!canMove && phase === 'playing'}
                  style={{
                    padding: '14px 0', borderRadius: 10, fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900,
                    background: isHead ? 'rgba(251,191,36,.35)' : onPath ? 'rgba(74,222,128,.2)' : canMove ? 'rgba(96,165,250,.2)' : 'rgba(255,255,255,.05)',
                    border: `2px solid ${isHead ? '#fbbf24' : onPath ? '#4ade80' : canMove ? '#60a5fa' : 'rgba(255,255,255,.08)'}`,
                    color: isHead ? '#fbbf24' : onPath ? '#4ade80' : canMove ? '#60a5fa' : 'var(--t3)',
                    cursor: canMove ? 'pointer' : 'default',
                    transition: 'all .1s',
                  }}
                >{val}</button>
              )
            }))}
          </div>
          <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--t3)' }}>
            Summa så långt: {path.reduce((s, [r, c]) => s + (grid[r]?.[c] ?? 0), 0)}
          </div>
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
