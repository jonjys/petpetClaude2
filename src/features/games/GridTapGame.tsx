import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const GRID_SIZE = 3
const GAME_TIME = 30

export const GridTapGame = memo(function GridTapGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [active, setActive] = useState<number[]>([])
  const [score, setScore] = useState(0)
  const [misses, setMisses] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_TIME)
  const [flash, setFlash] = useState<Record<number, 'hit' | 'miss'>>({})
  const [streak, setStreak] = useState(0)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_grid_best') ?? 0))
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const spawnRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const speed = useCallback((s: number) => Math.max(500, 1200 - s * 40), [])

  const spawnTargets = useCallback((currentScore: number) => {
    const count = currentScore >= 15 ? 3 : currentScore >= 8 ? 2 : 1
    const cells = Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => i)
      .sort(() => Math.random() - 0.5).slice(0, count)
    setActive(cells)
    spawnRef.current = setTimeout(() => {
      setActive(prev => {
        if (prev.length > 0) {
          setMisses(m => m + prev.length)
          setStreak(0)
        }
        return []
      })
    }, speed(currentScore))
  }, [speed])

  useEffect(() => {
    if (phase !== 'playing') return
    spawnTargets(0)
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!)
          if (spawnRef.current) clearTimeout(spawnRef.current)
          setPhase('done')
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (spawnRef.current) clearTimeout(spawnRef.current)
    }
  }, [phase, spawnTargets])

  const tap = useCallback((idx: number) => {
    if (active.includes(idx)) {
      setFlash(f => ({ ...f, [idx]: 'hit' }))
      setTimeout(() => setFlash(f => { const n = { ...f }; delete n[idx]; return n }), 200)
      setActive(prev => {
        const next = prev.filter(i => i !== idx)
        if (next.length === 0) {
          setScore(s => {
            const ns = s + 1
            setStreak(st => st + 1)
            if (spawnRef.current) clearTimeout(spawnRef.current)
            setTimeout(() => spawnTargets(ns), 150)
            return ns
          })
        }
        return next
      })
      audio.tap()
    } else {
      setFlash(f => ({ ...f, [idx]: 'miss' }))
      setTimeout(() => setFlash(f => { const n = { ...f }; delete n[idx]; return n }), 200)
      setMisses(m => m + 1)
      setStreak(0)
      audio.click()
    }
  }, [active, spawnTargets])

  useEffect(() => {
    if (phase === 'done') {
      const prev = Number(localStorage.getItem('k0509_grid_best') ?? 0)
      if (score > prev) localStorage.setItem('k0509_grid_best', String(score))
      onWin(score * 5, score * 8)
      audio.achievement()
    }
  }, [phase, score, onWin])

  const timerColor = timeLeft > 15 ? '#4ade80' : timeLeft > 7 ? '#fbbf24' : '#f87171'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🔲 Grid Tap</span>
        <span className={styles.scoreDisplay}>{score} · ✗{misses}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🔲</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Grid Tap</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Tryck på de lysande rutorna så snabbt du kan!<br />Mer rutor dyker upp när du blir bättre · 30 sekunder
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore} träffar</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={() => { setScore(0); setMisses(0); setStreak(0); setTimeLeft(GAME_TIME); setActive([]); setFlash({}); setPhase('playing') }}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && (
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,.08)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(timeLeft / GAME_TIME) * 100}%`, background: timerColor, borderRadius: 2, transition: 'width 1s linear' }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 900, color: timerColor }}>{timeLeft}s</span>
            {streak >= 3 && <span style={{ fontSize: 11, color: '#fbbf24' }}>🔥{streak}</span>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => {
              const isActive = active.includes(i)
              const f = flash[i]
              return (
                <button
                  key={i}
                  onClick={() => tap(i)}
                  style={{
                    aspectRatio: '1',
                    borderRadius: 16,
                    fontSize: 28,
                    border: `2px solid ${isActive ? '#fbbf24' : f === 'miss' ? 'rgba(248,113,113,.6)' : 'rgba(255,255,255,.08)'}`,
                    background: isActive
                      ? 'rgba(251,191,36,.2)'
                      : f === 'hit' ? 'rgba(74,222,128,.2)' : f === 'miss' ? 'rgba(248,113,113,.1)' : 'rgba(255,255,255,.04)',
                    cursor: 'pointer',
                    transition: 'background .1s, border-color .1s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {isActive ? '⭐' : f === 'hit' ? '✓' : f === 'miss' ? '✗' : ''}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{score >= 30 ? '⚡' : score >= 15 ? '⭐' : '🔲'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{score} träffar · {misses} miss</div>
          <div style={{ fontSize: 14, color: score >= 30 ? '#4ade80' : '#fbbf24' }}>
            {score >= 30 ? 'NINJA! ⚡' : score >= 15 ? 'Snabbhänd! ⭐' : 'Öva mer! 🔲'}
          </div>
          {score > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{score * 5}🪙 +{score * 8} XP</div>
          <button className="btn-primary" style={{ padding: '14px 32px' }} onClick={() => { setScore(0); setMisses(0); setStreak(0); setTimeLeft(GAME_TIME); setActive([]); setFlash({}); setPhase('playing') }}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
