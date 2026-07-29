import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const EMOJIS = ['🍎', '🍊', '🍋', '🍇', '🍓', '🫐', '🍑', '🥝', '🍒', '🍈']
const COLS = 6
const ROWS = 8
const GAME_TIME = 60

type Tile = { id: number; emoji: string; matched: boolean }

function makeBoard(): Tile[][] {
  const emojis: string[] = []
  const total = COLS * ROWS
  for (let i = 0; i < total / 2; i++) emojis.push(EMOJIS[i % EMOJIS.length])
  const doubled = [...emojis, ...emojis].sort(() => Math.random() - 0.5)
  let id = 0
  return Array.from({ length: ROWS }, (_, r) =>
    Array.from({ length: COLS }, (_, c) => ({ id: id++, emoji: doubled[r * COLS + c], matched: false }))
  )
}

export const TileMatchGame = memo(function TileMatchGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [board, setBoard] = useState<Tile[][]>([])
  const [selected, setSelected] = useState<[number, number][]>([])
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_TIME)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_tm_best') ?? 0))
  const [locked, setLocked] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const scoreRef = useRef(0)

  const start = useCallback(() => {
    scoreRef.current = 0; setScore(0); setTimeLeft(GAME_TIME)
    setBoard(makeBoard()); setSelected([]); setLocked(false)
    setPhase('playing')
  }, [])

  useEffect(() => {
    if (phase !== 'playing') return
    timerRef.current = setInterval(() => setTimeLeft(t => {
      if (t <= 1) {
        if (timerRef.current) clearInterval(timerRef.current)
        const s = scoreRef.current
        const prev = Number(localStorage.getItem('k0509_tm_best') ?? 0)
        if (s > prev) localStorage.setItem('k0509_tm_best', String(s))
        if (s > 0) onWin(Math.round(s / 7), s)
        setPhase('done')
        return 0
      }
      return t - 1
    }), 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase, onWin])

  const tap = useCallback((r: number, c: number) => {
    if (locked || board[r][c].matched) return
    const alreadySel = selected.some(([sr, sc]) => sr === r && sc === c)
    if (alreadySel) return
    const next = [...selected, [r, c] as [number, number]]
    setSelected(next)
    audio.tap()
    if (next.length === 2) {
      setLocked(true)
      const [[r1, c1], [r2, c2]] = next
      if (board[r1][c1].emoji === board[r2][c2].emoji) {
        const pts = 30
        scoreRef.current += pts; setScore(s => s + pts)
        audio.coin()
        setBoard(prev => prev.map((row, ri) => row.map((tile, ci) =>
          (ri === r1 && ci === c1) || (ri === r2 && ci === c2) ? { ...tile, matched: true } : tile
        )))
        setSelected([]); setLocked(false)
        if (board.flat().filter(t => !t.matched).length <= 2) {
          if (timerRef.current) clearInterval(timerRef.current)
          const s = scoreRef.current + 100
          scoreRef.current = s; setScore(s)
          const prev = Number(localStorage.getItem('k0509_tm_best') ?? 0)
          if (s > prev) localStorage.setItem('k0509_tm_best', String(s))
          onWin(Math.round(s / 7), s)
          setPhase('done')
        }
      } else {
        setTimeout(() => { setSelected([]); setLocked(false) }, 700)
      }
    }
  }, [locked, board, selected, onWin])

  const matchedCount = board.flat().filter(t => t.matched).length
  const timerPct = (timeLeft / GAME_TIME) * 100

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🍎 Frukttrio</span>
        <span className={styles.scoreDisplay}>{score}p · {timeLeft}s</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🍎</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Frukttrio</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Tryck 2 matchande frukter för att ta bort dem! Rensa brädet på 60 sekunder. Varje par = +30p.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}p</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && board.length > 0 && (
        <div style={{ padding: '0 10px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,.08)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${timerPct}%`, background: timerPct <= 25 ? '#f87171' : '#60a5fa', transition: 'width 1s linear' }} />
          </div>
          <div style={{ fontSize: 10, color: 'var(--t3)', textAlign: 'center' }}>{matchedCount}/{COLS * ROWS} rensade</div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${COLS}, 1fr)`, gap: 3 }}>
            {board.map((row, r) => row.map((tile, c) => {
              const isSel = selected.some(([sr, sc]) => sr === r && sc === c)
              return (
                <button
                  key={tile.id}
                  onClick={() => tap(r, c)}
                  disabled={tile.matched}
                  style={{
                    height: 44, borderRadius: 8, fontSize: tile.matched ? 0 : 22,
                    background: tile.matched ? 'rgba(255,255,255,.02)' : isSel ? 'rgba(96,165,250,.25)' : 'rgba(255,255,255,.07)',
                    border: `2px solid ${tile.matched ? 'transparent' : isSel ? 'rgba(96,165,250,.5)' : 'rgba(255,255,255,.1)'}`,
                    cursor: tile.matched ? 'default' : 'pointer',
                    transition: 'all .15s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {tile.matched ? '' : tile.emoji}
                </button>
              )
            }))}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <div style={{ fontWeight: 900, color: '#4ade80', fontSize: 20 }}>🍎 {score}p!</div>
          <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
