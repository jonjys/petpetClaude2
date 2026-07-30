import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const ROUNDS = 15
const ROUND_TIME = 6
const GRID_SIZE = 9

function makeRound() {
  const a = 2 + Math.floor(Math.random() * 9)
  const b = 2 + Math.floor(Math.random() * 9)
  const correct = a * b
  const cells: number[] = [correct]
  while (cells.length < GRID_SIZE) {
    const wrong = correct + (Math.floor(Math.random() * 20) - 10)
    if (wrong > 0 && wrong !== correct && !cells.includes(wrong)) cells.push(wrong)
  }
  return { a, b, correct, cells: cells.sort(() => Math.random() - 0.5) }
}

export const MathGridGame = memo(function MathGridGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [round, setRound] = useState(1)
  const [roundKey, setRoundKey] = useState(0)
  const [question, setQuestion] = useState(() => makeRound())
  const [picked, setPicked] = useState<number | null>(null)
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME)
  const [score, setScore] = useState(0)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_mg_best') ?? 0))
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const scoreRef = useRef(0)
  const roundRef = useRef(1)

  const finishRound = useCallback((r: number) => {
    if (timerRef.current) clearInterval(timerRef.current)
    const nr = r + 1
    if (nr > ROUNDS) {
      const s = scoreRef.current
      const prev = Number(localStorage.getItem('k0509_mg_best') ?? 0)
      if (s > prev) localStorage.setItem('k0509_mg_best', String(s))
      if (s > 0) onWin(Math.round(s * 3), s * 10)
      setPhase('done')
    } else {
      setTimeout(() => {
        roundRef.current = nr
        setQuestion(makeRound())
        setPicked(null)
        setRound(nr)
        setTimeLeft(ROUND_TIME)
        setRoundKey(k => k + 1)
      }, 600)
    }
  }, [onWin])

  useEffect(() => {
    if (phase !== 'playing') return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { finishRound(roundRef.current); return 0 }
        return t - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase, roundKey, finishRound])

  const pick = useCallback((val: number) => {
    if (phase !== 'playing' || picked !== null) return
    if (timerRef.current) clearInterval(timerRef.current)
    setPicked(val)
    if (val === question.correct) {
      audio.coin(); scoreRef.current += 10; setScore(scoreRef.current)
    } else { audio.tap() }
    setTimeout(() => finishRound(roundRef.current), 600)
  }, [phase, picked, question.correct, finishRound])

  const start = useCallback(() => {
    scoreRef.current = 0; setScore(0); roundRef.current = 1
    setQuestion(makeRound()); setPicked(null); setRound(1)
    setTimeLeft(ROUND_TIME); setRoundKey(0); setPhase('playing')
  }, [])

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>✖️ MatteGrid</span>
        <span className={styles.scoreDisplay}>{score}p · {round}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>✖️</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>MatteGrid</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Tryck rätt svar i rutnätet! 15 multiplikationsuppgifter, 6 sekunder var. +10p rätt.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}p</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,.08)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(timeLeft / ROUND_TIME) * 100}%`, background: timeLeft <= 2 ? '#f87171' : '#fbbf24', transition: 'width 1s linear' }} />
          </div>
          <div style={{ textAlign: 'center', padding: '10px 0 4px' }}>
            <div style={{ fontFamily: 'var(--ff-head)', fontSize: 36, fontWeight: 900, color: '#fff' }}>
              {question.a} × {question.b} = ?
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {question.cells.map((val, i) => {
              const isCorrect = val === question.correct
              const isPicked = val === picked
              const bg = picked === null ? 'rgba(255,255,255,.07)'
                : isCorrect ? 'rgba(74,222,128,.25)'
                : isPicked ? 'rgba(248,113,113,.25)' : 'rgba(255,255,255,.04)'
              const border = picked === null ? 'rgba(255,255,255,.12)'
                : isCorrect ? '#4ade80'
                : isPicked ? '#f87171' : 'rgba(255,255,255,.06)'
              return (
                <button key={i} disabled={picked !== null} onClick={() => pick(val)} style={{
                  padding: '18px 0', borderRadius: 12,
                  fontFamily: 'var(--ff-head)', fontSize: 20, fontWeight: 900,
                  background: bg, border: `2px solid ${border}`,
                  color: picked === null ? '#fff' : isCorrect ? '#4ade80' : isPicked ? '#f87171' : 'var(--t3)',
                  cursor: picked !== null ? 'default' : 'pointer', transition: 'all .12s',
                }}>{val}</button>
              )
            })}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <div style={{ fontWeight: 900, color: '#fbbf24', fontSize: 20 }}>✖️ {score}p!</div>
          <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
