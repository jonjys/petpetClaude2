import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const GAME_TIME = 30
const GRID_SIZE = 16

function makeGrid(target: number): number[] {
  const nums: number[] = []
  for (let i = 1; i <= GRID_SIZE; i++) nums.push(i)
  return nums.sort(() => Math.random() - 0.5)
}

export const NumberCrunchGame = memo(function NumberCrunchGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [grid, setGrid] = useState<number[]>([])
  const [target, setTarget] = useState(1)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_TIME)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_nc_best') ?? 0))
  const [wrongFlash, setWrongFlash] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const scoreRef = useRef(0)

  const start = useCallback(() => {
    const t = 1
    setGrid(makeGrid(t)); setTarget(t); setScore(0); setTimeLeft(GAME_TIME); scoreRef.current = 0
    setPhase('playing')
  }, [])

  useEffect(() => {
    if (phase !== 'playing') return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!)
          const s = scoreRef.current
          const prev = Number(localStorage.getItem('k0509_nc_best') ?? 0)
          if (s > prev) localStorage.setItem('k0509_nc_best', String(s))
          onWin(s * 3, s * 5)
          audio.achievement()
          setPhase('done')
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current!)
  }, [phase, onWin])

  const handleClick = useCallback((num: number) => {
    if (num !== target) {
      setWrongFlash(true)
      setTimeout(() => setWrongFlash(false), 300)
      audio.click()
      return
    }
    audio.coin()
    const newScore = scoreRef.current + 1
    scoreRef.current = newScore
    setScore(newScore)
    const nextTarget = target >= GRID_SIZE ? 1 : target + 1
    setTarget(nextTarget)
    if (nextTarget === 1) setGrid(makeGrid(nextTarget))
    else setGrid(prev => prev.map(n => n === num ? -1 : n))
  }, [target])

  const timerColor = timeLeft > 15 ? '#4ade80' : timeLeft > 7 ? '#fbbf24' : '#f87171'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🔢 Talknas</span>
        <span className={styles.scoreDisplay}>{score} · <span style={{ color: timerColor }}>{timeLeft}s</span></span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🔢</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Talknas</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Tryck siffrorna i ordning 1→16!<br />30 sekunder · Hur många sekvenser?
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore} tryck</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,.08)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(timeLeft / GAME_TIME) * 100}%`, background: timerColor, transition: 'width 1s linear', borderRadius: 2 }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 900, color: timerColor, minWidth: 30 }}>{timeLeft}s</span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--t3)' }}>Tryck: </span>
            <span style={{ fontFamily: 'var(--ff-head)', fontSize: 28, fontWeight: 900, color: '#818cf8' }}>{target}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, background: wrongFlash ? 'rgba(248,113,113,.1)' : 'transparent', borderRadius: 12, padding: 4, transition: 'background .1s' }}>
            {grid.map((n, i) => (
              <button
                key={i}
                onClick={() => n > 0 && handleClick(n)}
                style={{
                  aspectRatio: '1', borderRadius: 10, fontSize: 18, fontWeight: 900,
                  background: n === -1 ? 'rgba(74,222,128,.1)' : n === target ? 'rgba(129,140,248,.2)' : 'rgba(255,255,255,.06)',
                  border: `2px solid ${n === -1 ? 'rgba(74,222,128,.2)' : n === target ? 'rgba(129,140,248,.5)' : 'rgba(255,255,255,.1)'}`,
                  color: n === -1 ? '#4ade80' : '#e8e8f0', cursor: n > 0 ? 'pointer' : 'default',
                  transition: 'all .1s',
                }}
              >
                {n === -1 ? '✓' : n}
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{score >= 30 ? '🏆' : score >= 15 ? '⭐' : '🔢'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{score} tryck!</div>
          <div style={{ fontSize: 14, color: score >= 30 ? '#4ade80' : '#fbbf24' }}>
            {score >= 30 ? 'Raketsnar! 🏆' : score >= 15 ? 'Riktigt snabb! ⭐' : 'Öva mer! 🔢'}
          </div>
          {score > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{score * 3}🪙 +{score * 5} XP</div>
          <button className="btn-primary" style={{ padding: '12px 28px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
