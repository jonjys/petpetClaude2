import { memo, useState, useRef, useCallback } from 'react'
import styles from './GamesView.module.css'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

type Phase = 'wait' | 'ready' | 'go' | 'result'

export const ReactionGame = memo(function ReactionGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<Phase>('wait')
  const [ms, setMs] = useState(0)
  const [round, setRound] = useState(0)
  const [times, setTimes] = useState<number[]>([])
  const startRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const startRound = useCallback(() => {
    setPhase('ready')
    const delay = 1500 + Math.random() * 2500
    timerRef.current = setTimeout(() => {
      setPhase('go')
      startRef.current = Date.now()
    }, delay)
  }, [])

  const handlePress = useCallback(() => {
    if (phase === 'wait') {
      startRound()
      return
    }
    if (phase === 'ready') {
      if (timerRef.current) clearTimeout(timerRef.current)
      setPhase('wait')
      return
    }
    if (phase === 'go') {
      const elapsed = Date.now() - startRef.current
      setMs(elapsed)
      setPhase('result')
      const newTimes = [...times, elapsed]
      setTimes(newTimes)
      const newRound = round + 1
      setRound(newRound)
      if (newRound >= 3) {
        const avg = newTimes.reduce((a, b) => a + b, 0) / newTimes.length
        const coins = Math.round(Math.max(5, 25 - avg / 40))
        const xp = Math.round(Math.max(10, 40 - avg / 25))
        onWin(coins, xp)
      }
    }
  }, [phase, round, times, startRound, onWin])

  const avg = times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>⚡ Reaktion</span>
        <span className={styles.scoreDisplay}>{round}/3</span>
      </div>

      <div
        onClick={handlePress}
        style={{
          margin: '16px',
          borderRadius: 24,
          minHeight: 260,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          cursor: 'pointer',
          background: phase === 'go'
            ? 'linear-gradient(135deg, #4ade80, #22c55e)'
            : phase === 'ready'
            ? 'linear-gradient(135deg, #f87171, #ef4444)'
            : 'rgba(255,255,255,0.05)',
          border: '2px solid rgba(255,255,255,0.1)',
          transition: 'background 0.15s',
          userSelect: 'none',
        }}
      >
        {phase === 'wait' && (
          <>
            <div style={{ fontSize: 52 }}>⚡</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#e8e8f0' }}>
              {round === 0 ? 'Tryck för att starta' : 'Tryck för nästa omgång'}
            </div>
            {avg > 0 && <div style={{ fontSize: 14, color: '#888' }}>Snitt: {avg}ms</div>}
          </>
        )}
        {phase === 'ready' && (
          <>
            <div style={{ fontSize: 52 }}>🔴</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>Vänta...</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
              (Tryck INTE förrän det är grönt)
            </div>
          </>
        )}
        {phase === 'go' && (
          <>
            <div style={{ fontSize: 52 }}>🟢</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>TRYCK NU!</div>
          </>
        )}
        {phase === 'result' && (
          <>
            <div style={{ fontSize: 52 }}>⚡</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#fbbf24' }}>{ms}ms</div>
            <div style={{ fontSize: 14, color: '#888' }}>
              {ms < 200 ? '🏆 Otroligt snabbt!' : ms < 300 ? '🎯 Bra!' : ms < 400 ? '👍 OK' : '😅 Öva mer'}
            </div>
            <div style={{ fontSize: 14, color: '#a855f7', marginTop: 4 }}>
              {round >= 3 ? 'Klart! Belöning tillagd 🪙' : `Tryck för omgång ${round + 1}/3`}
            </div>
          </>
        )}
      </div>
    </div>
  )
})
