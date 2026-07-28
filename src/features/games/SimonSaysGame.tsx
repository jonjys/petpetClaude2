import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const COLORS = [
  { id: 0, bg: 'rgba(248,113,113,.25)', border: 'rgba(248,113,113,.8)', glow: '#f87171', emoji: '🔴' },
  { id: 1, bg: 'rgba(96,165,250,.25)', border: 'rgba(96,165,250,.8)', glow: '#60a5fa', emoji: '🔵' },
  { id: 2, bg: 'rgba(74,222,128,.25)', border: 'rgba(74,222,128,.8)', glow: '#4ade80', emoji: '🟢' },
  { id: 3, bg: 'rgba(251,191,36,.25)', border: 'rgba(251,191,36,.8)', glow: '#fbbf24', emoji: '🟡' },
]

export const SimonSaysGame = memo(function SimonSaysGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'showing' | 'input' | 'done'>('ready')
  const [sequence, setSequence] = useState<number[]>([])
  const [inputIdx, setInputIdx] = useState(0)
  const [active, setActive] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_simon_best') ?? 0))
  const seqRef = useRef<number[]>([])

  const showSequence = useCallback((seq: number[]) => {
    setPhase('showing')
    setActive(null)
    let i = 0
    const interval = setInterval(() => {
      if (i < seq.length) {
        setActive(seq[i])
        setTimeout(() => setActive(null), Math.max(300, 600 - seq.length * 20))
        i++
      } else {
        clearInterval(interval)
        setPhase('input')
        setInputIdx(0)
      }
    }, Math.max(500, 900 - seq.length * 25))
    return () => clearInterval(interval)
  }, [])

  const nextRound = useCallback((currentSeq: number[]) => {
    const next = [...currentSeq, Math.floor(Math.random() * 4)]
    seqRef.current = next
    setSequence(next)
    setTimeout(() => showSequence(next), 800)
    setScore(s => s + 1)
  }, [showSequence])

  const start = useCallback(() => {
    setScore(0); setLives(3); setInputIdx(0)
    const first = [Math.floor(Math.random() * 4)]
    seqRef.current = first
    setSequence(first)
    setPhase('showing')
    setTimeout(() => showSequence(first), 500)
  }, [showSequence])

  const handlePress = useCallback((colorId: number) => {
    if (phase !== 'input') return
    setActive(colorId)
    setTimeout(() => setActive(null), 150)

    if (colorId === seqRef.current[inputIdx]) {
      audio.tap()
      if (inputIdx + 1 >= seqRef.current.length) {
        setTimeout(() => nextRound(seqRef.current), 500)
      } else {
        setInputIdx(i => i + 1)
      }
    } else {
      audio.click()
      const newLives = lives - 1
      setLives(newLives)
      if (newLives <= 0) {
        setPhase('done')
      } else {
        setTimeout(() => showSequence(seqRef.current), 800)
        setInputIdx(0)
      }
    }
  }, [phase, inputIdx, lives, nextRound, showSequence])

  useEffect(() => {
    if (phase === 'done') {
      const prev = Number(localStorage.getItem('k0509_simon_best') ?? 0)
      if (score > prev) localStorage.setItem('k0509_simon_best', String(score))
      onWin(score * 12, score * 18)
      audio.achievement()
    }
  }, [phase, score, onWin])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🔮 Simon Says</span>
        <span className={styles.scoreDisplay}>{score} · {'❤️'.repeat(lives)}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🔮</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Simon Says</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Upprepa färgsekvensen! Sekvensen växer varje runda.<br />3 liv · Sekvensen ökar i hastighet!
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore} rundor</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {(phase === 'showing' || phase === 'input') && (
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--t3)' }}>
            {phase === 'showing' ? '👀 Memorera...' : `Tryck! (${inputIdx + 1}/${sequence.length})`}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {COLORS.map(c => (
              <button
                key={c.id}
                onClick={() => handlePress(c.id)}
                disabled={phase === 'showing'}
                style={{
                  aspectRatio: '1',
                  borderRadius: 20,
                  fontSize: 40,
                  border: `3px solid ${active === c.id ? c.border : 'rgba(255,255,255,.1)'}`,
                  background: active === c.id ? c.bg : 'rgba(255,255,255,.04)',
                  boxShadow: active === c.id ? `0 0 24px ${c.glow}44` : 'none',
                  cursor: phase === 'input' ? 'pointer' : 'default',
                  transition: 'all .15s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transform: active === c.id ? 'scale(0.95)' : 'scale(1)',
                }}
              >
                {c.emoji}
              </button>
            ))}
          </div>
          <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--t3)' }}>
            Runda {score + 1} · {'❤️'.repeat(lives)}{'🖤'.repeat(3 - lives)}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{score >= 15 ? '🧠' : score >= 8 ? '⭐' : '🔮'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{score} rundor</div>
          <div style={{ fontSize: 14, color: score >= 15 ? '#4ade80' : '#fbbf24' }}>
            {score >= 15 ? 'Minnesmästare! 🧠' : score >= 8 ? 'Bra minne! ⭐' : 'Öva mer! 🔮'}
          </div>
          {score > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{score * 12}🪙 +{score * 18} XP</div>
          <button className="btn-primary" style={{ padding: '14px 32px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
