import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const GAME_TIME = 30
const TARGET_LIFE = 1100

interface Target {
  id: number
  x: number
  y: number
  born: number
  size: number
}

export const AimTrainerGame = memo(function AimTrainerGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [targets, setTargets] = useState<Target[]>([])
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_TIME)
  const [misses, setMisses] = useState(0)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_at_best') ?? 0))
  const idRef = useRef(0)
  const scoreRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const spawnRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const expireRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopAll = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (spawnRef.current) clearInterval(spawnRef.current)
    if (expireRef.current) clearInterval(expireRef.current)
  }, [])

  const end = useCallback(() => {
    stopAll()
    const s = scoreRef.current
    const prev = Number(localStorage.getItem('k0509_at_best') ?? 0)
    if (s > prev) localStorage.setItem('k0509_at_best', String(s))
    onWin(s * 5, s * 18)
    setPhase('done')
    audio.achievement()
  }, [stopAll, onWin])

  const start = useCallback(() => {
    scoreRef.current = 0
    setScore(0); setMisses(0); setTargets([]); setTimeLeft(GAME_TIME)
    setPhase('playing')

    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { end(); return 0 }
        return t - 1
      })
    }, 1000)

    spawnRef.current = setInterval(() => {
      setTargets(prev => {
        if (prev.length >= 3) return prev
        return [...prev, {
          id: idRef.current++,
          x: 8 + Math.random() * 78,
          y: 8 + Math.random() * 72,
          born: Date.now(),
          size: 32 + Math.floor(Math.random() * 20),
        }]
      })
    }, 700)

    expireRef.current = setInterval(() => {
      const now = Date.now()
      setTargets(prev => {
        const expired = prev.filter(t => now - t.born >= TARGET_LIFE)
        if (expired.length > 0) setMisses(m => m + expired.length)
        return prev.filter(t => now - t.born < TARGET_LIFE)
      })
    }, 100)
  }, [end])

  const hit = useCallback((id: number) => {
    setTargets(prev => {
      if (!prev.find(t => t.id === id)) return prev
      audio.coin()
      scoreRef.current++
      setScore(scoreRef.current)
      return prev.filter(t => t.id !== id)
    })
  }, [])

  useEffect(() => () => stopAll(), [stopAll])

  const timerPct = (timeLeft / GAME_TIME) * 100
  const timerColor = timeLeft > 15 ? '#4ade80' : timeLeft > 7 ? '#fbbf24' : '#f87171'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🎯 Aim Trainer</span>
        <span className={styles.scoreDisplay}>{score}✓ {misses}✗</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🎯</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Aim Trainer</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Tryck på måltavlorna innan de försvinner! Varje träff ger poäng. 30 sekunder.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore} träffar</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'rgba(255,255,255,.08)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${timerPct}%`, background: timerColor, transition: 'width 1s linear' }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 900, color: timerColor }}>{timeLeft}s</span>
          </div>
          <div
            style={{ position: 'relative', height: 240, background: 'rgba(255,255,255,.04)', borderRadius: 12, border: '1px solid rgba(255,255,255,.08)', overflow: 'hidden', cursor: 'crosshair' }}
            onClick={() => setMisses(m => m + 1)}
          >
            {targets.map(t => {
              const age = Math.min(1, (Date.now() - t.born) / TARGET_LIFE)
              const scale = 1 - age * 0.3
              return (
                <button
                  key={t.id}
                  onClick={e => { e.stopPropagation(); hit(t.id) }}
                  style={{
                    position: 'absolute',
                    left: `${t.x}%`, top: `${t.y}%`,
                    transform: `translate(-50%,-50%) scale(${scale})`,
                    width: t.size, height: t.size,
                    borderRadius: '50%',
                    background: `radial-gradient(circle, #f87171, #dc2626)`,
                    border: '3px solid #fca5a5',
                    cursor: 'pointer',
                    boxShadow: `0 0 ${12 + t.size / 2}px #f8717166`,
                    opacity: 1 - age * 0.5,
                  }}
                />
              )
            })}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{score >= 20 ? '🏆' : score >= 12 ? '⭐' : '🎯'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{score} träffar</div>
          <div style={{ fontSize: 12, color: '#aaa' }}>Missar: {misses}</div>
          <div style={{ fontSize: 13, color: score >= 20 ? '#4ade80' : '#fbbf24' }}>
            {score >= 25 ? 'SNIPER! 🎯' : score >= 20 ? 'Utmärkt! ⭐' : score >= 12 ? 'Bra sikt! 👍' : 'Öva mer! 🎯'}
          </div>
          {score > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{score * 5}🪙 +{score * 18} XP</div>
          <button className="btn-primary" style={{ padding: '14px 32px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
