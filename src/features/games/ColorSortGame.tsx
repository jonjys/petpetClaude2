import { memo, useState, useCallback } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const COLORS = ['#f87171','#fb923c','#fbbf24','#4ade80','#60a5fa','#c084fc']
const TUBE_H = 4

type Tube = (string | null)[]

function makeLevel(): Tube[] {
  const colors = COLORS.slice(0, 4)
  const all: string[] = []
  colors.forEach(c => { for (let i = 0; i < TUBE_H; i++) all.push(c) })
  const shuffled = [...all].sort(() => Math.random() - 0.5)
  const tubes: Tube[] = []
  for (let i = 0; i < 4; i++) tubes.push(shuffled.slice(i * TUBE_H, (i + 1) * TUBE_H))
  tubes.push([null, null, null, null])
  tubes.push([null, null, null, null])
  return tubes
}

function isSolved(tubes: Tube[]): boolean {
  return tubes.every(t => {
    const nonNull = t.filter(x => x !== null)
    if (nonNull.length === 0) return true
    if (nonNull.length !== TUBE_H) return false
    return nonNull.every(x => x === nonNull[0])
  })
}

function topColor(tube: Tube): string | null {
  for (let i = 0; i < tube.length; i++) if (tube[i] !== null) return tube[i]
  return null
}

function topCount(tube: Tube): number {
  const c = topColor(tube); if (!c) return 0
  let cnt = 0
  for (const x of tube) { if (x === c) cnt++; else if (x !== null) break }
  return cnt
}

function canPour(from: Tube, to: Tube): boolean {
  const fc = topColor(from); if (!fc) return false
  const tc = topColor(to)
  if (tc !== null && tc !== fc) return false
  const emptySlots = to.filter(x => x === null).length
  return emptySlots > 0
}

function pour(tubes: Tube[], fromIdx: number, toIdx: number): Tube[] {
  const newTubes = tubes.map(t => [...t]) as Tube[]
  const from = newTubes[fromIdx], to = newTubes[toIdx]
  const fc = topColor(from)!
  const cnt = topCount(from)
  const emptySlots = to.filter(x => x === null).length
  const move = Math.min(cnt, emptySlots)
  let moved = 0
  for (let i = 0; i < from.length && moved < move; i++) {
    if (from[i] === fc) { from[i] = null; moved++ }
  }
  let placed = 0
  for (let i = to.length - 1; i >= 0 && placed < move; i--) {
    if (to[i] === null) { to[i] = fc; placed++ }
  }
  return newTubes
}

export const ColorSortGame = memo(function ColorSortGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [tubes, setTubes] = useState<Tube[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [moves, setMoves] = useState(0)
  const [bestMoves] = useState(() => Number(localStorage.getItem('k0509_csort_best') ?? 0))

  const start = useCallback(() => {
    setTubes(makeLevel()); setSelected(null); setMoves(0)
    setPhase('playing')
  }, [])

  const handleTube = useCallback((idx: number) => {
    if (selected === null) {
      if (topColor(tubes[idx]) !== null) { setSelected(idx); audio.click() }
      return
    }
    if (selected === idx) { setSelected(null); return }
    if (!canPour(tubes[selected], tubes[idx])) { setSelected(idx); return }
    const next = pour(tubes, selected, idx)
    setTubes(next); setMoves(m => m + 1); setSelected(null); audio.coin()
    if (isSolved(next)) {
      const m = moves + 1
      const prev = Number(localStorage.getItem('k0509_csort_best') ?? 0)
      if (prev === 0 || m < prev) localStorage.setItem('k0509_csort_best', String(m))
      const coins = Math.max(20, 200 - m * 3)
      const xp = Math.max(30, 300 - m * 4)
      onWin(coins, xp); audio.achievement()
      setPhase('done')
    }
  }, [selected, tubes, moves, onWin])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🎨 Färgsortering</span>
        <span className={styles.scoreDisplay}>{moves} drag</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🎨</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Färgsortering</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Sortera färgerna i rören!<br />Tryck ett rör för att välja, sedan ett annat för att hälla
          </div>
          {bestMoves > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestMoves} drag</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 12, color: 'var(--t3)' }}>Sortera alla färger — en färg per rör</div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            {tubes.map((tube, idx) => (
              <button
                key={idx}
                onClick={() => handleTube(idx)}
                style={{
                  width: 44, padding: '0 0 6px', borderRadius: 10, border: `2px solid ${selected === idx ? '#818cf8' : 'rgba(255,255,255,.15)'}`,
                  background: selected === idx ? 'rgba(129,140,248,.1)' : 'rgba(255,255,255,.04)',
                  cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                  transition: 'all .1s', transform: selected === idx ? 'translateY(-4px)' : 'none',
                }}
              >
                {tube.map((c, i) => (
                  <div key={i} style={{ width: 32, height: 32, borderRadius: 6, background: c ?? 'rgba(255,255,255,.05)', border: `1px solid ${c ? c + '60' : 'rgba(255,255,255,.08)'}`, marginTop: i === 0 ? 6 : 0 }} />
                ))}
              </button>
            ))}
          </div>
          {selected !== null && <div style={{ fontSize: 12, color: '#818cf8' }}>Valt rör {selected + 1} — välj destination</div>}
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>🎨</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>Sorterat! 🎉</div>
          <div style={{ fontSize: 14, color: '#4ade80' }}>{moves} drag</div>
          {bestMoves > 0 && moves <= bestMoves && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{Math.max(20, 200 - moves * 3)}🪙 +{Math.max(30, 300 - moves * 4)} XP</div>
          <button className="btn-primary" style={{ padding: '12px 28px' }} onClick={start}>Ny omgång!</button>
        </div>
      )}
    </div>
  )
})
