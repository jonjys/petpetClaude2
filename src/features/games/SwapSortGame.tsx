import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const PUZZLES = 3
const COUNT = 7

function shuffle(n: number): number[] {
  const arr = Array.from({ length: n }, (_, i) => i + 1)
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function isSorted(arr: number[]): boolean {
  return arr.every((v, i) => i === 0 || v >= arr[i - 1])
}

export const SwapSortGame = memo(function SwapSortGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [nums, setNums] = useState<number[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [puzzle, setPuzzle] = useState(1)
  const [moves, setMoves] = useState(0)
  const [score, setScore] = useState(0)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_swap_best') ?? 0))
  const [flash, setFlash] = useState<[number, number] | null>(null)
  const scoreRef = useRef(0)
  const movesRef = useRef(0)

  const loadPuzzle = useCallback((p: number) => {
    setNums(shuffle(COUNT)); setSelected(null); setMoves(0); movesRef.current = 0; setPuzzle(p); setFlash(null)
  }, [])

  const start = useCallback(() => {
    scoreRef.current = 0; setScore(0)
    loadPuzzle(1); setPhase('playing')
  }, [loadPuzzle])

  const tap = useCallback((idx: number) => {
    if (phase !== 'playing') return
    if (selected === null) {
      setSelected(idx)
    } else if (selected === idx) {
      setSelected(null)
    } else {
      const a = selected, b = idx
      setFlash([a, b])
      setTimeout(() => setFlash(null), 250)
      setNums(prev => {
        const n = [...prev];
        [n[a], n[b]] = [n[b], n[a]]
        const nm = movesRef.current + 1; movesRef.current = nm; setMoves(nm)
        if (isSorted(n)) {
          audio.coin()
          const pts = Math.max(50, 200 - nm * 15)
          scoreRef.current += pts; setScore(s => s + pts)
          if (puzzle >= PUZZLES) {
            const s = scoreRef.current
            const prev = Number(localStorage.getItem('k0509_swap_best') ?? 0)
            if (s > prev) localStorage.setItem('k0509_swap_best', String(s))
            if (s > 0) onWin(Math.round(s / 7), s)
            setTimeout(() => setPhase('done'), 500)
          } else {
            setTimeout(() => loadPuzzle(puzzle + 1), 600)
          }
        }
        return n
      })
      setSelected(null)
    }
  }, [phase, selected, puzzle, onWin, loadPuzzle])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🔀 Byt & Sortera</span>
        <span className={styles.scoreDisplay}>{score}p · {puzzle}/{PUZZLES}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🔀</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Byt & Sortera</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Tryck två siffror för att byta plats. Sortera raden i stigande ordning! Färre byten = mer poäng. 3 pussel.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}p</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && nums.length > 0 && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 12, color: 'var(--t3)', textAlign: 'center' }}>Byten: {moves} · Tryck två siffror att byta</div>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
            {nums.map((n, i) => {
              const isSelected = selected === i
              const isFlashing = flash && (flash[0] === i || flash[1] === i)
              return (
                <button key={i} onClick={() => tap(i)} style={{
                  width: 42, height: 54, borderRadius: 12, fontSize: 20, fontWeight: 900,
                  background: isFlashing ? 'rgba(251,191,36,.3)' : isSelected ? 'rgba(96,165,250,.25)' : 'rgba(255,255,255,.07)',
                  border: `2.5px solid ${isFlashing ? '#fbbf24' : isSelected ? '#60a5fa' : 'rgba(255,255,255,.15)'}`,
                  color: isSelected ? '#60a5fa' : '#fff',
                  cursor: 'pointer', transition: 'all .1s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{n}</button>
              )
            })}
          </div>
          <div style={{ display: 'flex', gap: 3, justifyContent: 'center' }}>
            {Array.from({ length: COUNT }, (_, i) => i + 1).map(n => (
              <div key={n} style={{ width: 42, height: 4, borderRadius: 2, background: nums[n - 1] === n ? '#4ade80' : 'rgba(255,255,255,.1)' }} />
            ))}
          </div>
          <div style={{ fontSize: 11, color: 'var(--t3)', textAlign: 'center' }}>Grön = rätt plats</div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <div style={{ fontWeight: 900, color: '#4ade80', fontSize: 20 }}>🔀 {score}p!</div>
          <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
