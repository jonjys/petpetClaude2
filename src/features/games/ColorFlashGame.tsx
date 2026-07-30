import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const ROUNDS = 10
const FLASH_COLORS = [
  { name: 'Röd', bg: '#f87171', border: '#ef4444' },
  { name: 'Blå', bg: '#60a5fa', border: '#3b82f6' },
  { name: 'Grön', bg: '#4ade80', border: '#22c55e' },
  { name: 'Gul', bg: '#fbbf24', border: '#f59e0b' },
  { name: 'Lila', bg: '#c084fc', border: '#a855f7' },
  { name: 'Orange', bg: '#fb923c', border: '#f97316' },
]
const FLASH_MS = 350
const ANSWER_TIME = 6

function makeSequence(round: number): number[] {
  const len = 6 + round
  return Array.from({ length: len }, () => Math.floor(Math.random() * 6))
}

function mostFrequent(seq: number[]): number {
  const counts = new Array(6).fill(0)
  seq.forEach(v => counts[v]++)
  return counts.indexOf(Math.max(...counts))
}

export const ColorFlashGame = memo(function ColorFlashGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'flashing' | 'answering' | 'done'>('ready')
  const [round, setRound] = useState(1)
  const [roundKey, setRoundKey] = useState(0)
  const [currentFlash, setCurrentFlash] = useState<number | null>(null)
  const [timeLeft, setTimeLeft] = useState(ANSWER_TIME)
  const [score, setScore] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [correctAnswer, setCorrectAnswer] = useState(0)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_cfl_best') ?? 0))
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const scoreRef = useRef(0)
  const roundRef = useRef(1)
  const answerRef = useRef(0)

  const loadRound = useCallback((r: number) => {
    const seq = makeSequence(r)
    const correct = mostFrequent(seq)
    answerRef.current = correct; setCorrectAnswer(correct)
    roundRef.current = r; setRound(r)
    setPicked(null)
    setRoundKey(k => k + 1)
    setPhase('flashing')
    // Flash sequence
    let i = 0
    const flashNext = () => {
      if (i < seq.length) {
        setCurrentFlash(seq[i])
        setTimeout(() => {
          setCurrentFlash(null)
          i++
          setTimeout(flashNext, 80)
        }, FLASH_MS)
      } else {
        setCurrentFlash(null)
        setTimeLeft(ANSWER_TIME)
        setPhase('answering')
      }
    }
    flashNext()
  }, [])

  const start = useCallback(() => {
    scoreRef.current = 0; setScore(0); roundRef.current = 1
    loadRound(1)
  }, [loadRound])

  useEffect(() => {
    if (phase !== 'answering') return
    timerRef.current = setInterval(() => setTimeLeft(t => {
      if (t <= 1) {
        if (timerRef.current) clearInterval(timerRef.current)
        if (roundRef.current >= ROUNDS) {
          const s = scoreRef.current
          const prev = Number(localStorage.getItem('k0509_cfl_best') ?? 0)
          if (s > prev) localStorage.setItem('k0509_cfl_best', String(s))
          if (s > 0) onWin(Math.round(s / 7), s)
          setPhase('done')
        } else {
          loadRound(roundRef.current + 1)
        }
        return 0
      }
      return t - 1
    }), 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase, roundKey, onWin, loadRound])

  const pick = useCallback((idx: number) => {
    if (phase !== 'answering' || picked !== null) return
    if (timerRef.current) clearInterval(timerRef.current)
    setPicked(idx)
    const correct = idx === answerRef.current
    if (correct) {
      audio.coin()
      const bonus = Math.max(0, timeLeft - 1) * 8
      scoreRef.current += 40 + bonus; setScore(s => s + 40 + bonus)
    } else { audio.tap() }
    if (roundRef.current >= ROUNDS) {
      setTimeout(() => {
        const s = scoreRef.current
        const prev = Number(localStorage.getItem('k0509_cfl_best') ?? 0)
        if (s > prev) localStorage.setItem('k0509_cfl_best', String(s))
        if (s > 0) onWin(Math.round(s / 7), s)
        setPhase('done')
      }, 700)
    } else {
      setTimeout(() => loadRound(roundRef.current + 1), 700)
    }
  }, [phase, picked, timeLeft, onWin, loadRound])

  const timerPct = (timeLeft / ANSWER_TIME) * 100

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🌈 Färgminne</span>
        <span className={styles.scoreDisplay}>{score}p · {round}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🌈</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Färgminne</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            En rad färger blinkar förbi. Välj vilken färg som dök upp FLEST gånger! 10 runder.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}p</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'flashing' && (
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
          <div style={{ fontSize: 12, color: 'var(--t3)' }}>Kom ihåg vilken färg som visas mest!</div>
          <div style={{
            width: 120, height: 120, borderRadius: 24,
            background: currentFlash !== null ? FLASH_COLORS[currentFlash].bg : 'rgba(255,255,255,.05)',
            border: `3px solid ${currentFlash !== null ? FLASH_COLORS[currentFlash].border : 'rgba(255,255,255,.1)'}`,
            transition: 'background .05s',
            boxShadow: currentFlash !== null ? `0 0 30px ${FLASH_COLORS[currentFlash].bg}66` : 'none',
          }} />
          <div style={{ fontSize: 12, color: 'var(--t3)' }}>…</div>
        </div>
      )}

      {phase === 'answering' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,.08)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${timerPct}%`, background: timerPct <= 30 ? '#f87171' : '#60a5fa', transition: 'width 1s linear' }} />
          </div>
          <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--t2)', marginBottom: 4 }}>Vilken färg dök upp flest?</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {FLASH_COLORS.map((c, i) => {
              const isCorrect = i === correctAnswer
              const isPicked = picked === i
              return (
                <button key={i} onClick={() => pick(i)} disabled={picked !== null} style={{
                  height: 54, borderRadius: 14,
                  background: picked !== null
                    ? isCorrect ? 'rgba(74,222,128,.2)' : isPicked ? 'rgba(248,113,113,.2)' : `${c.bg}18`
                    : `${c.bg}20`,
                  border: `2px solid ${picked !== null
                    ? isCorrect ? '#4ade80' : isPicked ? '#f87171' : c.border + '44'
                    : c.border + '77'}`,
                  color: '#fff', fontSize: 12, fontWeight: 700,
                  cursor: picked !== null ? 'default' : 'pointer',
                  transition: 'all .15s',
                }}>{c.name}</button>
              )
            })}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <div style={{ fontWeight: 900, color: '#4ade80', fontSize: 20 }}>🌈 {score}p!</div>
          <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
