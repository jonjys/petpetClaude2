import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

interface Target {
  id: number
  x: number
  y: number
  size: number
  emoji: string
  points: number
  born: number
}

const GOOD = ['🎯', '⭐', '💎', '🌟', '🏆']
const BAD = ['💣', '☠️']
const DURATION = 25000

let nextId = 0

export const TargetClickGame = memo(function TargetClickGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [targets, setTargets] = useState<Target[]>([])
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [timeLeft, setTimeLeft] = useState(DURATION / 1000)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_tc_best') ?? 0))
  const spawnRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const scoreRef = useRef(0)
  const comboRef = useRef(0)

  const spawn = useCallback(() => {
    const isBad = Math.random() < 0.2
    const size = isBad ? 44 : Math.max(28, 60 - Math.random() * 32)
    const t: Target = {
      id: nextId++,
      x: 5 + Math.random() * 80,
      y: 5 + Math.random() * 80,
      size,
      emoji: isBad ? BAD[Math.floor(Math.random() * BAD.length)] : GOOD[Math.floor(Math.random() * GOOD.length)],
      points: isBad ? -100 : Math.round(100 / (size / 28)),
      born: Date.now(),
    }
    setTargets(prev => [...prev.slice(-10), t])
    setTimeout(() => setTargets(prev => prev.filter(x => x.id !== t.id)), 2000)
  }, [])

  const start = useCallback(() => {
    setScore(0); setCombo(0); scoreRef.current = 0; comboRef.current = 0
    setTargets([]); setTimeLeft(DURATION / 1000)
    setPhase('playing')
    spawnRef.current = setInterval(spawn, 600)
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          if (spawnRef.current) clearInterval(spawnRef.current)
          if (timerRef.current) clearInterval(timerRef.current)
          const s = scoreRef.current
          const prev = Number(localStorage.getItem('k0509_tc_best') ?? 0)
          if (s > prev) localStorage.setItem('k0509_tc_best', String(s))
          if (s > 0) onWin(Math.round(s / 5), s)
          setPhase('done'); return 0
        }
        return t - 1
      })
    }, 1000)
  }, [spawn, onWin])

  useEffect(() => () => {
    if (spawnRef.current) clearInterval(spawnRef.current)
    if (timerRef.current) clearInterval(timerRef.current)
  }, [])

  const click = useCallback((t: Target) => {
    setTargets(prev => prev.filter(x => x.id !== t.id))
    if (t.points < 0) {
      comboRef.current = 0; setCombo(0); audio.tap()
    } else {
      comboRef.current += 1; setCombo(comboRef.current)
      audio.coin()
    }
    const pts = t.points * Math.max(1, comboRef.current)
    scoreRef.current += pts; setScore(s => s + pts)
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🎯 Måljakt</span>
        <span className={styles.scoreDisplay}>{score}p · {timeLeft}s</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🎯</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Måljakt</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Klicka på bra mål (⭐💎🎯) för poäng — undvik bomber!<br />Combo ger bonuspoäng. 25 sekunder.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}p</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {(phase === 'playing' || phase === 'done') && (
        <div style={{ padding: '0 14px' }}>
          {combo > 2 && <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#fbbf24', marginBottom: 4 }}>🔥 COMBO ×{combo}!</div>}
          <div style={{
            position: 'relative', height: 320,
            background: 'rgba(0,10,20,.85)',
            border: '2px solid rgba(255,255,255,.08)',
            borderRadius: 14, overflow: 'hidden',
          }}>
            {targets.map(t => (
              <button
                key={t.id}
                onClick={phase === 'playing' ? () => click(t) : undefined}
                style={{
                  position: 'absolute',
                  left: `${t.x}%`, top: `${t.y}%`,
                  width: t.size, height: t.size,
                  transform: 'translate(-50%,-50%)',
                  background: 'none', border: 'none',
                  fontSize: t.size * 0.55,
                  cursor: 'pointer',
                  lineHeight: 1,
                  animation: 'popIn .12s ease-out',
                }}
              >
                {t.emoji}
              </button>
            ))}
            {phase === 'done' && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.6)' }}>
                <div style={{ fontWeight: 900, color: '#4ade80', fontSize: 18 }}>🎉 {score}p!</div>
                <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Spela igen!</button>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'center', fontSize: 11, color: 'var(--t3)' }}>
            <span>⭐💎🎯 = poäng</span><span>💣☠️ = förlust</span>
          </div>
        </div>
      )}
    </div>
  )
})
