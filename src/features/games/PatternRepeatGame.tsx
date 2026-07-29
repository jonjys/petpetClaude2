import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const CELLS = 9
const COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7']

function makePattern(len: number): number[] {
  return Array.from({ length: len }, () => Math.floor(Math.random() * CELLS))
}

export const PatternRepeatGame = memo(function PatternRepeatGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'showing' | 'input' | 'done'>('ready')
  const [pattern, setPattern] = useState<number[]>([])
  const [inputSeq, setInputSeq] = useState<number[]>([])
  const [activeCell, setActiveCell] = useState<number | null>(null)
  const [level, setLevel] = useState(1)
  const [score, setScore] = useState(0)
  const [failed, setFailed] = useState(false)
  const [bestLevel] = useState(() => Number(localStorage.getItem('k0509_pr_best') ?? 0))
  const showingRef = useRef(false)

  const showPattern = useCallback(async (pat: number[]) => {
    showingRef.current = true
    for (const cell of pat) {
      if (!showingRef.current) break
      await new Promise<void>(resolve => {
        setActiveCell(cell)
        audio.tap()
        setTimeout(() => { setActiveCell(null); setTimeout(resolve, 150) }, 500)
      })
    }
    showingRef.current = false
    setPhase('input')
  }, [])

  const startLevel = useCallback((lv: number) => {
    const pat = makePattern(lv + 2)
    setPattern(pat); setInputSeq([]); setFailed(false)
    setPhase('showing')
    setTimeout(() => showPattern(pat), 500)
  }, [showPattern])

  const start = useCallback(() => {
    setLevel(1); setScore(0); startLevel(1)
  }, [startLevel])

  useEffect(() => () => { showingRef.current = false }, [])

  const handleCell = useCallback((idx: number) => {
    if (phase !== 'input') return
    const newSeq = [...inputSeq, idx]
    setInputSeq(newSeq)
    audio.tap()

    if (newSeq[newSeq.length - 1] !== pattern[newSeq.length - 1]) {
      setFailed(true)
      const pts = (level - 1) * 100
      const newScore = score + pts
      setScore(newScore)
      const prev = Number(localStorage.getItem('k0509_pr_best') ?? 0)
      if (level > prev) localStorage.setItem('k0509_pr_best', String(level))
      if (newScore > 0) onWin(Math.round(newScore / 5), newScore)
      setPhase('done'); return
    }

    if (newSeq.length === pattern.length) {
      const pts = level * 150
      const newScore = score + pts
      setScore(newScore); audio.coin()
      const nextLevel = level + 1
      setLevel(nextLevel)
      setTimeout(() => startLevel(nextLevel), 800)
    }
  }, [phase, inputSeq, pattern, level, score, onWin, startLevel])

  const cols = 3

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🔮 Mönsterminne</span>
        <span className={styles.scoreDisplay}>{score}p · Lv.{level}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🔮</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Mönsterminne</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Memorera sekvensen av ljusande celler, upprepa sedan i rätt ordning! Sekvensen växer varje nivå.
          </div>
          {bestLevel > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: Nivå {bestLevel}</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase !== 'ready' && (
        <div style={{ padding: '0 14px' }}>
          <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--t3)', marginBottom: 10 }}>
            {phase === 'showing' ? `👀 Memorera sekvensen (${pattern.length} steg)` : phase === 'input' ? `👆 Upprepa! (${inputSeq.length}/${pattern.length})` : failed ? '❌ Fel sekvens!' : '✅ Rätt!'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 8, maxWidth: 300, margin: '0 auto' }}>
            {Array.from({ length: CELLS }, (_, i) => {
              const colorIdx = i % COLORS.length
              const isActive = activeCell === i
              return (
                <button
                  key={i}
                  onClick={() => handleCell(i)}
                  style={{
                    aspectRatio: '1', borderRadius: 12, border: 'none',
                    background: isActive ? COLORS[colorIdx] : `${COLORS[colorIdx]}33`,
                    boxShadow: isActive ? `0 0 20px ${COLORS[colorIdx]}` : 'none',
                    cursor: phase === 'input' ? 'pointer' : 'default',
                    transition: 'background .1s, box-shadow .1s',
                  }}
                />
              )
            })}
          </div>

          {phase === 'done' && (
            <div style={{ textAlign: 'center', marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
              <div style={{ fontWeight: 900, color: '#4ade80', fontSize: 15 }}>Nådde nivå {level} · {score}p</div>
              <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Spela igen!</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
})
