import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const ROUNDS = 5
const ROUND_TIME = 8

type Cell = { expr: string; val: number; tapped: boolean; correct: boolean | null }

function makeRound(): { cells: Cell[]; target: number } {
  const target = Math.floor(Math.random() * 11) + 2
  const matchCount = 2 + Math.floor(Math.random() * 3)
  const raw: Cell[] = []

  for (let i = 0; i < 16; i++) {
    const isMatch = i < matchCount
    let expr: string
    let val: number

    if (isMatch) {
      val = target
      const roll = Math.floor(Math.random() * 3)
      if (roll === 0 && target >= 2) {
        const a = Math.floor(Math.random() * (target - 1)) + 1
        expr = `${a}+${target - a}`
      } else if (roll === 1) {
        const extra = Math.floor(Math.random() * 6) + 1
        expr = `${target + extra}-${extra}`
      } else {
        const divs = [2, 3, 4].filter(d => target % d === 0)
        if (divs.length > 0) {
          const d = divs[Math.floor(Math.random() * divs.length)]
          expr = `${target / d}×${d}`
        } else {
          const a = Math.floor(Math.random() * (target - 1)) + 1
          expr = `${a}+${target - a}`
        }
      }
    } else {
      do { val = Math.floor(Math.random() * 18) + 1 } while (val === target)
      const a = Math.floor(Math.random() * (val - 1)) + 1
      expr = Math.random() < 0.5 ? `${a}+${val - a}` : `${val + a}-${a}`
    }

    raw.push({ expr, val, tapped: false, correct: null })
  }
  raw.sort(() => Math.random() - 0.5)
  return { cells: raw, target }
}

export const MathMazeGame = memo(function MathMazeGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [round, setRound] = useState(1)
  const [roundKey, setRoundKey] = useState(0)
  const [cells, setCells] = useState<Cell[]>([])
  const [target, setTarget] = useState(0)
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME)
  const [score, setScore] = useState(0)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_mmz_best') ?? 0))
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const scoreRef = useRef(0)
  const roundRef = useRef(1)

  const loadRound = useCallback((r: number) => {
    const { cells: c, target: t } = makeRound()
    setCells(c); setTarget(t)
    roundRef.current = r; setRound(r)
    setTimeLeft(ROUND_TIME)
    setRoundKey(k => k + 1)
  }, [])

  const start = useCallback(() => {
    scoreRef.current = 0; setScore(0)
    roundRef.current = 1
    loadRound(1)
    setPhase('playing')
  }, [loadRound])

  useEffect(() => {
    if (phase !== 'playing') return
    timerRef.current = setInterval(() => setTimeLeft(t => {
      if (t <= 1) {
        if (timerRef.current) clearInterval(timerRef.current)
        if (roundRef.current >= ROUNDS) {
          const s = scoreRef.current
          const prev = Number(localStorage.getItem('k0509_mmz_best') ?? 0)
          if (s > prev) localStorage.setItem('k0509_mmz_best', String(s))
          if (s > 0) onWin(Math.round(s / 8), s)
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

  const tap = useCallback((idx: number) => {
    if (phase !== 'playing') return
    setCells(prev => {
      if (prev[idx].tapped) return prev
      const isCorrect = prev[idx].val === target
      if (isCorrect) { audio.tap(); scoreRef.current += 15; setScore(s => s + 15) }
      else { audio.tap(); scoreRef.current = Math.max(0, scoreRef.current - 10); setScore(s => Math.max(0, s - 10)) }
      const n = [...prev]
      n[idx] = { ...n[idx], tapped: true, correct: isCorrect }
      return n
    })
  }, [phase, target])

  const timerPct = (timeLeft / ROUND_TIME) * 100

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🔢 Mattematrisen</span>
        <span className={styles.scoreDisplay}>{score}p · {round}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🔢</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Mattematrisen</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Tryck alla uttryck lika med måltalet! 5 rundor à 8 sekunder. +15p rätt, -10p fel.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}p</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && cells.length > 0 && (
        <div style={{ padding: '0 10px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,.08)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${timerPct}%`, background: timerPct <= 30 ? '#f87171' : '#60a5fa', transition: 'width 1s linear' }} />
          </div>
          <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--t2)' }}>
            Tryck alla = <span style={{ fontWeight: 900, color: '#fbbf24', fontSize: 22 }}>{target}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
            {cells.map((cell, i) => (
              <button
                key={i}
                onClick={() => tap(i)}
                disabled={cell.tapped}
                style={{
                  padding: '10px 4px',
                  borderRadius: 8,
                  fontSize: 11,
                  fontWeight: 700,
                  background: cell.tapped
                    ? cell.correct ? 'rgba(74,222,128,.2)' : 'rgba(248,113,113,.2)'
                    : 'rgba(255,255,255,.07)',
                  border: `1.5px solid ${cell.tapped
                    ? cell.correct ? '#4ade80' : '#f87171'
                    : 'rgba(255,255,255,.1)'}`,
                  color: cell.tapped ? (cell.correct ? '#4ade80' : '#f87171') : '#fff',
                  cursor: cell.tapped ? 'default' : 'pointer',
                  transition: 'background .1s',
                }}
              >
                {cell.expr}
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <div style={{ fontWeight: 900, color: '#4ade80', fontSize: 20 }}>🔢 {score}p!</div>
          <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
