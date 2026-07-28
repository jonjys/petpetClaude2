import { memo, useState, useCallback } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const GEMS = ['💎', '🔴', '🟡', '🟢', '🔵', '🟣']
const COLS = 6, ROWS = 7
const MATCH_GOAL = 20

type Grid = string[][]

function makeGrid(): Grid {
  return Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => GEMS[Math.floor(Math.random() * GEMS.length)])
  )
}

function findMatches(g: Grid): Set<string> {
  const matched = new Set<string>()
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS - 2; c++) {
      if (g[r][c] === g[r][c+1] && g[r][c] === g[r][c+2]) {
        matched.add(`${r},${c}`); matched.add(`${r},${c+1}`); matched.add(`${r},${c+2}`)
      }
    }
  }
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS - 2; r++) {
      if (g[r][c] === g[r+1][c] && g[r][c] === g[r+2][c]) {
        matched.add(`${r},${c}`); matched.add(`${r+1},${c}`); matched.add(`${r+2},${c}`)
      }
    }
  }
  return matched
}

function collapse(g: Grid): Grid {
  const ng = g.map(row => [...row])
  for (let c = 0; c < COLS; c++) {
    const col = ng.map(row => row[c]).filter(Boolean)
    while (col.length < ROWS) col.unshift(GEMS[Math.floor(Math.random() * GEMS.length)])
    for (let r = 0; r < ROWS; r++) ng[r][c] = col[r]
  }
  return ng
}

export const GemSwapGame = memo(function GemSwapGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [grid, setGrid] = useState<Grid>([])
  const [selected, setSelected] = useState<[number, number] | null>(null)
  const [matches, setMatches] = useState(0)
  const [moves, setMoves] = useState(0)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_gems_best') ?? 0))

  const start = useCallback(() => {
    let g = makeGrid()
    let m = findMatches(g)
    while (m.size > 0) { g = makeGrid(); m = findMatches(g) }
    setGrid(g); setSelected(null); setMatches(0); setMoves(0); setPhase('playing')
  }, [])

  const handleCell = useCallback((r: number, c: number) => {
    if (!selected) { setSelected([r, c]); audio.tap(); return }
    const [sr, sc] = selected
    const adjacent = (Math.abs(r - sr) + Math.abs(c - sc)) === 1
    if (!adjacent) { setSelected([r, c]); return }

    setSelected(null)
    const ng = grid.map(row => [...row])
    ;[ng[r][c], ng[sr][sc]] = [ng[sr][sc], ng[r][c]]
    const m = findMatches(ng)
    if (m.size === 0) { audio.click(); return }

    let totalNew = 0
    let cur = ng
    while (true) {
      const hits = findMatches(cur)
      if (hits.size === 0) break
      totalNew += hits.size
      for (const key of hits) {
        const [kr, kc] = key.split(',').map(Number)
        cur[kr][kc] = ''
      }
      cur = collapse(cur)
    }

    const newMatches = matches + totalNew
    const newMoves = moves + 1
    setGrid(cur); setMatches(newMatches); setMoves(newMoves)
    audio.coin()

    if (newMatches >= MATCH_GOAL) {
      const score = newMatches * 20
      const prev = Number(localStorage.getItem('k0509_gems_best') ?? 0)
      if (score > prev) localStorage.setItem('k0509_gems_best', String(score))
      audio.achievement(); onWin(Math.round(score / 5), score); setPhase('done')
    }
  }, [selected, grid, matches, moves, onWin])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>💎 Ädelstenar</span>
        <span className={styles.scoreDisplay}>{matches}/{MATCH_GOAL} matchningar</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>💎</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Ädelstenar</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Byt platser på ädelstenar för att göra rad om 3+!<br />Nå {MATCH_GOAL} matchningar för att vinna.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}p</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {(phase === 'playing' || phase === 'done') && (
        <div style={{ padding: '0 10px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ height: 4, background: 'rgba(255,255,255,.08)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(matches / MATCH_GOAL) * 100}%`, background: '#818cf8', transition: 'width .3s' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${COLS}, 1fr)`, gap: 3 }}>
            {grid.map((row, r) => row.map((gem, c) => {
              const isSel = selected?.[0] === r && selected?.[1] === c
              return (
                <button key={`${r}-${c}`} onClick={() => phase === 'playing' && handleCell(r, c)} style={{ height: 40, borderRadius: 8, background: isSel ? 'rgba(251,191,36,.3)' : 'rgba(255,255,255,.05)', border: `2px solid ${isSel ? '#fbbf24' : 'rgba(255,255,255,.08)'}`, fontSize: 20, cursor: 'pointer', transition: 'all .1s' }}>
                  {gem}
                </button>
              )
            }))}
          </div>
          {phase === 'done' && (
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', paddingTop: 8 }}>
              <div style={{ fontSize: 32 }}>🎉</div>
              <div style={{ fontWeight: 900, color: '#4ade80' }}>Klart på {moves} drag!</div>
              <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Spela igen!</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
})
