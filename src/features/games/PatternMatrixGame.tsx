import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const ROUNDS = 10
const ROUND_TIME = 12

const SETS = [
  ['🍎', '🍊', '🍋'],
  ['🐶', '🐱', '🐭'],
  ['🌙', '⭐', '☀️'],
  ['🔴', '🔵', '🟢'],
  ['🎯', '🎲', '🎮'],
  ['🍕', '🍔', '🌮'],
  ['🚗', '✈️', '🚢'],
  ['🎸', '🎹', '🥁'],
]

function makeMatrix(set: string[]): { grid: string[][]; answer: string; options: string[] } {
  const [a, b, c] = set
  const perms = [
    [a, b, c],
    [b, c, a],
    [c, a, b],
    [a, c, b],
    [b, a, c],
    [c, b, a],
  ]
  const idx = Math.floor(Math.random() * 3)
  const rows = [
    perms[idx],
    perms[(idx + 1) % 3],
    perms[(idx + 2) % 3],
  ]
  const answer = rows[2][2]
  const grid = rows.map((r, ri) => r.map((v, ci) => ri === 2 && ci === 2 ? '?' : v))
  const allEmoji = SETS.flat()
  const distractors = allEmoji.filter(e => !set.includes(e))
  const wrong = distractors.sort(() => Math.random() - 0.5).slice(0, 3)
  const opts = [answer, ...wrong].sort(() => Math.random() - 0.5)
  return { grid, answer, options: opts }
}

export const PatternMatrixGame = memo(function PatternMatrixGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [round, setRound] = useState(1)
  const [roundKey, setRoundKey] = useState(0)
  const [matrix, setMatrix] = useState<ReturnType<typeof makeMatrix> | null>(null)
  const [picked, setPicked] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME)
  const [score, setScore] = useState(0)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_pm_best') ?? 0))
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const scoreRef = useRef(0)
  const roundRef = useRef(1)
  const answerRef = useRef('')

  const loadRound = useCallback((r: number) => {
    const set = SETS[Math.floor(Math.random() * SETS.length)]
    const m = makeMatrix(set)
    answerRef.current = m.answer
    roundRef.current = r
    setMatrix(m); setPicked(null); setRound(r); setTimeLeft(ROUND_TIME)
    setRoundKey(k => k + 1)
  }, [])

  const finishRound = useCallback((r: number) => {
    if (timerRef.current) clearInterval(timerRef.current)
    const nr = r + 1
    if (nr > ROUNDS) {
      const s = scoreRef.current
      const prev = Number(localStorage.getItem('k0509_pm_best') ?? 0)
      if (s > prev) localStorage.setItem('k0509_pm_best', String(s))
      if (s > 0) onWin(Math.round(s / 5), s)
      setPhase('done')
    } else {
      setTimeout(() => loadRound(nr), 700)
    }
  }, [onWin, loadRound])

  useEffect(() => {
    if (phase !== 'playing') return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          finishRound(roundRef.current)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase, roundKey, finishRound])

  const pick = useCallback((opt: string) => {
    if (phase !== 'playing' || picked !== null) return
    if (timerRef.current) clearInterval(timerRef.current)
    setPicked(opt)
    if (opt === answerRef.current) {
      audio.coin()
      scoreRef.current += 10; setScore(scoreRef.current)
    } else { audio.tap() }
    setTimeout(() => finishRound(roundRef.current), 600)
  }, [phase, picked, finishRound])

  const start = useCallback(() => {
    scoreRef.current = 0; setScore(0)
    loadRound(1); setPhase('playing')
  }, [loadRound])

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🔲 Matris</span>
        <span className={styles.scoreDisplay}>{score}p · {round}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🔲</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Matris</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Varje rad och kolumn innehåller tre olika emojis. Hitta den saknade! 10 frågor, 12 sekunder var.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}p</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && matrix && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,.08)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(timeLeft / ROUND_TIME) * 100}%`, background: timeLeft <= 4 ? '#f87171' : '#60a5fa', transition: 'width 1s linear' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, margin: '0 auto', width: '100%', maxWidth: 240 }}>
            {matrix.grid.flat().map((cell, idx) => (
              <div key={idx} style={{
                aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 32, borderRadius: 12,
                background: cell === '?' ? 'rgba(251,191,36,.15)' : 'rgba(255,255,255,.07)',
                border: `2px solid ${cell === '?' ? '#fbbf24' : 'rgba(255,255,255,.12)'}`,
              }}>{cell}</div>
            ))}
          </div>
          <div style={{ fontSize: 12, color: 'var(--t3)', textAlign: 'center' }}>Välj rätt emoji:</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {matrix.options.map(opt => (
              <button key={opt} onClick={() => pick(opt)} disabled={picked !== null} style={{
                padding: '14px 0', borderRadius: 12, fontSize: 26,
                background: picked === null ? 'rgba(255,255,255,.07)'
                  : opt === matrix.answer ? 'rgba(74,222,128,.2)'
                  : opt === picked ? 'rgba(248,113,113,.2)' : 'rgba(255,255,255,.04)',
                border: `2px solid ${picked === null ? 'rgba(255,255,255,.15)'
                  : opt === matrix.answer ? '#4ade80'
                  : opt === picked ? '#f87171' : 'rgba(255,255,255,.06)'}`,
                cursor: picked !== null ? 'default' : 'pointer', transition: 'all .15s',
              }}>{opt}</button>
            ))}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <div style={{ fontWeight: 900, color: '#4ade80', fontSize: 20 }}>🔲 {score}p!</div>
          <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
