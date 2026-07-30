import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const ROUNDS = 10
const ROUND_TIME = 8
const BASE_HUES = [0, 30, 60, 120, 180, 210, 270, 300]

function makeRound(round: number): { cells: string[]; oddIdx: number; size: number } {
  const hue = BASE_HUES[round % BASE_HUES.length]
  const sat = 60 + Math.floor(Math.random() * 20)
  const light = 50 + Math.floor(Math.random() * 10)
  const diff = Math.max(5, 25 - round * 2)
  const size = round < 4 ? 4 : round < 7 ? 5 : 6
  const total = size * size
  const oddIdx = Math.floor(Math.random() * total)
  const cells = Array.from({ length: total }, (_, i) =>
    i === oddIdx
      ? `hsl(${hue + diff},${sat}%,${light}%)`
      : `hsl(${hue},${sat}%,${light}%)`
  )
  return { cells, oddIdx, size }
}

export const ChameleonGame = memo(function ChameleonGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [round, setRound] = useState(1)
  const [roundKey, setRoundKey] = useState(0)
  const [cells, setCells] = useState<string[]>([])
  const [oddIdx, setOddIdx] = useState(0)
  const [gridSize, setGridSize] = useState(4)
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME)
  const [score, setScore] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_cam_best') ?? 0))
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const scoreRef = useRef(0)
  const roundRef = useRef(1)
  const oddRef = useRef(0)

  const loadRound = useCallback((r: number) => {
    const { cells: c, oddIdx: o, size } = makeRound(r - 1)
    setCells(c); oddRef.current = o; setOddIdx(o); setGridSize(size)
    setPicked(null); roundRef.current = r; setRound(r); setTimeLeft(ROUND_TIME)
    setRoundKey(k => k + 1)
  }, [])

  const start = useCallback(() => {
    scoreRef.current = 0; setScore(0); roundRef.current = 1
    loadRound(1); setPhase('playing')
  }, [loadRound])

  useEffect(() => {
    if (phase !== 'playing') return
    timerRef.current = setInterval(() => setTimeLeft(t => {
      if (t <= 1) {
        if (timerRef.current) clearInterval(timerRef.current)
        if (roundRef.current >= ROUNDS) {
          const s = scoreRef.current
          const prev = Number(localStorage.getItem('k0509_cam_best') ?? 0)
          if (s > prev) localStorage.setItem('k0509_cam_best', String(s))
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
    if (phase !== 'playing' || picked !== null) return
    if (timerRef.current) clearInterval(timerRef.current)
    setPicked(idx)
    const correct = idx === oddRef.current
    if (correct) {
      audio.coin()
      const bonus = Math.max(0, timeLeft - 1) * 10
      scoreRef.current += 50 + bonus; setScore(s => s + 50 + bonus)
    } else { audio.tap() }
    if (roundRef.current >= ROUNDS) {
      setTimeout(() => {
        const s = scoreRef.current
        const prev = Number(localStorage.getItem('k0509_cam_best') ?? 0)
        if (s > prev) localStorage.setItem('k0509_cam_best', String(s))
        if (s > 0) onWin(Math.round(s / 8), s)
        setPhase('done')
      }, 600)
    } else {
      setTimeout(() => loadRound(roundRef.current + 1), 600)
    }
  }, [phase, picked, timeLeft, onWin, loadRound])

  const timerPct = (timeLeft / ROUND_TIME) * 100
  const cellSize = Math.floor(240 / gridSize) - 3

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🦎 Kameleont</span>
        <span className={styles.scoreDisplay}>{score}p · {round}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🦎</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Kameleont</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            En ruta har en annan nyans. Hitta den! 10 runder — svårare för varje. +50p + tidbonus.
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
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${gridSize}, 1fr)`, gap: 3, justifyContent: 'center' }}>
            {cells.map((color, i) => (
              <button key={i} onClick={() => tap(i)} style={{
                width: cellSize, height: cellSize,
                borderRadius: 6,
                background: picked !== null && i === oddIdx ? '#4ade80' : picked === i && i !== oddIdx ? '#f87171' : color,
                border: picked !== null && i === oddIdx ? '2px solid #4ade80' : '1px solid rgba(0,0,0,.15)',
                cursor: picked !== null ? 'default' : 'pointer',
                transition: 'background .2s',
              }} />
            ))}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <div style={{ fontWeight: 900, color: '#4ade80', fontSize: 20 }}>🦎 {score}p!</div>
          <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
