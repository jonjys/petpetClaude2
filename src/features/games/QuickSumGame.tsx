import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const ROUNDS = 15
const TIME_PER_Q = 5

function genQuestion(round: number) {
  const maxNum = Math.min(50, 5 + round * 3)
  const nums = Array.from({ length: 4 + (round > 8 ? 1 : 0) }, () => 1 + Math.floor(Math.random() * maxNum))
  const [a, b] = nums.sort(() => Math.random() - 0.5).slice(0, 2)
  const target = a + b
  return { nums, target, a, b }
}

export const QuickSumGame = memo(function QuickSumGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)
  const [q, setQ] = useState<ReturnType<typeof genQuestion> | null>(null)
  const [selected, setSelected] = useState<number[]>([])
  const [timeLeft, setTimeLeft] = useState(TIME_PER_Q)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [streak, setStreak] = useState(0)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_qs_best') ?? 0))
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const nextQ = useCallback((r: number) => {
    setQ(genQuestion(r)); setSelected([]); setFeedback(null); setTimeLeft(TIME_PER_Q); setRound(r)
  }, [])

  const start = useCallback(() => { setScore(0); setStreak(0); setPhase('playing'); nextQ(0) }, [nextQ])

  useEffect(() => {
    if (phase !== 'playing' || feedback !== null) return
    timerRef.current = setInterval(() => setTimeLeft(t => {
      if (t <= 1) {
        if (timerRef.current) clearInterval(timerRef.current)
        setFeedback(`⏰ Tid! Rätt: ${q!.a} + ${q!.b} = ${q!.target}`)
        setStreak(0); audio.tap()
        setTimeout(() => {
          const nr = round + 1
          if (nr >= ROUNDS) { finalize(score); return }
          nextQ(nr)
        }, 1200)
        return 0
      }
      return t - 1
    }), 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase, round, feedback, q, score, nextQ])

  const finalize = (s: number) => {
    const prev = Number(localStorage.getItem('k0509_qs_best') ?? 0)
    if (s > prev) localStorage.setItem('k0509_qs_best', String(s))
    if (s > 0) onWin(Math.round(s / 8), s)
    setPhase('done')
  }

  const tapNum = useCallback((idx: number) => {
    if (!q || feedback !== null) return
    const next = selected.includes(idx) ? selected.filter(i => i !== idx) : [...selected, idx]
    setSelected(next)
    if (next.length === 2) {
      if (timerRef.current) clearInterval(timerRef.current)
      const sum = next.reduce((a, i) => a + q.nums[i], 0)
      const ok = sum === q.target
      const pts = ok ? Math.max(10, timeLeft * 15 + streak * 10) : 0
      const newScore = score + pts
      const newStreak = ok ? streak + 1 : 0
      setFeedback(ok ? `✅ ${q.nums[next[0]]} + ${q.nums[next[1]]} = ${q.target} +${pts}p` : `❌ ${q.nums[next[0]]} + ${q.nums[next[1]]} = ${sum}, inte ${q.target}`)
      audio[ok ? 'coin' : 'tap']()
      setTimeout(() => {
        const nr = round + 1
        if (nr >= ROUNDS) { finalize(newScore); return }
        setScore(newScore); setStreak(newStreak); nextQ(nr)
      }, 1100)
    }
  }, [q, selected, feedback, timeLeft, score, streak, round, nextQ])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>➕ Snabbsumma</span>
        <span className={styles.scoreDisplay}>{score}p · {round}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>➕</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Snabbsumma</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Hitta de TWÅ siffror som summerar till målet! Välj snabbt — {TIME_PER_Q}s per runda. 15 runder.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}p</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && q && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 3 }}>
            {Array.from({ length: TIME_PER_Q }, (_, i) => (
              <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i < timeLeft ? (timeLeft <= 2 ? '#f87171' : '#4ade80') : 'rgba(255,255,255,.08)' }} />
            ))}
          </div>
          {streak >= 2 && <div style={{ textAlign: 'center', fontSize: 12, color: '#fbbf24', fontWeight: 700 }}>🔥 ×{streak}</div>}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 6 }}>Vilka två ger summan?</div>
            <div style={{ fontFamily: 'var(--ff-head)', fontSize: 60, fontWeight: 900, color: '#60a5fa', lineHeight: 1 }}>{q.target}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${q.nums.length}, 1fr)`, gap: 10 }}>
            {q.nums.map((n, i) => (
              <button
                key={i}
                onClick={() => tapNum(i)}
                disabled={!!feedback}
                style={{
                  padding: '18px 8px', borderRadius: 14, fontSize: 22, fontWeight: 900, fontFamily: 'var(--ff-head)',
                  background: selected.includes(i) ? 'rgba(96,165,250,.25)' : 'rgba(255,255,255,.06)',
                  border: `2px solid ${selected.includes(i) ? '#60a5fa' : 'rgba(255,255,255,.1)'}`,
                  color: selected.includes(i) ? '#60a5fa' : '#e8e8f0',
                  cursor: feedback ? 'default' : 'pointer',
                  transition: 'all .1s',
                }}
              >
                {n}
              </button>
            ))}
          </div>
          {feedback && <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: feedback.startsWith('✅') ? '#4ade80' : '#f87171' }}>{feedback}</div>}
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <div style={{ fontWeight: 900, color: '#4ade80', fontSize: 20 }}>➕ {score}p!</div>
          <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
