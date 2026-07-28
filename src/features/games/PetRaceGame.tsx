import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
  petEmoji?: string
}

const TRACKS = 4
const TRACK_LEN = 100
const FINISH = 100

type Racer = { name: string; emoji: string; pos: number; speed: number; boost: number }

function makeRacers(petEmoji: string): Racer[] {
  return [
    { name: 'Du',        emoji: petEmoji, pos: 0, speed: 0, boost: 0 },
    { name: 'StarWolf',  emoji: '🐺',    pos: 0, speed: 0, boost: 0 },
    { name: 'FoxFlash',  emoji: '🦊',    pos: 0, speed: 0, boost: 0 },
    { name: 'TigerMax',  emoji: '🐯',    pos: 0, speed: 0, boost: 0 },
  ]
}

export const PetRaceGame = memo(function PetRaceGame({ onExit, onWin, petEmoji = '🐾' }: Props) {
  const [phase, setPhase] = useState<'ready' | 'racing' | 'done'>('ready')
  const [racers, setRacers] = useState<Racer[]>([])
  const [taps, setTaps] = useState(0)
  const [rank, setRank] = useState(0)
  const [countdown, setCountdown] = useState(3)
  const [bestRank] = useState(() => Number(localStorage.getItem('k0509_race_best') ?? 4))
  const frameRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const countRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const tapRef = useRef(0)

  const start = useCallback(() => {
    setRacers(makeRacers(petEmoji)); setTaps(0); tapRef.current = 0; setCountdown(3)
    setPhase('racing')
  }, [petEmoji])

  useEffect(() => {
    if (phase !== 'racing') return
    countRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(countRef.current!); return 0 }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(countRef.current!)
  }, [phase])

  useEffect(() => {
    if (phase !== 'racing' || countdown > 0) return
    frameRef.current = setInterval(() => {
      setRacers(prev => {
        const next = prev.map((r, i) => {
          if (r.pos >= FINISH) return r
          const base = i === 0 ? tapRef.current * 0.8 : 1.5 + Math.random() * 1.5
          const newPos = Math.min(r.pos + base * 0.4, FINISH)
          return { ...r, pos: newPos, speed: base }
        })
        tapRef.current = Math.max(0, tapRef.current - 1)
        const allDone = next.filter(r => r.pos >= FINISH)
        if (allDone.length >= TRACKS) {
          clearInterval(frameRef.current!)
          const sorted = [...next].sort((a, b) => b.pos - a.pos)
          const playerRank = sorted.findIndex(r => r.name === 'Du') + 1
          setRank(playerRank)
          setPhase('done')
          const prev = Number(localStorage.getItem('k0509_race_best') ?? 4)
          if (playerRank < prev) localStorage.setItem('k0509_race_best', String(playerRank))
          const coins = playerRank === 1 ? 400 : playerRank === 2 ? 250 : playerRank === 3 ? 120 : 50
          onWin(coins, coins)
          audio.achievement()
        }
        return next
      })
    }, 100)
    return () => clearInterval(frameRef.current!)
  }, [phase, countdown, onWin])

  const tap = useCallback(() => {
    if (phase !== 'racing' || countdown > 0) return
    tapRef.current = Math.min(tapRef.current + 3, 10)
    setTaps(t => t + 1)
    audio.tap()
  }, [phase, countdown])

  const sortedRacers = [...racers].sort((a, b) => b.pos - a.pos)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🏁 Husdjursrace</span>
        <span className={styles.scoreDisplay}>{taps} tryck</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🏁</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Husdjursrace</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Tryck snabbt för att accelerera!<br />{TRACKS} racers · Kom etta för maxbelöning
          </div>
          {bestRank < 4 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestRank}:a plats</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta race!</button>
        </div>
      )}

      {phase === 'racing' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {countdown > 0 && (
            <div style={{ textAlign: 'center', fontFamily: 'var(--ff-head)', fontSize: 52, fontWeight: 900, color: '#fbbf24' }}>{countdown}</div>
          )}
          {racers.map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--t3)', minWidth: 20 }}>
                {sortedRacers.findIndex(s => s.name === r.name) + 1}
              </div>
              <div style={{ flex: 1, height: 32, background: 'rgba(255,255,255,.04)', borderRadius: 16, overflow: 'hidden', position: 'relative', border: '1px solid rgba(255,255,255,.08)' }}>
                <div style={{ position: 'absolute', left: `${Math.min(r.pos, 95)}%`, top: '50%', transform: 'translateY(-50%)', fontSize: 20, transition: 'left .1s linear' }}>
                  {r.emoji}
                </div>
              </div>
              <div style={{ fontSize: 10, color: r.name === 'Du' ? '#818cf8' : 'var(--t3)', minWidth: 16 }}>{Math.round(r.pos)}%</div>
            </div>
          ))}
          {countdown === 0 && (
            <button onPointerDown={tap} style={{
              padding: '20px', borderRadius: 16, fontSize: 18, fontWeight: 900,
              background: 'rgba(74,222,128,.15)', border: '2px solid rgba(74,222,128,.4)',
              color: '#4ade80', cursor: 'pointer', marginTop: 8,
            }}>
              👟 TRYCK SNABBT!
            </button>
          )}
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{rank === 1 ? '🏆' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '🏁'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{rank}:a plats!</div>
          <div style={{ fontSize: 14, color: rank === 1 ? '#4ade80' : rank <= 2 ? '#fbbf24' : '#888' }}>
            {rank === 1 ? 'Racemästare! 🏆' : rank === 2 ? 'Silvermössa! 🥈' : rank === 3 ? 'Bronsracer! 🥉' : 'Öva mer! 🏁'}
          </div>
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{rank === 1 ? 400 : rank === 2 ? 250 : rank === 3 ? 120 : 50}🪙</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
            {[...racers].sort((a, b) => b.pos - a.pos).map((r, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, padding: '6px 12px', background: r.name === 'Du' ? 'rgba(99,102,241,.1)' : 'rgba(255,255,255,.03)', borderRadius: 10, alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--t3)', minWidth: 20 }}>#{i+1}</span>
                <span style={{ fontSize: 18 }}>{r.emoji}</span>
                <span style={{ fontSize: 13, color: r.name === 'Du' ? '#818cf8' : '#888' }}>{r.name}</span>
              </div>
            ))}
          </div>
          <button className="btn-primary" style={{ padding: '12px 28px' }} onClick={start}>Race igen!</button>
        </div>
      )}
    </div>
  )
})
