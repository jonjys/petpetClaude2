import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const GAME_DURATION = 30
const TARGET_LIFE = 1200

interface Target {
  id: number
  x: number
  y: number
  size: number
  spawnAt: number
  color: string
}

const COLORS = ['#f87171','#60a5fa','#4ade80','#fbbf24','#c084fc','#f97316']

export const TapTargetGame = memo(function TapTargetGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [targets, setTargets] = useState<Target[]>([])
  const [score, setScore] = useState(0)
  const [missed, setMissed] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_tt_best') ?? 0))
  const idRef = useRef(0)
  const scoreRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const spawnRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const purgeRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopAll = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (spawnRef.current) clearInterval(spawnRef.current)
    if (purgeRef.current) clearInterval(purgeRef.current)
  }, [])

  const start = useCallback(() => {
    scoreRef.current = 0; setScore(0); setMissed(0)
    setTargets([]); setTimeLeft(GAME_DURATION); setPhase('playing')

    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          stopAll()
          const s = scoreRef.current
          const prev = Number(localStorage.getItem('k0509_tt_best') ?? 0)
          if (s > prev) localStorage.setItem('k0509_tt_best', String(s))
          if (s > 0) onWin(Math.round(s * 4), s * 20)
          setPhase('done')
          return 0
        }
        return t - 1
      })
    }, 1000)

    let spawnInterval = 800
    spawnRef.current = setInterval(() => {
      const t: Target = {
        id: idRef.current++,
        x: 8 + Math.random() * 76,
        y: 10 + Math.random() * 78,
        size: 36 + Math.floor(Math.random() * 22),
        spawnAt: Date.now(),
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      }
      setTargets(prev => [...prev, t])
    }, spawnInterval)

    purgeRef.current = setInterval(() => {
      const now = Date.now()
      setTargets(prev => {
        const expired = prev.filter(t => now - t.spawnAt > TARGET_LIFE)
        if (expired.length > 0) setMissed(m => m + expired.length)
        return prev.filter(t => now - t.spawnAt <= TARGET_LIFE)
      })
    }, 200)
  }, [onWin, stopAll])

  const tap = useCallback((id: number) => {
    setTargets(prev => {
      const hit = prev.find(t => t.id === id)
      if (!hit) return prev
      audio.coin()
      scoreRef.current++; setScore(scoreRef.current)
      return prev.filter(t => t.id !== id)
    })
  }, [])

  useEffect(() => () => stopAll(), [stopAll])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🎯 Tap Attack</span>
        <span className={styles.scoreDisplay}>{score}p · {timeLeft}s</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🎯</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Tap Attack</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Tryck cirklar innan de försvinner! 30 sekunder — var snabb!
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}p</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,.08)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(timeLeft / GAME_DURATION) * 100}%`, background: timeLeft <= 8 ? '#f87171' : '#4ade80', transition: 'width 1s linear' }} />
          </div>
          <div style={{ position: 'relative', height: 260, background: 'rgba(255,255,255,.04)', borderRadius: 12, border: '1px solid rgba(255,255,255,.08)', overflow: 'hidden' }}>
            {targets.map(t => {
              const age = (Date.now() - t.spawnAt) / TARGET_LIFE
              return (
                <button key={t.id} onClick={() => tap(t.id)} style={{
                  position: 'absolute',
                  left: `${t.x}%`, top: `${t.y}%`,
                  transform: 'translate(-50%, -50%)',
                  width: t.size, height: t.size,
                  borderRadius: '50%',
                  background: t.color,
                  opacity: Math.max(0.3, 1 - age * 0.7),
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: `0 0 ${t.size / 2}px ${t.color}55`,
                  transition: 'opacity .1s',
                }} />
              )
            })}
          </div>
          <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--t3)' }}>Missade: {missed}</div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <div style={{ fontWeight: 900, color: '#4ade80', fontSize: 20 }}>🎯 {score} träffar!</div>
          <div style={{ fontSize: 12, color: 'var(--t3)' }}>Missade: {missed}</div>
          <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
