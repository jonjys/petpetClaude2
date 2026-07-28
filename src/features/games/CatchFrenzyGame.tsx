import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const GOOD = ['🍎','🍊','🍋','🍇','🍓','🍒','🥝','🍑','🥭','🍌']
const BAD  = ['💣','💀','🔥','⚡','☠️']
const GAME_TIME = 30

type FallingItem = { id: number; emoji: string; x: number; good: boolean }

export const CatchFrenzyGame = memo(function CatchFrenzyGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [items, setItems] = useState<FallingItem[]>([])
  const [score, setScore] = useState(0)
  const [misses, setMisses] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_TIME)
  const [streak, setStreak] = useState(0)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_catch_best') ?? 0))
  const counterRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const spawnRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const start = useCallback(() => {
    setScore(0); setMisses(0); setStreak(0); setItems([]); setTimeLeft(GAME_TIME)
    setPhase('playing')
  }, [])

  useEffect(() => {
    if (phase !== 'playing') return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current!); clearInterval(spawnRef.current!); setPhase('done'); return 0 }
        return t - 1
      })
    }, 1000)
    spawnRef.current = setInterval(() => {
      const isGood = Math.random() > 0.3
      const emoji = isGood ? GOOD[Math.floor(Math.random() * GOOD.length)] : BAD[Math.floor(Math.random() * BAD.length)]
      const x = 10 + Math.random() * 80
      setItems(prev => {
        const id = ++counterRef.current
        const next = [...prev, { id, emoji, x, good: isGood }]
        setTimeout(() => setItems(p => p.filter(i => i.id !== id)), 1800)
        return next
      })
    }, 600)
    return () => { clearInterval(timerRef.current!); clearInterval(spawnRef.current!) }
  }, [phase])

  const tap = useCallback((item: FallingItem) => {
    setItems(prev => prev.filter(i => i.id !== item.id))
    if (item.good) {
      setStreak(s => { const ns = s + 1; setScore(sc => sc + (ns >= 5 ? 2 : 1)); return ns })
      audio.coin()
    } else {
      setStreak(0); setMisses(m => m + 1); audio.click()
    }
  }, [])

  useEffect(() => {
    if (phase === 'done') {
      const prev = Number(localStorage.getItem('k0509_catch_best') ?? 0)
      if (score > prev) localStorage.setItem('k0509_catch_best', String(score))
      onWin(score * 8, score * 10)
      audio.achievement()
    }
  }, [phase, score, onWin])

  const timerColor = timeLeft > 15 ? '#4ade80' : timeLeft > 7 ? '#fbbf24' : '#f87171'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🍎 Fångst Frenzy</span>
        <span className={styles.scoreDisplay}>{score}✓ {misses}✗</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🍎</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Fångst Frenzy</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Tryck på frukter! Undvik bomber 💣<br />{GAME_TIME} sekunder · Streak-bonus vid 5+ i rad
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore} poäng</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,.08)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(timeLeft / GAME_TIME) * 100}%`, background: timerColor, borderRadius: 2, transition: 'width 1s linear' }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 900, color: timerColor }}>{timeLeft}s</span>
            {streak >= 5 && <span style={{ fontSize: 11, color: '#fbbf24' }}>🔥{streak}×</span>}
          </div>
          <div style={{ position: 'relative', height: 280, background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 16, overflow: 'hidden' }}>
            {items.map(item => (
              <button
                key={item.id}
                onClick={() => tap(item)}
                style={{
                  position: 'absolute', left: `${item.x}%`, top: '10%',
                  fontSize: 36, background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  transform: 'translateX(-50%)',
                  animation: 'fallDown 1.8s linear forwards',
                }}
              >
                {item.emoji}
              </button>
            ))}
            <div style={{ position: 'absolute', bottom: 8, left: 0, right: 0, textAlign: 'center', fontSize: 11, color: 'var(--t3)' }}>
              Tryck på frukt!
            </div>
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{score >= 25 ? '🏆' : score >= 15 ? '⭐' : '🍎'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{score} fångade</div>
          <div style={{ fontSize: 14, color: score >= 25 ? '#4ade80' : '#fbbf24' }}>
            {score >= 25 ? 'Fångst-mästare! 🏆' : score >= 15 ? 'Bra! ⭐' : 'Öva mer! 🍎'}
          </div>
          <div style={{ fontSize: 12, color: '#f87171' }}>{misses} bomber träffade</div>
          {score > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{score * 8}🪙 +{score * 10} XP</div>
          <button className="btn-primary" style={{ padding: '14px 32px' }} onClick={start}>Spela igen!</button>
        </div>
      )}

      <style>{`
        @keyframes fallDown {
          from { top: 5%; opacity: 1; }
          to   { top: 85%; opacity: 0.4; }
        }
      `}</style>
    </div>
  )
})
