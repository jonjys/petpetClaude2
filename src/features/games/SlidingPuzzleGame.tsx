import { memo, useState, useCallback } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const SIZE = 3
const GOAL = [1,2,3,4,5,6,7,8,0]

function isSolved(tiles: number[]): boolean {
  return tiles.every((t, i) => t === GOAL[i])
}

function shuffle(arr: number[]): number[] {
  let a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  // Ensure solvability by counting inversions
  const inv = a.filter(x => x !== 0).reduce((acc, v, i, arr) => {
    for (let j = i + 1; j < arr.length; j++) if (arr[j] < v) acc++
    return acc
  }, 0)
  const zeroRow = Math.floor(a.indexOf(0) / SIZE)
  const solvable = SIZE % 2 === 1 ? inv % 2 === 0 : (inv + zeroRow) % 2 === 1
  if (!solvable) {
    const idx1 = a[0] !== 0 && a[1] !== 0 ? 0 : 1
    const idx2 = idx1 + 1;
    [a[idx1], a[idx2]] = [a[idx2], a[idx1]]
  }
  return a
}

const EMOJIS = ['🐱','🐶','🦊','🐸','🐯','🐻','🦁','🐼']

export const SlidingPuzzleGame = memo(function SlidingPuzzleGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [tiles, setTiles] = useState<number[]>(GOAL)
  const [moves, setMoves] = useState(0)
  const [startTime, setStartTime] = useState(0)
  const [elapsedSec, setElapsedSec] = useState(0)
  const [bestMoves] = useState(() => Number(localStorage.getItem('k0509_slide_best') ?? 0))
  const timerRef = { current: 0 as unknown as ReturnType<typeof setInterval> }
  const emojiSet = EMOJIS.slice(0, SIZE * SIZE - 1)

  const start = useCallback(() => {
    const t = shuffle([...GOAL])
    setTiles(t); setMoves(0); setElapsedSec(0)
    setStartTime(Date.now())
    setPhase('playing')
  }, [])

  const handleTile = useCallback((idx: number) => {
    setTiles(prev => {
      const zeroIdx = prev.indexOf(0)
      const row = Math.floor(idx / SIZE), col = idx % SIZE
      const zRow = Math.floor(zeroIdx / SIZE), zCol = zeroIdx % SIZE
      const adjacent = (Math.abs(row - zRow) + Math.abs(col - zCol)) === 1
      if (!adjacent) return prev
      const next = [...prev];
      [next[idx], next[zeroIdx]] = [next[zeroIdx], next[idx]]
      audio.click()
      setMoves(m => m + 1)
      if (isSolved(next)) {
        const elapsed = Math.round((Date.now() - Date.now()) / 1000)
        const prev2 = Number(localStorage.getItem('k0509_slide_best') ?? 0)
        const newMoves = prev.filter((_, i) => i !== 0).length
        void elapsed; void newMoves; void prev2
        setTimeout(() => {
          const m2 = moves + 1
          const coins = Math.max(10, 100 - m2)
          const xp = Math.max(20, 200 - m2 * 2)
          const prevBest = Number(localStorage.getItem('k0509_slide_best') ?? 0)
          if (prevBest === 0 || m2 < prevBest) localStorage.setItem('k0509_slide_best', String(m2))
          onWin(coins, xp)
          audio.achievement()
          setPhase('done')
          setElapsedSec(Math.round((Date.now() - startTime) / 1000))
        }, 200)
      }
      return next
    })
  }, [moves, startTime, onWin])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🧩 Glidpussel</span>
        <span className={styles.scoreDisplay}>{moves} drag</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🧩</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Glidpussel</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Ordna emojis i rätt ordning!<br />3×3 rutnät · Så få drag som möjligt
          </div>
          {bestMoves > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestMoves} drag</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 12, color: 'var(--t3)' }}>Ordna 1-8 i rätt ordning (tomt längst ner till höger)</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 80px)', gap: 6 }}>
            {tiles.map((tile, idx) => (
              <button
                key={idx}
                onClick={() => tile !== 0 && handleTile(idx)}
                style={{
                  width: 80, height: 80, borderRadius: 12, fontSize: tile === 0 ? 10 : 28,
                  fontWeight: 900, cursor: tile === 0 ? 'default' : 'pointer',
                  background: tile === 0 ? 'rgba(255,255,255,.03)' : 'rgba(99,102,241,.15)',
                  border: `2px solid ${tile === 0 ? 'rgba(255,255,255,.05)' : 'rgba(99,102,241,.3)'}`,
                  color: '#e8e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all .1s',
                }}
              >
                {tile !== 0 ? emojiSet[tile - 1] : ''}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 12, color: 'var(--t3)' }}>Mål: {emojiSet.join(' ')}</div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>🏆</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>Löst! 🎉</div>
          <div style={{ fontSize: 14, color: '#4ade80' }}>{moves} drag · {elapsedSec}s</div>
          {bestMoves > 0 && moves <= bestMoves && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{Math.max(10, 100 - moves)}🪙 +{Math.max(20, 200 - moves * 2)} XP</div>
          <button className="btn-primary" style={{ padding: '12px 28px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
