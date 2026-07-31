import { memo, useState, useCallback, useRef, useEffect } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const ROUNDS = 10
const FLASH_MS = 400
const PAUSE_MS = 200

const BUTTONS = [
  { id: 0, color: '#f87171', activeColor: '#fca5a5' },
  { id: 1, color: '#60a5fa', activeColor: '#93c5fd' },
  { id: 2, color: '#4ade80', activeColor: '#86efac' },
  { id: 3, color: '#fbbf24', activeColor: '#fde68a' },
]

function getSequence(round: number): number[] {
  const len = 3 + round
  return Array.from({ length: len }, () => Math.floor(Math.random() * 4))
}

export const SequenceRepeatGame = memo(function SequenceRepeatGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'show' | 'input' | 'feedback' | 'done'>('ready')
  const [round, setRound] = useState(0)
  const [sequence, setSequence] = useState<number[]>([])
  const [inputIdx, setInputIdx] = useState(0)
  const [lit, setLit] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [wasCorrect, setWasCorrect] = useState(false)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_srg_best') ?? 0))
  const scoreRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputIdxRef = useRef(0)
  const sequenceRef = useRef<number[]>([])

  const flashSequence = useCallback((seq: number[], onDone: () => void) => {
    let i = 0
    const step = () => {
      if (i >= seq.length) { onDone(); return }
      setLit(seq[i])
      audio.tap()
      timerRef.current = setTimeout(() => {
        setLit(null)
        timerRef.current = setTimeout(() => { i++; step() }, PAUSE_MS)
      }, FLASH_MS)
    }
    step()
  }, [])

  const nextRound = useCallback((r: number) => {
    if (r >= ROUNDS) {
      const s = scoreRef.current
      const prev = Number(localStorage.getItem('k0509_srg_best') ?? 0)
      if (s > prev) localStorage.setItem('k0509_srg_best', String(s))
      onWin(s * 20, s * 65)
      setPhase('done')
      audio.achievement()
      return
    }
    const seq = getSequence(r)
    setSequence(seq)
    sequenceRef.current = seq
    setInputIdx(0)
    inputIdxRef.current = 0
    setRound(r)
    setPhase('show')
    timerRef.current = setTimeout(() => {
      flashSequence(seq, () => setPhase('input'))
    }, 600)
  }, [onWin, flashSequence])

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const start = useCallback(() => {
    scoreRef.current = 0
    setScore(0)
    nextRound(0)
  }, [nextRound])

  const pressButton = useCallback((btnId: number) => {
    if (phase !== 'input') return
    const seq = sequenceRef.current
    const idx = inputIdxRef.current
    if (btnId !== seq[idx]) {
      setWasCorrect(false)
      setPhase('feedback')
      audio.click()
      timerRef.current = setTimeout(() => nextRound(round + 1), 1000)
      return
    }
    setLit(btnId)
    audio.coin()
    timerRef.current = setTimeout(() => setLit(null), 150)
    const newIdx = idx + 1
    inputIdxRef.current = newIdx
    setInputIdx(newIdx)
    if (newIdx === seq.length) {
      scoreRef.current++
      setScore(scoreRef.current)
      setWasCorrect(true)
      setPhase('feedback')
      audio.achievement()
      timerRef.current = setTimeout(() => nextRound(round + 1), 900)
    }
  }, [phase, round, nextRound])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🔁 Sekvensupprepning</span>
        <span className={styles.scoreDisplay}>{score}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🔁</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Sekvensupprepning</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Knapparna blinkar — upprepa sekvensen! Börjar med 3 steg, växer till 12. 10 ronder.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}/{ROUNDS}</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {(phase === 'show' || phase === 'input') && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--t3)', textAlign: 'center' }}>
            {phase === 'show' ? `Titta! (${round + 1}/${ROUNDS})` : `Upprepa! ${inputIdx}/${sequence.length} (${round + 1}/${ROUNDS})`}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '10px 0' }}>
            {BUTTONS.map(btn => (
              <button
                key={btn.id}
                onClick={() => pressButton(btn.id)}
                disabled={phase === 'show'}
                style={{
                  height: 90, borderRadius: 20,
                  background: lit === btn.id ? btn.activeColor : btn.color,
                  border: 'none', cursor: phase === 'input' ? 'pointer' : 'default',
                  transition: 'background .1s',
                  boxShadow: lit === btn.id ? `0 0 20px ${btn.activeColor}` : 'none',
                  transform: lit === btn.id ? 'scale(1.05)' : 'scale(1)',
                }}
              />
            ))}
          </div>
        </div>
      )}

      {phase === 'feedback' && (
        <div style={{ padding: '32px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 52 }}>{wasCorrect ? '✅' : '❌'}</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: wasCorrect ? '#4ade80' : '#f87171' }}>
            {wasCorrect ? 'Perfekt sekvens!' : `Fel på steg ${inputIdx + 1}!`}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{score >= 8 ? '🏆' : score >= 5 ? '⭐' : '🔁'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{score} / {ROUNDS}</div>
          <div style={{ fontSize: 13, color: score >= 8 ? '#4ade80' : '#fbbf24' }}>
            {score === 10 ? 'PERFEKT! 🏆' : score >= 8 ? 'Utmärkt! ⭐' : score >= 5 ? 'Bra! 👍' : 'Öva mer! 🔁'}
          </div>
          {score > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{score * 20}🪙 +{score * 65} XP</div>
          <button className="btn-primary" style={{ padding: '14px 32px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
