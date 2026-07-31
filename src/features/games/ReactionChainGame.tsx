import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const ROUNDS = 8
const SHOW_MS = 600
const GAP_MS = 400

const COLORS = ['#f87171', '#60a5fa', '#4ade80', '#fbbf24', '#c084fc']
const LABELS = ['🔴', '🔵', '🟢', '🟡', '🟣']

interface Step {
  colorIdx: number
}

export const ReactionChainGame = memo(function ReactionChainGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'showing' | 'input' | 'feedback' | 'done'>('ready')
  const [round, setRound] = useState(0)
  const [sequence, setSequence] = useState<Step[]>([])
  const [showIdx, setShowIdx] = useState(-1)
  const [userSeq, setUserSeq] = useState<number[]>([])
  const [correct, setCorrect] = useState<boolean | null>(null)
  const [score, setScore] = useState(0)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_rc2_best') ?? 0))
  const scoreRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimer = useCallback(() => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const genSeq = useCallback((len: number): Step[] =>
    Array.from({ length: len }, () => ({ colorIdx: Math.floor(Math.random() * COLORS.length) })), [])

  const showSequence = useCallback((seq: Step[]) => {
    setShowIdx(-1)
    setPhase('showing')
    let i = 0
    const step = () => {
      if (i >= seq.length) {
        timerRef.current = setTimeout(() => { setShowIdx(-1); setPhase('input') }, GAP_MS)
        return
      }
      setShowIdx(i)
      timerRef.current = setTimeout(() => {
        setShowIdx(-1)
        timerRef.current = setTimeout(() => { i++; step() }, GAP_MS)
      }, SHOW_MS)
    }
    timerRef.current = setTimeout(step, 500)
  }, [])

  const startRound = useCallback((r: number) => {
    const len = 3 + Math.floor(r / 2)
    const seq = genSeq(len)
    setSequence(seq)
    setUserSeq([])
    setCorrect(null)
    setRound(r)
    showSequence(seq)
  }, [genSeq, showSequence])

  const start = useCallback(() => {
    scoreRef.current = 0
    setScore(0)
    startRound(0)
  }, [startRound])

  const tap = useCallback((colorIdx: number) => {
    setUserSeq(prev => {
      const next = [...prev, colorIdx]
      if (next.length === sequence.length) {
        const isCorrect = next.every((v, i) => v === sequence[i].colorIdx)
        setCorrect(isCorrect)
        setPhase('feedback')
        if (isCorrect) {
          scoreRef.current++
          setScore(scoreRef.current)
          audio.coin()
        } else {
          audio.click()
        }
        timerRef.current = setTimeout(() => {
          const nextRound = round + 1
          if (nextRound >= ROUNDS) {
            const s = scoreRef.current
            const prev = Number(localStorage.getItem('k0509_rc2_best') ?? 0)
            if (s > prev) localStorage.setItem('k0509_rc2_best', String(s))
            onWin(s * 20, s * 65)
            setPhase('done')
            audio.achievement()
          } else {
            startRound(nextRound)
          }
        }, 1000)
      }
      return next
    })
  }, [sequence, round, startRound, onWin])

  useEffect(() => () => clearTimer(), [clearTimer])

  const activeColor = showIdx >= 0 ? COLORS[sequence[showIdx]?.colorIdx] : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🔁 Färgkedja</span>
        <span className={styles.scoreDisplay}>{score}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🔁</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Färgkedja</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Se sekvensen av färger — tryck sedan på dem i exakt samma ordning! 8 ronder, längre kedja varje gång.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}/{ROUNDS}</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {(phase === 'showing' || phase === 'input') && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--t3)' }}>
            {phase === 'showing' ? 'Titta noga...' : `Din tur! (${userSeq.length}/${sequence.length})`} · Runda {round + 1}/{ROUNDS}
          </div>
          <div style={{
            height: 100, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: activeColor ? `${activeColor}33` : 'rgba(255,255,255,.04)',
            border: `2px solid ${activeColor ?? 'rgba(255,255,255,.1)'}`,
            transition: 'all .15s',
            boxShadow: activeColor ? `0 0 30px ${activeColor}44` : 'none',
          }}>
            {activeColor && <div style={{ fontSize: 52 }}>{LABELS[sequence[showIdx]?.colorIdx]}</div>}
            {!activeColor && phase === 'input' && <div style={{ fontSize: 13, color: 'var(--t3)' }}>Tryck i rätt ordning!</div>}
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', padding: '0 8px' }}>
            {COLORS.map((c, i) => (
              <button
                key={i}
                onClick={() => phase === 'input' && tap(i)}
                disabled={phase !== 'input'}
                style={{
                  width: 58, height: 58, borderRadius: 14,
                  background: `${c}22`, border: `3px solid ${c}88`,
                  fontSize: 26, cursor: phase === 'input' ? 'pointer' : 'default',
                  opacity: phase !== 'input' ? 0.5 : 1,
                  transition: 'all .15s',
                }}
              >
                {LABELS[i]}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
            {sequence.map((_, i) => (
              <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: i < userSeq.length ? COLORS[sequence[i].colorIdx] : 'rgba(255,255,255,.2)', transition: 'background .2s' }} />
            ))}
          </div>
        </div>
      )}

      {phase === 'feedback' && (
        <div style={{ padding: '32px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 52 }}>{correct ? '✅' : '❌'}</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: correct ? '#4ade80' : '#f87171' }}>
            {correct ? 'Perfekt! 🎯' : 'Fel ordning!'}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{score >= 6 ? '🏆' : score >= 4 ? '⭐' : '🔁'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{score} / {ROUNDS}</div>
          <div style={{ fontSize: 13, color: score >= 6 ? '#4ade80' : '#fbbf24' }}>
            {score >= 8 ? 'MÄSTARE! 🏆' : score >= 6 ? 'Utmärkt! ⭐' : score >= 4 ? 'Bra! 👍' : 'Öva mer! 🔁'}
          </div>
          {score > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{score * 20}🪙 +{score * 65} XP</div>
          <button className="btn-primary" style={{ padding: '14px 32px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
