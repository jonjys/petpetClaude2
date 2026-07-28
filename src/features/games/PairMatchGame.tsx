import { memo, useState, useCallback, useEffect } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const EMOJI_SETS = [
  ['🐱','🐶','🦊','🐸','🐯','🐻','🦁','🐼'],
  ['🍎','🍊','🍋','🍇','🍓','🍉','🍑','🥝'],
  ['⚽','🏀','🎾','🏈','🏐','🎱','🏉','🥊'],
  ['🚗','✈️','🚀','🚢','🏍️','🚂','🚁','🛸'],
]

type Card = { id: number; emoji: string; flipped: boolean; matched: boolean }

function makeCards(): Card[] {
  const set = EMOJI_SETS[Math.floor(Math.random() * EMOJI_SETS.length)]
  const pairs = [...set, ...set]
  const shuffled = pairs.sort(() => Math.random() - 0.5)
  return shuffled.map((emoji, id) => ({ id, emoji, flipped: false, matched: false }))
}

export const PairMatchGame = memo(function PairMatchGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [cards, setCards] = useState<Card[]>([])
  const [flipped, setFlipped] = useState<number[]>([])
  const [moves, setMoves] = useState(0)
  const [matches, setMatches] = useState(0)
  const [locked, setLocked] = useState(false)
  const [startTime, setStartTime] = useState(0)
  const [elapsedSec, setElapsedSec] = useState(0)
  const [bestMoves] = useState(() => Number(localStorage.getItem('k0509_pair_best') ?? 0))

  const start = useCallback(() => {
    setCards(makeCards()); setFlipped([]); setMoves(0); setMatches(0); setLocked(false)
    setStartTime(Date.now())
    setPhase('playing')
  }, [])

  const handleCard = useCallback((id: number) => {
    if (locked) return
    setCards(prev => {
      const card = prev[id]
      if (card.flipped || card.matched) return prev
      const newCards = prev.map((c, i) => i === id ? { ...c, flipped: true } : c)
      const newFlipped = [...flipped, id]
      if (newFlipped.length === 2) {
        setMoves(m => m + 1)
        setLocked(true)
        const [a, b] = newFlipped
        if (newCards[a].emoji === newCards[b].emoji) {
          const matched = newCards.map((c, i) => (i === a || i === b) ? { ...c, matched: true } : c)
          audio.coin()
          const newMatches = matches + 1
          setMatches(newMatches)
          setFlipped([])
          setLocked(false)
          if (newMatches === 8) {
            const m = moves + 1
            const elapsed = Math.round((Date.now() - startTime) / 1000)
            setElapsedSec(elapsed)
            const prev2 = Number(localStorage.getItem('k0509_pair_best') ?? 0)
            if (prev2 === 0 || m < prev2) localStorage.setItem('k0509_pair_best', String(m))
            const coins = Math.max(20, 200 - m * 5)
            const xp = Math.max(30, 300 - m * 6)
            setTimeout(() => { onWin(coins, xp); audio.achievement(); setPhase('done') }, 300)
          }
          return matched
        } else {
          audio.click()
          setTimeout(() => {
            setCards(c => c.map((card2, i) => (i === a || i === b) ? { ...card2, flipped: false } : card2))
            setFlipped([])
            setLocked(false)
          }, 800)
        }
      } else {
        setFlipped(newFlipped)
      }
      return newCards
    })
  }, [locked, flipped, matches, moves, startTime, onWin])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🎴 Para Kort</span>
        <span className={styles.scoreDisplay}>{matches}/8 · {moves} drag</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🎴</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Para Kort</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Vänd kort och para ihop matchande emojis!<br />4×4 rutnät · Så få drag som möjligt
          </div>
          {bestMoves > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestMoves} drag</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && (
        <div style={{ padding: '0 14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {cards.map((card, id) => (
              <button
                key={id}
                onClick={() => handleCard(id)}
                style={{
                  aspectRatio: '1', borderRadius: 12, fontSize: card.flipped || card.matched ? 24 : 20,
                  background: card.matched ? 'rgba(74,222,128,.15)' : card.flipped ? 'rgba(129,140,248,.2)' : 'rgba(255,255,255,.06)',
                  border: `2px solid ${card.matched ? 'rgba(74,222,128,.35)' : card.flipped ? 'rgba(129,140,248,.4)' : 'rgba(255,255,255,.1)'}`,
                  cursor: card.matched ? 'default' : 'pointer',
                  transition: 'all .15s',
                }}
              >
                {card.flipped || card.matched ? card.emoji : '❓'}
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>🎴</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>Klart! 🎉</div>
          <div style={{ fontSize: 14, color: '#4ade80' }}>{moves} drag · {elapsedSec}s</div>
          {bestMoves > 0 && moves <= bestMoves && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{Math.max(20, 200 - moves * 5)}🪙 +{Math.max(30, 300 - moves * 6)} XP</div>
          <button className="btn-primary" style={{ padding: '12px 28px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
