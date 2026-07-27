import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const EMOJIS = ['🐱', '🐶', '🦊', '🐻', '🦁', '🐯', '🐸', '🦋']

interface Card { id: number; emoji: string; flipped: boolean; matched: boolean }

function makeCards(): Card[] {
  const emojis = [...EMOJIS, ...EMOJIS]
  for (let i = emojis.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [emojis[i], emojis[j]] = [emojis[j], emojis[i]]
  }
  return emojis.map((emoji, id) => ({ id, emoji, flipped: false, matched: false }))
}

export const MemoryGame = memo(function MemoryGame({ onExit, onWin }: Props) {
  const [cards, setCards] = useState<Card[]>(makeCards)
  const [selected, setSelected] = useState<number[]>([])
  const [moves, setMoves] = useState(0)
  const [locked, setLocked] = useState(false)
  const [done, setDone] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [newRecord, setNewRecord] = useState(false)
  const [bestMoves] = useState(() => Number(localStorage.getItem('k0509_memory_best') ?? 0))
  const startTimeRef = useRef<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const matches = cards.filter(c => c.matched).length / 2

  useEffect(() => {
    if (matches === EMOJIS.length && !done) {
      setDone(true)
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
      const coins = Math.max(10, 30 - moves)
      const xp = Math.max(20, 60 - moves * 2)
      const prevBest = Number(localStorage.getItem('k0509_memory_best') ?? 0)
      if (prevBest === 0 || moves < prevBest) {
        setNewRecord(true)
        localStorage.setItem('k0509_memory_best', String(moves))
      }
      onWin(coins, xp)
    }
  }, [matches, done, moves, onWin])

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  const flip = useCallback((id: number) => {
    if (locked || done) return
    const card = cards[id]
    if (card.flipped || card.matched) return

    if (startTimeRef.current === null) {
      startTimeRef.current = Date.now()
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTimeRef.current!) / 1000))
      }, 1000)
    }

    const newSel = [...selected, id]
    setCards(prev => prev.map(c => c.id === id ? { ...c, flipped: true } : c))

    if (newSel.length === 2) {
      setMoves(m => m + 1)
      setLocked(true)
      const [a, b] = newSel
      if (cards[a].emoji === card.emoji) {
        setCards(prev => prev.map(c => (c.id === a || c.id === b) ? { ...c, matched: true } : c))
        setSelected([])
        setLocked(false)
      } else {
        setTimeout(() => {
          setCards(prev => prev.map(c => (c.id === a || c.id === b) ? { ...c, flipped: false } : c))
          setSelected([])
          setLocked(false)
        }, 900)
      }
    } else {
      setSelected(newSel)
    }
  }, [cards, selected, locked, done])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🃏 Minne</span>
        <span className={styles.scoreDisplay}>
          {elapsed > 0 ? `${elapsed}s · ` : ''}{matches}/{EMOJIS.length} par
        </span>
      </div>

      {done && (
        <div style={{ textAlign: 'center', padding: '8px' }}>
          <div style={{ color: '#4ade80', fontWeight: 700 }}>
            Klart på {moves} drag & {elapsed}s!
            {newRecord && <span style={{ color: '#fbbf24', marginLeft: 8 }}>🏆 REKORD!</span>}
          </div>
          {bestMoves > 0 && !newRecord && (
            <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>Rekord: {bestMoves} drag</div>
          )}
          <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>Belöning tillagd 🪙</div>
        </div>
      )}

      {!done && bestMoves > 0 && (
        <div style={{ textAlign: 'center', fontSize: 10, color: '#fbbf24' }}>🏆 Rekord: {bestMoves} drag</div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, padding: '0 16px' }}>
        {cards.map(card => (
          <button
            key={card.id}
            onClick={() => flip(card.id)}
            style={{
              aspectRatio: '1',
              borderRadius: 12,
              border: `2px solid ${card.matched ? '#4ade80' : card.flipped ? '#a855f7' : 'rgba(255,255,255,0.1)'}`,
              background: card.flipped || card.matched ? 'rgba(168,85,247,0.15)' : 'rgba(255,255,255,0.05)',
              fontSize: 28,
              cursor: card.flipped || card.matched ? 'default' : 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {card.flipped || card.matched ? card.emoji : '❓'}
          </button>
        ))}
      </div>

      <div style={{ textAlign: 'center', fontSize: 13, color: '#888', paddingBottom: 8 }}>
        Drag: {moves}
      </div>
    </div>
  )
})
