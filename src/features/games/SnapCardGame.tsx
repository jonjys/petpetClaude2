import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const EMOJIS = ['🐶', '🐱', '🐸', '🦁', '🐼', '🦊', '🐨', '🦋', '🐙', '🦄']
const DECK_SIZE = 24

function makeDeck(): string[] {
  const deck: string[] = []
  for (let i = 0; i < DECK_SIZE; i++) {
    if (i > 0 && Math.random() < 0.3) {
      deck.push(deck[deck.length - 1])
    } else {
      deck.push(EMOJIS[Math.floor(Math.random() * EMOJIS.length)])
    }
  }
  return deck
}

export const SnapCardGame = memo(function SnapCardGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [deck, setDeck] = useState<string[]>([])
  const [cardIdx, setCardIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_snap_best') ?? 0))
  const [snapAvail, setSnapAvail] = useState(false)
  const pendingRef = useRef(false)
  const scoreRef = useRef(0)
  const flipRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const start = useCallback(() => {
    const d = makeDeck()
    setDeck(d); setCardIdx(0); setScore(0); setFeedback(null); setSnapAvail(false)
    scoreRef.current = 0; pendingRef.current = false
    setPhase('playing')
    flipRef.current = setInterval(() => {
      setCardIdx(ci => {
        const next = ci + 1
        if (next >= d.length) {
          if (flipRef.current) clearInterval(flipRef.current)
          const s = scoreRef.current
          const prev = Number(localStorage.getItem('k0509_snap_best') ?? 0)
          if (s > prev) localStorage.setItem('k0509_snap_best', String(s))
          if (s > 0) onWin(Math.round(s / 5), s)
          setTimeout(() => setPhase('done'), 400)
          return ci
        }
        setSnapAvail(d[next] === d[next - 1])
        return next
      })
    }, 900)
  }, [onWin])

  useEffect(() => () => { if (flipRef.current) clearInterval(flipRef.current) }, [])

  const snap = useCallback(() => {
    if (phase !== 'playing' || pendingRef.current) return
    const isMatch = cardIdx > 0 && deck[cardIdx] === deck[cardIdx - 1]
    pendingRef.current = true
    if (isMatch) {
      const pts = 50; scoreRef.current += pts; setScore(s => s + pts)
      setFeedback('✅ SNAP! +50p'); setSnapAvail(false); audio.coin()
    } else {
      scoreRef.current = Math.max(0, scoreRef.current - 20); setScore(s => Math.max(0, s - 20))
      setFeedback('❌ Ingen match! -20p'); audio.tap()
    }
    setTimeout(() => { setFeedback(null); pendingRef.current = false }, 700)
  }, [phase, cardIdx, deck])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🃏 SNAP!</span>
        <span className={styles.scoreDisplay}>{score}p · {cardIdx}/{DECK_SIZE}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🃏</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>SNAP!</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Kort vänds ett i taget. Tryck SNAP när samma kort visas två gånger i rad! Fel snap -20p. 24 kort.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}p</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {(phase === 'playing' || phase === 'done') && deck.length > 0 && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            {/* Previous card */}
            <div style={{ width: 90, height: 120, borderRadius: 14, background: 'rgba(255,255,255,.06)', border: '2px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'var(--t3)' }}>
              {cardIdx > 0 ? <span style={{ fontSize: 52 }}>{deck[cardIdx - 1]}</span> : 'Föregående'}
            </div>
            <div style={{ fontSize: 24, color: 'var(--t3)' }}>↔</div>
            {/* Current card */}
            <div style={{ width: 90, height: 120, borderRadius: 14, background: snapAvail ? 'rgba(74,222,128,.15)' : 'rgba(255,255,255,.08)', border: `2px solid ${snapAvail ? '#4ade80' : 'rgba(255,255,255,.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: snapAvail ? '0 0 16px rgba(74,222,128,.3)' : 'none', transition: 'all .2s' }}>
              <span style={{ fontSize: 52 }}>{deck[cardIdx]}</span>
            </div>
          </div>

          {feedback && <div style={{ fontWeight: 900, fontSize: 16, color: feedback.startsWith('✅') ? '#4ade80' : '#f87171' }}>{feedback}</div>}

          {phase === 'playing' && (
            <button
              className="btn-primary"
              onClick={snap}
              style={{ padding: '20px 60px', fontSize: 20, fontWeight: 900, background: snapAvail ? 'linear-gradient(135deg, #4ade80, #22c55e)' : undefined }}
            >
              SNAP! 👏
            </button>
          )}
          {phase === 'done' && (
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
              <div style={{ fontWeight: 900, color: '#4ade80', fontSize: 18 }}>🃏 {score}p!</div>
              <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Spela igen!</button>
            </div>
          )}

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
            {deck.slice(0, cardIdx + 1).map((_, i) => (
              <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: i <= cardIdx ? '#60a5fa' : 'rgba(255,255,255,.15)' }} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
})
