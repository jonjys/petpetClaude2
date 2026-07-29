import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const COLORS = ['#f87171', '#60a5fa', '#4ade80', '#fbbf24', '#a78bfa', '#fb923c']
const COLOR_NAMES = ['Röd', 'Blå', 'Grön', 'Gul', 'Lila', 'Orange']

export const ColorSequenceGame = memo(function ColorSequenceGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'showing' | 'input' | 'done'>('ready')
  const [sequence, setSequence] = useState<number[]>([])
  const [userInput, setUserInput] = useState<number[]>([])
  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)
  const [activeIdx, setActiveIdx] = useState<number | null>(null)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_cs_best') ?? 0))
  const [flash, setFlash] = useState<number | null>(null)
  const scoreRef = useRef(0)

  const showSequence = useCallback((seq: number[]) => {
    setPhase('showing')
    let i = 0
    const showNext = () => {
      if (i >= seq.length) {
        setActiveIdx(null)
        setTimeout(() => setPhase('input'), 400)
        return
      }
      setActiveIdx(seq[i])
      audio.coin()
      setTimeout(() => {
        setActiveIdx(null)
        setTimeout(() => { i++; showNext() }, 200)
      }, 500)
    }
    setTimeout(showNext, 400)
  }, [])

  const startRound = useCallback((r: number, prevSeq: number[]) => {
    const next = [...prevSeq, Math.floor(Math.random() * COLORS.length)]
    setSequence(next)
    setUserInput([])
    setRound(r)
    showSequence(next)
  }, [showSequence])

  const start = useCallback(() => {
    scoreRef.current = 0
    setScore(0); setRound(0); setSequence([]); setUserInput([])
    const first = [Math.floor(Math.random() * COLORS.length)]
    setSequence(first); setUserInput([])
    setRound(1)
    showSequence(first)
  }, [showSequence])

  const tap = useCallback((ci: number) => {
    if (phase !== 'input') return
    setFlash(ci)
    setTimeout(() => setFlash(null), 200)
    audio.tap()
    const next = [...userInput, ci]
    const pos = next.length - 1
    if (next[pos] !== sequence[pos]) {
      const s = scoreRef.current
      const prev = Number(localStorage.getItem('k0509_cs_best') ?? 0)
      if (s > prev) localStorage.setItem('k0509_cs_best', String(s))
      if (s > 0) onWin(Math.round(s / 8), s)
      setPhase('done')
      return
    }
    if (next.length === sequence.length) {
      const pts = sequence.length * 50
      scoreRef.current += pts
      setScore(s => s + pts)
      audio.achievement()
      setTimeout(() => startRound(round + 1, sequence), 600)
    } else {
      setUserInput(next)
    }
  }, [phase, userInput, sequence, round, onWin, startRound])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🌈 Färgsekvens</span>
        <span className={styles.scoreDisplay}>{score}p · Rnd {round}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🌈</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Färgsekvens</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Memorera och upprepa färgsekvensen! Varje runda läggs en ny färg till. Fel = game over.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}p</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {(phase === 'showing' || phase === 'input') && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--t3)' }}>
            {phase === 'showing' ? '👀 Memorera sekvensen...' : `🖱️ Upprepa! ${userInput.length}/${sequence.length}`}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            {COLORS.map((color, i) => (
              <button
                key={i}
                onClick={() => tap(i)}
                disabled={phase === 'showing'}
                style={{
                  height: 80,
                  borderRadius: 16,
                  background: activeIdx === i || flash === i
                    ? color
                    : `${color}33`,
                  border: `3px solid ${activeIdx === i || flash === i ? color : `${color}66`}`,
                  cursor: phase === 'input' ? 'pointer' : 'default',
                  transition: 'all .15s',
                  boxShadow: activeIdx === i ? `0 0 20px ${color}88` : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, color: activeIdx === i || flash === i ? '#000' : color,
                }}
              >
                {COLOR_NAMES[i]}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap' }}>
            {sequence.map((ci, i) => (
              <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: i < userInput.length ? COLORS[ci] : 'rgba(255,255,255,.15)' }} />
            ))}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <div style={{ fontWeight: 900, color: '#4ade80', fontSize: 20 }}>🌈 {score}p!</div>
          <div style={{ fontSize: 12, color: 'var(--t3)' }}>Kom till runda {round}</div>
          <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
