import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const GAME_DURATION = 45
const GRID_W = 6
const GRID_H = 7

const POOL = ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐸','🐙','🦋','🐝','🦄','🐬','🦉','🐧','🦀']

function makeGrid(target: string) {
  const size = GRID_W * GRID_H
  const decoys = POOL.filter(e => e !== target)
  const cells: string[] = Array.from({ length: size }, () => decoys[Math.floor(Math.random() * decoys.length)])
  const targetCount = 3 + Math.floor(Math.random() * 4)
  const positions = new Set<number>()
  while (positions.size < targetCount) positions.add(Math.floor(Math.random() * size))
  positions.forEach(p => { cells[p] = target })
  return { cells, positions: [...positions] }
}

export const EmojiHuntGame = memo(function EmojiHuntGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [target, setTarget] = useState(POOL[0])
  const [cells, setCells] = useState<string[]>([])
  const [found, setFound] = useState<Set<number>>(new Set())
  const [remaining, setRemaining] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION)
  const [score, setScore] = useState(0)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_eh_best') ?? 0))
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const scoreRef = useRef(0)
  const foundRef = useRef<Set<number>>(new Set())
  const remainingRef = useRef(0)
  const cellsRef = useRef<string[]>([])
  const targetRef = useRef(POOL[0])

  const loadRound = useCallback(() => {
    const t = POOL[Math.floor(Math.random() * POOL.length)]
    const { cells: c, positions } = makeGrid(t)
    targetRef.current = t
    cellsRef.current = c
    foundRef.current = new Set()
    remainingRef.current = positions.length
    setTarget(t)
    setCells([...c])
    setFound(new Set())
    setRemaining(positions.length)
  }, [])

  const start = useCallback(() => {
    scoreRef.current = 0; setScore(0); setTimeLeft(GAME_DURATION)
    loadRound(); setPhase('playing')
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!)
          const s = scoreRef.current
          const prev = Number(localStorage.getItem('k0509_eh_best') ?? 0)
          if (s > prev) localStorage.setItem('k0509_eh_best', String(s))
          if (s > 0) onWin(Math.round(s * 8), s * 25)
          setPhase('done')
          return 0
        }
        return t - 1
      })
    }, 1000)
  }, [loadRound, onWin])

  const tap = useCallback((idx: number) => {
    if (phase !== 'playing') return
    if (foundRef.current.has(idx)) return
    if (cellsRef.current[idx] !== targetRef.current) { audio.tap(); return }
    audio.coin()
    foundRef.current = new Set([...foundRef.current, idx])
    setFound(new Set(foundRef.current))
    remainingRef.current--
    setRemaining(remainingRef.current)
    if (remainingRef.current === 0) {
      scoreRef.current++; setScore(scoreRef.current)
      loadRound()
    }
  }, [phase, loadRound])

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  const timerPct = (timeLeft / GAME_DURATION) * 100

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🔍 Emojijägaren</span>
        <span className={styles.scoreDisplay}>{score}p · {timeLeft}s</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🔍</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Emojijägaren</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Hitta alla dolda målemojis i rutnätet! Ny runda för varje set. 45 sekunder.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}p</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,.08)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${timerPct}%`, background: timerPct <= 30 ? '#f87171' : '#60a5fa', transition: 'width 1s linear' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0' }}>
            <div style={{ fontSize: 12, color: 'var(--t3)' }}>Hitta alla</div>
            <div style={{ fontSize: 32 }}>{target}</div>
            <div style={{ fontSize: 12, color: '#60a5fa', fontWeight: 700 }}>kvar: {remaining}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${GRID_W}, 1fr)`, gap: 4 }}>
            {cells.map((emoji, i) => (
              <button key={i} onClick={() => tap(i)} style={{
                aspectRatio: '1', borderRadius: 8, fontSize: 22,
                background: found.has(i) ? 'rgba(74,222,128,.3)' : 'rgba(255,255,255,.06)',
                border: `1px solid ${found.has(i) ? '#4ade80' : 'rgba(255,255,255,.08)'}`,
                cursor: 'pointer', transition: 'all .1s',
                opacity: found.has(i) ? 0.4 : 1,
              }}>{emoji}</button>
            ))}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <div style={{ fontWeight: 900, color: '#60a5fa', fontSize: 20 }}>🔍 {score} set!</div>
          <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
