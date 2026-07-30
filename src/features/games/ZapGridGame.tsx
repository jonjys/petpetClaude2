import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const GAME_DURATION = 30
const GRID_SIZE = 4
const ZAP_DURATION = 700
const SPAWN_INTERVAL = 900

const ZAP_EMOJI = ['⚡', '🌟', '💥', '🔥', '✨']

interface ZapCell {
  id: number
  idx: number
  emoji: string
  born: number
}

export const ZapGridGame = memo(function ZapGridGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [zaps, setZaps] = useState<ZapCell[]>([])
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION)
  const [score, setScore] = useState(0)
  const [misses, setMisses] = useState(0)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_zap_best') ?? 0))
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const spawnRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const expireRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const scoreRef = useRef(0)
  const zapIdRef = useRef(0)
  const zapsRef = useRef<ZapCell[]>([])

  const start = useCallback(() => {
    scoreRef.current = 0; setScore(0); setMisses(0)
    zapIdRef.current = 0; zapsRef.current = []
    setZaps([]); setTimeLeft(GAME_DURATION)
    setPhase('playing')

    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          if (spawnRef.current) clearInterval(spawnRef.current)
          if (expireRef.current) clearInterval(expireRef.current)
          const s = scoreRef.current
          const prev = Number(localStorage.getItem('k0509_zap_best') ?? 0)
          if (s > prev) localStorage.setItem('k0509_zap_best', String(s))
          if (s > 0) onWin(Math.round(s / 4), s * 8)
          setPhase('done')
          return 0
        }
        return t - 1
      })
    }, 1000)

    spawnRef.current = setInterval(() => {
      const count = 1 + Math.floor(Math.random() * 2)
      const occupied = new Set(zapsRef.current.map(z => z.idx))
      const available = Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => i).filter(i => !occupied.has(i))
      if (available.length === 0) return
      const chosen = available.sort(() => Math.random() - 0.5).slice(0, count)
      const newZaps = chosen.map(idx => ({
        id: zapIdRef.current++,
        idx,
        emoji: ZAP_EMOJI[Math.floor(Math.random() * ZAP_EMOJI.length)],
        born: Date.now(),
      }))
      zapsRef.current = [...zapsRef.current, ...newZaps]
      setZaps([...zapsRef.current])
    }, SPAWN_INTERVAL)

    expireRef.current = setInterval(() => {
      const now = Date.now()
      const expired = zapsRef.current.filter(z => now - z.born >= ZAP_DURATION)
      if (expired.length > 0) {
        setMisses(m => m + expired.length)
        zapsRef.current = zapsRef.current.filter(z => now - z.born < ZAP_DURATION)
        setZaps([...zapsRef.current])
      }
    }, 100)
  }, [onWin])

  const tapCell = useCallback((cellIdx: number) => {
    if (phase !== 'playing') return
    const zap = zapsRef.current.find(z => z.idx === cellIdx)
    if (zap) {
      audio.coin()
      scoreRef.current += 5; setScore(scoreRef.current)
      zapsRef.current = zapsRef.current.filter(z => z.id !== zap.id)
      setZaps([...zapsRef.current])
    }
  }, [phase])

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (spawnRef.current) clearInterval(spawnRef.current)
    if (expireRef.current) clearInterval(expireRef.current)
  }, [])

  const timerPct = (timeLeft / GAME_DURATION) * 100

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>⚡ Zap Grid</span>
        <span className={styles.scoreDisplay}>{score}p · {timeLeft}s</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>⚡</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Zap Grid</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Tryck på blixtar när de dyker upp i rutnätet! De försvinner snabbt. +5p per träff. 30 sekunder.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}p</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,.08)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${timerPct}%`, background: timerPct <= 33 ? '#f87171' : '#fbbf24', transition: 'width 1s linear' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`, gap: 6 }}>
            {Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, idx) => {
              const zap = zaps.find(z => z.idx === idx)
              return (
                <button
                  key={idx}
                  onClick={() => tapCell(idx)}
                  style={{
                    aspectRatio: '1', borderRadius: 12, fontSize: 28,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: zap ? 'rgba(251,191,36,.25)' : 'rgba(255,255,255,.05)',
                    border: `2px solid ${zap ? '#fbbf24' : 'rgba(255,255,255,.08)'}`,
                    cursor: 'pointer', transition: 'background .08s, border-color .08s',
                    boxShadow: zap ? '0 0 14px rgba(251,191,36,.4)' : 'none',
                  }}
                >{zap?.emoji ?? ''}</button>
              )
            })}
          </div>
          <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--t3)' }}>
            Missade: {misses}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <div style={{ fontWeight: 900, color: '#4ade80', fontSize: 20 }}>⚡ {score}p!</div>
          <div style={{ fontSize: 12, color: 'var(--t3)' }}>Missade: {misses}</div>
          <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
