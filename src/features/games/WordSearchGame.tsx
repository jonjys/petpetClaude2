import { memo, useState, useCallback } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const GRID_SIZE = 8
const WORD_LIST = ['KATT', 'HUND', 'FISK', 'LEJON', 'BJÖRN', 'RÄV', 'ULV', 'ÄLG']

type Cell = { letter: string; selected: boolean; found: boolean }
type Pos = { r: number; c: number }

function buildGrid(words: string[]): { grid: Cell[][]; placements: { word: string; cells: Pos[] }[] } {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ'
  const grid: string[][] = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(''))
  const placements: { word: string; cells: Pos[] }[] = []
  const dirs = [[0, 1], [1, 0], [1, 1], [0, -1], [-1, 0]]

  for (const word of words) {
    let placed = false
    for (let attempt = 0; attempt < 100 && !placed; attempt++) {
      const dir = dirs[Math.floor(Math.random() * dirs.length)]
      const r = Math.floor(Math.random() * GRID_SIZE)
      const c = Math.floor(Math.random() * GRID_SIZE)
      const cells: Pos[] = []
      let ok = true
      for (let k = 0; k < word.length; k++) {
        const nr = r + dir[0] * k, nc = c + dir[1] * k
        if (nr < 0 || nr >= GRID_SIZE || nc < 0 || nc >= GRID_SIZE) { ok = false; break }
        if (grid[nr][nc] && grid[nr][nc] !== word[k]) { ok = false; break }
        cells.push({ r: nr, c: nc })
      }
      if (ok) {
        cells.forEach(({ r: nr, c: nc }, k) => { grid[nr][nc] = word[k] })
        placements.push({ word, cells })
        placed = true
      }
    }
  }

  const cells: Cell[][] = grid.map(row => row.map(l => ({ letter: l || letters[Math.floor(Math.random() * letters.length)], selected: false, found: false })))
  return { grid: cells, placements }
}

export const WordSearchGame = memo(function WordSearchGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [grid, setGrid] = useState<Cell[][]>([])
  const [placements, setPlacements] = useState<{ word: string; cells: Pos[] }[]>([])
  const [found, setFound] = useState<string[]>([])
  const [selecting, setSelecting] = useState<Pos[]>([])
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_ws_best') ?? 0))

  const start = useCallback(() => {
    const { grid: g, placements: p } = buildGrid(WORD_LIST)
    setGrid(g); setPlacements(p); setFound([]); setSelecting([])
    setPhase('playing')
  }, [])

  const toggleCell = useCallback((r: number, c: number) => {
    setSelecting(prev => {
      const exists = prev.findIndex(p => p.r === r && p.c === c)
      if (exists >= 0) return prev.filter((_, i) => i !== exists)
      const next = [...prev, { r, c }]
      // Check if next forms a found word
      for (const pl of placements) {
        const sortedNext = [...next].sort((a, b) => a.r - b.r || a.c - b.c)
        const sortedPl = [...pl.cells].sort((a, b) => a.r - b.r || a.c - b.c)
        if (sortedNext.length === sortedPl.length && sortedNext.every((p, i) => p.r === sortedPl[i].r && p.c === sortedPl[i].c)) {
          if (!found.includes(pl.word)) {
            const newFound = [...found, pl.word]
            setFound(newFound)
            setGrid(prev2 => prev2.map((row, ri) => row.map((cell, ci) => pl.cells.some(p => p.r === ri && p.c === ci) ? { ...cell, found: true, selected: false } : cell)))
            audio.coin()
            if (newFound.length === WORD_LIST.length) {
              const score = newFound.length * 60
              const prev3 = Number(localStorage.getItem('k0509_ws_best') ?? 0)
              if (score > prev3) localStorage.setItem('k0509_ws_best', String(score))
              audio.achievement(); onWin(Math.round(score / 5), score); setPhase('done')
            }
            return []
          }
        }
      }
      return next
    })
  }, [placements, found, onWin])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🔤 Ordsökning</span>
        <span className={styles.scoreDisplay}>{found.length}/{WORD_LIST.length}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🔤</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Ordsökning</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Hitta {WORD_LIST.length} djurnamn i bokstavsgallret!<br />Klicka på bokstäverna för att markera.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}p</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {(phase === 'playing' || phase === 'done') && (
        <div style={{ padding: '0 10px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`, gap: 3 }}>
            {grid.map((row, r) => row.map((cell, c) => {
              const isSel = selecting.some(p => p.r === r && p.c === c)
              return (
                <button key={`${r}-${c}`} onClick={() => toggleCell(r, c)} style={{ height: 34, borderRadius: 6, background: cell.found ? 'rgba(74,222,128,.25)' : isSel ? 'rgba(129,140,248,.35)' : 'rgba(255,255,255,.05)', border: `1px solid ${cell.found ? 'rgba(74,222,128,.4)' : isSel ? 'rgba(129,140,248,.5)' : 'rgba(255,255,255,.08)'}`, color: '#e8e8f0', fontSize: 11, fontWeight: 900, cursor: 'pointer', fontFamily: 'var(--ff-head)' }}>
                  {cell.letter}
                </button>
              )
            }))}
          </div>
          {/* Word list */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {WORD_LIST.map(w => (
              <span key={w} style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, background: found.includes(w) ? 'rgba(74,222,128,.15)' : 'rgba(255,255,255,.05)', border: `1px solid ${found.includes(w) ? 'rgba(74,222,128,.3)' : 'rgba(255,255,255,.08)'}`, color: found.includes(w) ? '#4ade80' : '#888', textDecoration: found.includes(w) ? 'line-through' : 'none', fontWeight: 700 }}>{w}</span>
            ))}
          </div>
          {phase === 'done' && (
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
              <div style={{ fontSize: 36 }}>🎉</div>
              <div style={{ fontWeight: 900, color: '#4ade80' }}>Alla ord hittade!</div>
              <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Spela igen!</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
})
