import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const ROUNDS = 20
const GRID = 4
const BASE_TIME = 5

function hsl(h: number, s: number, l: number) {
  return `hsl(${h},${s}%,${l}%)`
}

function makeRound(round: number) {
  const h = Math.floor(Math.random() * 360)
  const s = 60 + Math.floor(Math.random() * 20)
  const l = 40 + Math.floor(Math.random() * 15)
  const diff = Math.max(4, 18 - Math.floor(round * 0.6))
  const oddIdx = Math.floor(Math.random() * GRID * GRID)
  const cells = Array.from({ length: GRID * GRID }, (_, i) =>
    i === oddIdx ? hsl(h, s, l + diff) : hsl(h, s, l)
  )
  return { cells, oddIdx }
}

export const ColorBlindGame = memo(function ColorBlindGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [round, setRound] = useState(1)
  const [roundKey, setRoundKey] = useState(0)
  const [question, setQuestion] = useState(() => makeRound(1))
  const [picked, setPicked] = useState<number | null>(null)
  const [timeLeft, setTimeLeft] = useState(BASE_TIME)
  const [score, setScore] = useState(0)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_cb2_best') ?? 0))
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const scoreRef = useRef(0)
  const roundRef = useRef(1)

  const finishRound = useCallback((r: number) => {
    if (timerRef.current) clearInterval(timerRef.current)
    const nr = r + 1
    if (nr > ROUNDS) {
      const s = scoreRef.current
      const prev = Number(localStorage.getItem('k0509_cb2_best') ?? 0)
      if (s > prev) localStorage.setItem('k0509_cb2_best', String(s))
      if (s > 0) onWin(Math.round(s * 3), s * 20)
      setPhase('done')
    } else {
      setTimeout(() => {
        roundRef.current = nr
        setQuestion(makeRound(nr))
        setPicked(null)
        setRound(nr)
        setTimeLeft(Math.max(2, BASE_TIME - Math.floor(nr / 5)))
        setRoundKey(k => k + 1)
      }, 500)
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

  const pick = useCallback((idx: number) => {
    if (phase !== 'playing' || picked !== null) return
    if (timerRef.current) clearInterval(timerRef.current)
    setPicked(idx)
    if (idx === question.oddIdx) {
      audio.coin(); scoreRef.current += 10; setScore(scoreRef.current)
    } else { audio.tap() }
    setTimeout(() => finishRound(roundRef.current), 500)
  }, [phase, picked, question.oddIdx, finishRound])

  const start = useCallback(() => {
    scoreRef.current = 0; setScore(0); roundRef.current = 1
    setQuestion(makeRound(1)); setPicked(null); setRound(1)
    setTimeLeft(BASE_TIME); setRoundKey(0); setPhase('playing')
  }, [])

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🎨 Hitta Avvikaren</span>
        <span className={styles.scoreDisplay}>{score}p · {round}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🎨</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Hitta Avvikaren</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            En ruta har en annorlunda nyans — tryck den! 20 runder, tidspress ökar. +10p per rätt.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}p</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,.08)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(timeLeft / BASE_TIME) * 100}%`, background: timeLeft <= 1 ? '#f87171' : '#a78bfa', transition: 'width 1s linear' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${GRID}, 1fr)`, gap: 6 }}>
            {question.cells.map((color, i) => (
              <button key={i} disabled={picked !== null} onClick={() => pick(i)} style={{
                aspectRatio: '1', borderRadius: 10,
                background: color,
                border: picked === null ? '2px solid transparent'
                  : i === question.oddIdx ? '2px solid #4ade80'
                  : i === picked ? '2px solid #f87171' : '2px solid transparent',
                cursor: picked !== null ? 'default' : 'pointer',
                transition: 'border .1s',
              }} />
            ))}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <div style={{ fontWeight: 900, color: '#a78bfa', fontSize: 20 }}>🎨 {score}p!</div>
          <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
