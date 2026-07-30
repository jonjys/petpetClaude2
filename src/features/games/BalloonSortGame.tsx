import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const GAME_TIME = 30
const COUNT = 6
const POSITIONS = [
  { x: 18, y: 22 }, { x: 50, y: 12 }, { x: 82, y: 22 },
  { x: 18, y: 68 }, { x: 50, y: 58 }, { x: 82, y: 68 },
]
const COLORS = ['#f87171', '#fb923c', '#fbbf24', '#4ade80', '#60a5fa', '#c084fc']

function makeBoard(target: number): number[] {
  const vals: number[] = []
  for (let i = 0; i < COUNT; i++) {
    let v: number
    do { v = Math.floor(Math.random() * 9) + 1 } while (vals.includes(v) && vals.length < 9)
    vals.push(v)
  }
  if (!vals.includes(target)) vals[Math.floor(Math.random() * COUNT)] = target
  return vals
}

export const BalloonSortGame = memo(function BalloonSortGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [balloons, setBalloons] = useState<number[]>([])
  const [target, setTarget] = useState(1)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_TIME)
  const [hit, setHit] = useState<number | null>(null)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_bal_best') ?? 0))
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const scoreRef = useRef(0)
  const targetRef = useRef(1)
  const hitRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const start = useCallback(() => {
    scoreRef.current = 0; setScore(0); setTimeLeft(GAME_TIME)
    targetRef.current = 1; setTarget(1)
    setHit(null)
    setBalloons(makeBoard(1))
    setPhase('playing')
  }, [])

  useEffect(() => {
    if (phase !== 'playing') return
    timerRef.current = setInterval(() => setTimeLeft(t => {
      if (t <= 1) {
        if (timerRef.current) clearInterval(timerRef.current)
        const s = scoreRef.current
        const prev = Number(localStorage.getItem('k0509_bal_best') ?? 0)
        if (s > prev) localStorage.setItem('k0509_bal_best', String(s))
        if (s > 0) onWin(Math.round(s / 7), s)
        setPhase('done'); return 0
      }
      return t - 1
    }), 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase, onWin])

  const tap = useCallback((idx: number, val: number) => {
    if (phase !== 'playing' || hit !== null) return
    if (val === targetRef.current) {
      audio.tap()
      scoreRef.current += 20; setScore(s => s + 20)
      setHit(idx)
      if (hitRef.current) clearTimeout(hitRef.current)
      hitRef.current = setTimeout(() => {
        const nt = targetRef.current >= 9 ? 1 : targetRef.current + 1
        targetRef.current = nt; setTarget(nt)
        setBalloons(makeBoard(nt))
        setHit(null)
      }, 220)
    } else {
      audio.tap()
      scoreRef.current = Math.max(0, scoreRef.current - 10); setScore(s => Math.max(0, s - 10))
    }
  }, [phase, hit])

  const timerPct = (timeLeft / GAME_TIME) * 100

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🎈 Ballonger</span>
        <span className={styles.scoreDisplay}>{score}p · {timeLeft}s</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🎈</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Ballonger</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Hitta och tryck ballongen med rätt siffra! Räkna uppåt: 1→2→3…→9→1… 30 sek. +20p rätt, -10p fel.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}p</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && (
        <div style={{ padding: '0 10px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,.08)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${timerPct}%`, background: timerPct <= 25 ? '#f87171' : '#60a5fa', transition: 'width 1s linear' }} />
          </div>
          <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--t2)' }}>
            Tryck: <span style={{ fontWeight: 900, color: '#fbbf24', fontSize: 24 }}>{target}</span>
          </div>
          <div style={{ position: 'relative', height: 210, background: 'rgba(255,255,255,.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,.08)' }}>
            {balloons.map((val, i) => (
              <button
                key={i}
                onClick={() => tap(i, val)}
                style={{
                  position: 'absolute',
                  left: `${POSITIONS[i].x}%`,
                  top: `${POSITIONS[i].y}%`,
                  transform: 'translate(-50%,-50%)',
                  width: 54, height: 54,
                  borderRadius: '50%',
                  background: hit === i ? 'rgba(74,222,128,.35)' : val === target ? 'rgba(251,191,36,.2)' : `${COLORS[i]}18`,
                  border: `2.5px solid ${hit === i ? '#4ade80' : val === target ? '#fbbf24' : COLORS[i]}`,
                  color: '#fff', fontSize: 20, fontWeight: 900,
                  cursor: 'pointer',
                  transition: 'background .1s, border .1s',
                  boxShadow: val === target && hit !== i ? `0 0 14px ${COLORS[i]}55` : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {hit === i ? '✓' : val}
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <div style={{ fontWeight: 900, color: '#4ade80', fontSize: 20 }}>🎈 {score}p!</div>
          <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
