import { memo, useState, useCallback, useEffect } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

type Difficulty = 'easy' | 'medium' | 'hard'

const DIFF_CONFIG: Record<Difficulty, { pairs: number; timeLimit: number; label: string }> = {
  easy: { pairs: 6, timeLimit: 60, label: 'Lätt (6 par)' },
  medium: { pairs: 10, timeLimit: 80, label: 'Medel (10 par)' },
  hard: { pairs: 15, timeLimit: 100, label: 'Svårt (15 par)' },
}

const EMOJIS = ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐸','🐵','🐔','🐧','🦆','🦉','🐺','🐗','🐴','🦄','🐝','🦋','🐙']

interface Card { id: number; emoji: string; matched: boolean; flipped: boolean }

function makeCards(pairs: number): Card[] {
  const chosen = EMOJIS.slice(0, pairs)
  return [...chosen, ...chosen]
    .sort(() => Math.random() - 0.5)
    .map((emoji, i) => ({ id: i, emoji, matched: false, flipped: false }))
}

export const PuzzlePairsGame = memo(function PuzzlePairsGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [difficulty, setDifficulty] = useState<Difficulty>('easy')
  const [cards, setCards] = useState<Card[]>([])
  const [flipped, setFlipped] = useState<number[]>([])
  const [moves, setMoves] = useState(0)
  const [matched, setMatched] = useState(0)
  const [timeLeft, setTimeLeft] = useState(60)
  const [locked, setLocked] = useState(false)
  const [bestMoves] = useState(() => Number(localStorage.getItem('k0509_pp_best') ?? 0))

  const cfg = DIFF_CONFIG[difficulty]

  useEffect(() => {
    if (phase !== 'playing') return
    const t = setInterval(() => setTimeLeft(tl => {
      if (tl <= 1) {
        clearInterval(t)
        const prev = Number(localStorage.getItem('k0509_pp_best') ?? 0)
        const score = matched * 50
        if (score > 0) onWin(Math.round(score / 5), score)
        setPhase('done')
        return 0
      }
      return tl - 1
    }), 1000)
    return () => clearInterval(t)
  }, [phase, matched, onWin])

  const start = useCallback((diff: Difficulty) => {
    setDifficulty(diff)
    setCards(makeCards(DIFF_CONFIG[diff].pairs))
    setFlipped([]); setMoves(0); setMatched(0)
    setTimeLeft(DIFF_CONFIG[diff].timeLimit); setLocked(false)
    setPhase('playing')
  }, [])

  const flip = useCallback((id: number) => {
    if (locked || phase !== 'playing') return
    const card = cards.find(c => c.id === id)
    if (!card || card.matched || card.flipped) return
    if (flipped.length === 1 && flipped[0] === id) return

    const newFlipped = [...flipped, id]
    setCards(prev => prev.map(c => c.id === id ? { ...c, flipped: true } : c))
    setFlipped(newFlipped)

    if (newFlipped.length === 2) {
      setMoves(m => m + 1)
      const [a, b] = newFlipped.map(fid => cards.find(c => c.id === fid)!)
      if (a.emoji === b.emoji) {
        audio.coin()
        setCards(prev => prev.map(c => newFlipped.includes(c.id) ? { ...c, matched: true, flipped: true } : c))
        setFlipped([])
        const newMatched = matched + 1
        setMatched(newMatched)
        if (newMatched >= cfg.pairs) {
          const sc = Math.max(0, (cfg.pairs * 100) + (timeLeft * 10) - (moves * 5))
          const prev = Number(localStorage.getItem('k0509_pp_best') ?? 0)
          if (!prev || moves < prev) localStorage.setItem('k0509_pp_best', String(moves + 1))
          audio.achievement(); onWin(Math.round(sc / 5), sc)
          setPhase('done')
        }
      } else {
        audio.tap()
        setLocked(true)
        setTimeout(() => {
          setCards(prev => prev.map(c => newFlipped.includes(c.id) ? { ...c, flipped: false } : c))
          setFlipped([]); setLocked(false)
        }, 800)
      }
    }
  }, [locked, phase, cards, flipped, matched, cfg, timeLeft, moves, onWin])

  const cols = difficulty === 'easy' ? 4 : difficulty === 'medium' ? 5 : 6

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🎴 Par-Pussel</span>
        <span className={styles.scoreDisplay}>{matched}/{cfg.pairs} · {timeLeft}s</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '20px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🎴</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Par-Pussel</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Vänd kort och hitta matchande par inom tidsgränsen!
          </div>
          {bestMoves > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Bästa: {bestMoves} drag</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 260 }}>
            {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
              <button key={d} className="btn-primary" style={{ padding: '12px', fontSize: 14 }} onClick={() => start(d)}>{DIFF_CONFIG[d].label}</button>
            ))}
          </div>
        </div>
      )}

      {(phase === 'playing' || phase === 'done') && (
        <div style={{ padding: '0 10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12, color: 'var(--t3)' }}>
            <span>{moves} drag</span>
            <span style={{ color: timeLeft <= 10 ? '#f87171' : 'var(--t3)' }}>⏱ {timeLeft}s</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 5 }}>
            {cards.map(card => (
              <button
                key={card.id}
                onClick={() => flip(card.id)}
                style={{
                  aspectRatio: '1',
                  borderRadius: 8,
                  border: card.matched ? '2px solid #4ade80' : '1px solid rgba(255,255,255,.1)',
                  background: card.flipped || card.matched ? 'rgba(255,255,255,.08)' : 'rgba(129,140,248,.15)',
                  fontSize: 20,
                  cursor: card.matched || card.flipped ? 'default' : 'pointer',
                  transition: 'all .15s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {card.flipped || card.matched ? card.emoji : '🎴'}
              </button>
            ))}
          </div>
          {phase === 'done' && (
            <div style={{ textAlign: 'center', marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
              <div style={{ fontWeight: 900, color: '#4ade80', fontSize: 15 }}>
                {matched >= cfg.pairs ? `🎉 Klar! ${moves} drag` : `⏱ Hittade ${matched}/${cfg.pairs} par`}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
                  <button key={d} className="btn-primary" style={{ padding: '8px 12px', fontSize: 11 }} onClick={() => start(d)}>{DIFF_CONFIG[d].label.split(' ')[0]}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
})
