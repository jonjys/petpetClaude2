import { memo, useState, useCallback, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const EMOJIS = ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐸','🐙','🦋','🌟','🔥','💎','🍎','🍕','🎸']
const SHOW_DURATION = 600
const INTER_DELAY = 300

export const MemoryChainGame = memo(function MemoryChainGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'showing' | 'input' | 'done'>('ready')
  const [sequence, setSequence] = useState<number[]>([])
  const [playerSeq, setPlayerSeq] = useState<number[]>([])
  const [activeIdx, setActiveIdx] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_mc_best') ?? 0))
  const scoreRef = useRef(0)
  const seqRef = useRef<number[]>([])

  const showSequence = useCallback((seq: number[]) => {
    setPhase('showing')
    setPlayerSeq([])
    let i = 0
    function step() {
      if (i >= seq.length) { setActiveIdx(null); setPhase('input'); return }
      setActiveIdx(seq[i])
      audio.tap()
      setTimeout(() => { setActiveIdx(null); setTimeout(() => { i++; step() }, INTER_DELAY) }, SHOW_DURATION)
    }
    setTimeout(step, 400)
  }, [])

  const start = useCallback(() => {
    scoreRef.current = 0; setScore(0)
    const first = Math.floor(Math.random() * EMOJIS.length)
    seqRef.current = [first]
    setSequence([first])
    showSequence([first])
  }, [showSequence])

  const handlePick = useCallback((idx: number) => {
    if (phase !== 'input') return
    audio.click()
    const next = [...playerSeq, idx]
    setPlayerSeq(next)
    const pos = next.length - 1
    if (next[pos] !== seqRef.current[pos]) {
      audio.tap()
      const s = scoreRef.current
      const prev = Number(localStorage.getItem('k0509_mc_best') ?? 0)
      if (s > prev) localStorage.setItem('k0509_mc_best', String(s))
      if (s > 0) onWin(Math.round(s * 20), s * 50)
      setPhase('done')
      return
    }
    if (next.length === seqRef.current.length) {
      audio.coin()
      scoreRef.current++; setScore(scoreRef.current)
      const newSeq = [...seqRef.current, Math.floor(Math.random() * EMOJIS.length)]
      seqRef.current = newSeq
      setSequence(newSeq)
      setTimeout(() => showSequence(newSeq), 600)
    }
  }, [phase, playerSeq, onWin, showSequence])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🧠 Minneskedja</span>
        <span className={styles.scoreDisplay}>{score} ronder</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🧠</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Minneskedja</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Titta på sekvensen av emojis — tryck dem i rätt ordning! Sekvensen växer för varje rond.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore} ronder</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {(phase === 'showing' || phase === 'input') && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            {phase === 'showing'
              ? <div style={{ fontSize: 13, color: 'var(--t3)', fontWeight: 700 }}>👁️ Titta på sekvensen... ({sequence.length} emojis)</div>
              : <div style={{ fontSize: 13, color: '#60a5fa', fontWeight: 700 }}>👆 Tryck i rätt ordning! ({playerSeq.length}/{sequence.length})</div>
            }
          </div>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', minHeight: 40 }}>
            {phase === 'input' && playerSeq.map((idx, i) => (
              <span key={i} style={{ fontSize: 24 }}>{EMOJIS[idx]}</span>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {EMOJIS.map((emoji, idx) => (
              <button key={idx} disabled={phase !== 'input'} onClick={() => handlePick(idx)} style={{
                padding: '14px 0', borderRadius: 12, fontSize: 24,
                background: activeIdx === idx ? 'rgba(251,191,36,.4)' : 'rgba(255,255,255,.07)',
                border: `2px solid ${activeIdx === idx ? '#fbbf24' : 'rgba(255,255,255,.1)'}`,
                cursor: phase !== 'input' ? 'default' : 'pointer',
                transform: activeIdx === idx ? 'scale(1.15)' : 'scale(1)',
                transition: 'all .12s',
              }}>{emoji}</button>
            ))}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <div style={{ fontWeight: 900, color: '#4ade80', fontSize: 20 }}>🧠 {score} ronder!</div>
          <div style={{ fontSize: 12, color: 'var(--t3)' }}>Sekvens: {sequence.length} emojis</div>
          <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
