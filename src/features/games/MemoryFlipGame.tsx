import { memo, useState, useCallback, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const EMOJI_SET = ['🐶', '🐱', '🐸', '🦁', '🐼', '🦊', '🐨', '🦋', '🐙', '🦄', '🐯', '🦉']
const GRID_SIZE = 16

function makeDeck(): string[] {
  const emojis = EMOJI_SET.slice(0, GRID_SIZE / 2)
  return [...emojis, ...emojis].sort(() => Math.random() - 0.5)
}

export const MemoryFlipGame = memo(function MemoryFlipGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [deck, setDeck] = useState<string[]>([])
  const [flipped, setFlipped] = useState<number[]>([])
  const [matched, setMatched] = useState<number[]>([])
  const [moves, setMoves] = useState(0)
  const [score, setScore] = useState(0)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_mf_best') ?? 0))
  const [locked, setLocked] = useState(false)
  const startTime = useRef(0)

  const start = useCallback(() => {
    setDeck(makeDeck()); setFlipped([]); setMatched([]); setMoves(0); setScore(0); setLocked(false)
    startTime.current = Date.now()
    setPhase('playing')
  }, [])

  const flip = useCallback((i: number) => {
    if (locked || flipped.includes(i) || matched.includes(i) || flipped.length >= 2) return
    const next = [...flipped, i]
    setFlipped(next)
    audio.tap()
    if (next.length === 2) {
      setMoves(m => m + 1)
      setLocked(true)
      setTimeout(() => {
        if (deck[next[0]] === deck[next[1]]) {
          const nm = [...matched, next[0], next[1]]
          setMatched(nm)
          audio.coin()
          if (nm.length === GRID_SIZE) {
            const elapsed = Math.floor((Date.now() - startTime.current) / 1000)
            const pts = Math.max(100, 2000 - (moves + 1) * 40 - elapsed * 5)
            setScore(pts)
            const prev = Number(localStorage.getItem('k0509_mf_best') ?? 0)
            if (pts > prev) localStorage.setItem('k0509_mf_best', String(pts))
            onWin(Math.round(pts / 7), pts)
            setPhase('done')
          }
        }
        setFlipped([])
        setLocked(false)
      }, 800)
    }
  }, [locked, flipped, matched, deck, moves, onWin])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🔀 Flip & Match</span>
        <span className={styles.scoreDisplay}>{moves} drag · {matched.length / 2}/{GRID_SIZE / 2}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🔀</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Flip & Match</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Vänd kort och hitta alla 8 par! Färre drag = mer poäng. 4×4 bräde med djur-emojis.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}p</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && (
        <div style={{ padding: '0 12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {deck.map((emoji, i) => {
              const isFlipped = flipped.includes(i)
              const isMatched = matched.includes(i)
              const show = isFlipped || isMatched
              return (
                <button
                  key={i}
                  onClick={() => flip(i)}
                  style={{
                    height: 64,
                    borderRadius: 12,
                    background: isMatched
                      ? 'rgba(74,222,128,.15)'
                      : isFlipped
                        ? 'rgba(96,165,250,.15)'
                        : 'rgba(255,255,255,.07)',
                    border: `2px solid ${isMatched ? 'rgba(74,222,128,.4)' : isFlipped ? 'rgba(96,165,250,.4)' : 'rgba(255,255,255,.12)'}`,
                    fontSize: show ? 28 : 0,
                    cursor: show ? 'default' : 'pointer',
                    transition: 'all .2s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {show ? emoji : '?'}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <div style={{ fontWeight: 900, color: '#4ade80', fontSize: 20 }}>🔀 {score}p!</div>
          <div style={{ fontSize: 12, color: 'var(--t3)' }}>{moves} drag totalt</div>
          <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
