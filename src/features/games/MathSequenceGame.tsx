import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const ROUNDS = 8
const TIME_PER_Q = 12

function buildSequence(): { nums: (number | null)[]; missingIdx: number; answer: number } {
  const type = Math.floor(Math.random() * 4)
  const start = Math.floor(Math.random() * 10) + 1
  const step = Math.floor(Math.random() * 5) + 1
  let nums: number[]

  if (type === 0) nums = Array.from({ length: 5 }, (_, i) => start + i * step)
  else if (type === 1) nums = Array.from({ length: 5 }, (_, i) => start * Math.pow(2, i))
  else if (type === 2) nums = Array.from({ length: 5 }, (_, i) => start - i * step)
  else nums = [start, start + step, start + step * 3, start + step * 6, start + step * 10]

  const missingIdx = Math.floor(Math.random() * 5)
  const answer = nums[missingIdx]
  const display: (number | null)[] = [...nums]
  display[missingIdx] = null
  return { nums: display, missingIdx, answer }
}

export const MathSequenceGame = memo(function MathSequenceGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [seq, setSeq] = useState<ReturnType<typeof buildSequence> | null>(null)
  const [idx, setIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(TIME_PER_Q)
  const [options, setOptions] = useState<number[]>([])
  const [feedback, setFeedback] = useState<boolean | null>(null)
  const [streak, setStreak] = useState(0)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_mathseq_best') ?? 0))
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const genOptions = useCallback((answer: number) => {
    const opts = new Set([answer])
    while (opts.size < 4) {
      const delta = Math.floor(Math.random() * 10) + 1
      opts.add(answer + (Math.random() > 0.5 ? delta : -delta))
    }
    return [...opts].sort(() => Math.random() - 0.5)
  }, [])

  const nextQ = useCallback((wasCorrect: boolean) => {
    if (wasCorrect) { const ns = streak + 1; setStreak(ns); setScore(s => s + (ns >= 3 ? 2 : 1)); audio.coin() }
    else { setStreak(0); audio.click() }
    setFeedback(wasCorrect)
    setTimeout(() => {
      setFeedback(null)
      if (idx + 1 >= ROUNDS) { setPhase('done') }
      else {
        const s = buildSequence()
        setSeq(s)
        setOptions(genOptions(s.answer))
        setIdx(i => i + 1)
        setTimeLeft(TIME_PER_Q)
      }
    }, 700)
  }, [streak, idx, genOptions])

  useEffect(() => {
    if (phase !== 'playing') return
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setTimeLeft(t => { if (t <= 1) { clearInterval(timerRef.current!); nextQ(false); return 0 } return t - 1 })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase, idx, nextQ])

  const start = useCallback(() => {
    const s = buildSequence()
    setSeq(s); setOptions(genOptions(s.answer))
    setIdx(0); setScore(0); setStreak(0); setFeedback(null)
    setTimeLeft(TIME_PER_Q)
    setPhase('playing')
  }, [genOptions])

  useEffect(() => {
    if (phase === 'done') {
      const prev = Number(localStorage.getItem('k0509_mathseq_best') ?? 0)
      if (score > prev) localStorage.setItem('k0509_mathseq_best', String(score))
      onWin(score * 15, score * 20)
      audio.achievement()
    }
  }, [phase, score, onWin])

  const timerColor = timeLeft > 7 ? '#4ade80' : timeLeft > 3 ? '#fbbf24' : '#f87171'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🔣 Talsekvens</span>
        <span className={styles.scoreDisplay}>{score}/{idx}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🔣</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Talsekvens</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Hitta det saknade talet i sekvensen!<br />{ROUNDS} uppgifter · {TIME_PER_Q}s per fråga
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore} poäng</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && seq && (
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,.08)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(timeLeft / TIME_PER_Q) * 100}%`, background: timerColor, borderRadius: 2, transition: 'width 1s linear' }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 900, color: timerColor }}>{timeLeft}s</span>
            {streak >= 3 && <span style={{ fontSize: 11, color: '#fbbf24' }}>🔥{streak}×</span>}
          </div>

          <div style={{
            background: feedback === true ? 'rgba(74,222,128,.1)' : feedback === false ? 'rgba(248,113,113,.1)' : 'rgba(255,255,255,.04)',
            border: `1px solid ${feedback === true ? 'rgba(74,222,128,.4)' : feedback === false ? 'rgba(248,113,113,.4)' : 'rgba(255,255,255,.1)'}`,
            borderRadius: 20, padding: '20px 16px', transition: 'all .2s',
          }}>
            <div style={{ fontSize: 11, color: 'var(--t3)', textAlign: 'center', marginBottom: 14 }}>Vad är det saknade talet? ({idx + 1}/{ROUNDS})</div>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              {seq.nums.map((n, i) => (
                <div key={i} style={{
                  minWidth: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: n === null ? 'rgba(99,102,241,.2)' : 'rgba(255,255,255,.06)',
                  border: `2px solid ${n === null ? '#818cf8' : 'rgba(255,255,255,.1)'}`,
                  fontSize: n === null ? 20 : 18, fontWeight: 900,
                  color: n === null ? '#818cf8' : '#e8e8f0', fontFamily: 'monospace', padding: '0 8px',
                }}>
                  {n === null ? '?' : n}
                </div>
              ))}
            </div>
          </div>

          {feedback === null && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => nextQ(opt === seq.answer)}
                  style={{
                    padding: '16px 0', borderRadius: 14, fontSize: 20, fontWeight: 900, fontFamily: 'monospace',
                    background: 'rgba(255,255,255,.05)', border: '2px solid rgba(255,255,255,.1)',
                    cursor: 'pointer', color: '#e8e8f0', transition: 'all .15s',
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{score >= ROUNDS * 1.5 ? '🧮' : score >= ROUNDS ? '⭐' : '🔣'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{score} poäng</div>
          <div style={{ fontSize: 14, color: score >= ROUNDS ? '#4ade80' : '#fbbf24' }}>
            {score >= 12 ? 'Matematikgeni! 🧮' : score >= 8 ? 'Bra! ⭐' : 'Öva mer! 📐'}
          </div>
          {score > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{score * 15}🪙 +{score * 20} XP</div>
          <button className="btn-primary" style={{ padding: '14px 32px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
