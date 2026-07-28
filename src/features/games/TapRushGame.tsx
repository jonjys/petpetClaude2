import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const GAME_TIME = 10

type Target = { id: number; x: number; y: number; emoji: string; alive: boolean; points: number }

const GOOD = ['⭐','💎','🪙','🍀','💰','🎁']
const BAD = ['💣','🔥','❌','⚡']

export const TapRushGame = memo(function TapRushGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [targets, setTargets] = useState<Target[]>([])
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_TIME)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_taprush_best') ?? 0))
  const stateRef = useRef({ targets: [] as Target[], score: 0, nextId: 0 })
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const spawnRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const start = useCallback(() => {
    stateRef.current = { targets: [], score: 0, nextId: 0 }
    setTargets([]); setScore(0); setTimeLeft(GAME_TIME)
    setPhase('playing')
  }, [])

  useEffect(() => {
    if (phase !== 'playing') return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!); clearInterval(spawnRef.current!)
          const s = stateRef.current.score
          const prev = Number(localStorage.getItem('k0509_taprush_best') ?? 0)
          if (s > prev) localStorage.setItem('k0509_taprush_best', String(s))
          onWin(s * 4, s * 8)
          audio.achievement()
          setPhase('done')
          return 0
        }
        return t - 1
      })
    }, 1000)
    spawnRef.current = setInterval(() => {
      const s = stateRef.current
      const isBad = Math.random() < 0.25
      s.targets.push({
        id: s.nextId++,
        x: 5 + Math.random() * 85,
        y: 5 + Math.random() * 80,
        emoji: isBad ? BAD[Math.floor(Math.random() * BAD.length)] : GOOD[Math.floor(Math.random() * GOOD.length)],
        alive: true,
        points: isBad ? -3 : 1 + Math.floor(Math.random() * 3),
      })
      // Remove stale targets
      s.targets = s.targets.filter(t => t.alive).slice(-12)
      setTargets([...s.targets])
    }, 600)
    return () => { clearInterval(timerRef.current!); clearInterval(spawnRef.current!) }
  }, [phase, onWin])

  const handleTap = useCallback((id: number, points: number) => {
    const s = stateRef.current
    s.targets = s.targets.map(t => t.id === id ? { ...t, alive: false } : t)
    s.score = Math.max(0, s.score + points)
    setScore(s.score)
    setTargets([...s.targets])
    if (points > 0) audio.coin(); else audio.click()
  }, [])

  const timerColor = timeLeft > 6 ? '#4ade80' : timeLeft > 3 ? '#fbbf24' : '#f87171'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>👆 Tap Rush</span>
        <span className={styles.scoreDisplay}>{score}pt · <span style={{ color: timerColor }}>{timeLeft}s</span></span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>👆</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Tap Rush</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Tryck bra saker ⭐💎 · Undvik dåliga 💣🔥<br />10 sekunder · Så snabbt som möjligt!
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}pt</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && (
        <div style={{ padding: '0 14px' }}>
          <div style={{ position: 'relative', height: 300, background: 'rgba(0,0,20,.5)', border: '2px solid rgba(99,102,241,.3)', borderRadius: 12, overflow: 'hidden', touchAction: 'none' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'rgba(255,255,255,.08)' }}>
              <div style={{ height: '100%', width: `${(timeLeft / GAME_TIME) * 100}%`, background: timerColor, transition: 'width 1s linear' }} />
            </div>
            {targets.filter(t => t.alive).map(t => (
              <button
                key={t.id}
                onPointerDown={() => handleTap(t.id, t.points)}
                style={{ position: 'absolute', left: `${t.x}%`, top: `${t.y}%`, transform: 'translate(-50%,-50%)', fontSize: 28, background: 'none', border: 'none', cursor: 'pointer', padding: 4, touchAction: 'none' }}
              >
                {t.emoji}
              </button>
            ))}
            <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,.9)', pointerEvents: 'none' }}>
              {score}
            </div>
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{score >= 25 ? '🏆' : score >= 12 ? '⭐' : '👆'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{score} poäng!</div>
          <div style={{ fontSize: 14, color: score >= 25 ? '#4ade80' : '#fbbf24' }}>
            {score >= 25 ? 'Tap-legend! 🏆' : score >= 12 ? 'Riktigt bra! ⭐' : 'Öva mer! 👆'}
          </div>
          {score > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{score * 4}🪙 +{score * 8} XP</div>
          <button className="btn-primary" style={{ padding: '12px 28px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
