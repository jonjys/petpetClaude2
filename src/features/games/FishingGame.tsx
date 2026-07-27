import { memo, useState, useRef, useCallback, useEffect } from 'react'
import { FISH_TYPES } from '@/constants/config'
import type { FishType } from '@/types/game'
import styles from './GamesView.module.css'

interface Props { onExit: () => void; onCatch: (fish: FishType, coins: number, xp: number) => void }

type Phase = 'idle' | 'casting' | 'waiting' | 'bite' | 'reel' | 'result'

function rollFish(): FishType {
  const r = Math.random()
  let acc = 0
  for (const f of FISH_TYPES) {
    acc += f.chance
    if (r < acc) return f
  }
  return FISH_TYPES[0]
}

function getRarityColor(r: FishType['rarity']) {
  return { common: '#888', uncommon: '#4ade80', rare: '#60a5fa', epic: '#a855f7', legendary: '#fbbf24' }[r]
}

export const FishingGame = memo(function FishingGame({ onExit, onCatch }: Props) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [barPos, setBarPos] = useState(50)
  const [targetPos, setTargetPos] = useState(30)
  const [hookPos, setHookPos] = useState(50)
  const [progress, setProgress] = useState(0)
  const [lastCatch, setLastCatch] = useState<FishType | null>(null)
  const [catches, setCatches] = useState(0)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const progressRef = useRef(0)
  const hookRef = useRef(50)
  const targetRef = useRef(30)

  const clear = () => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
    if (animRef.current) { clearInterval(animRef.current); animRef.current = null }
  }

  const cast = useCallback(() => {
    if (phase !== 'idle') return
    setPhase('casting')
    const t1 = setTimeout(() => {
      setPhase('waiting')
      const wait = 2000 + Math.random() * 4000
      const t2 = setTimeout(() => setPhase('bite'), wait)
      timersRef.current.push(t2)
    }, 1000)
    timersRef.current.push(t1)
  }, [phase])

  const reel = useCallback(() => {
    if (phase !== 'bite') return
    clear()
    setPhase('reel')
    progressRef.current = 0
    hookRef.current = 50
    targetRef.current = 30 + Math.random() * 40
    setHookPos(50); setTargetPos(targetRef.current); setProgress(0); setBarPos(50)

    animRef.current = setInterval(() => {
      targetRef.current += (Math.random() - 0.5) * 8
      targetRef.current = Math.min(90, Math.max(10, targetRef.current))
      setTargetPos(targetRef.current)

      const inZone = Math.abs(hookRef.current - targetRef.current) < 12
      progressRef.current = Math.min(100, Math.max(0, progressRef.current + (inZone ? 3 : -2)))
      setProgress(progressRef.current)

      if (progressRef.current >= 100) {
        if (animRef.current) clearInterval(animRef.current)
        const fish = rollFish()
        const w = fish.weight[0] + Math.random() * (fish.weight[1] - fish.weight[0])
        setLastCatch({ ...fish, weight: [w, w] as [number, number] })
        setCatches(c => c + 1)
        setPhase('result')
        onCatch(fish, fish.coins, fish.xp)
      }
      if (progressRef.current <= 0) {
        if (animRef.current) clearInterval(animRef.current)
        setPhase('idle')
      }
    }, 80)
  }, [phase, onCatch])

  const moveHook = useCallback((dir: number) => {
    hookRef.current = Math.min(90, Math.max(10, hookRef.current + dir * 12))
    setHookPos(hookRef.current)
  }, [])

  useEffect(() => () => clear(), [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={() => { clear(); onExit() }}>←</button>
        <span className={styles.gameTitle}>🎣 Fiske</span>
        <span className={styles.scoreDisplay}>{catches} fångade</span>
      </div>

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Water scene */}
        <div style={{ background: 'linear-gradient(180deg, rgba(96,165,250,0.1), rgba(30,58,138,0.3))', borderRadius: 16, padding: 20, minHeight: 140, position: 'relative', border: '1px solid rgba(96,165,250,0.2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          {phase === 'idle' && <button className="btn-primary" style={{ fontSize: 18, padding: '14px 32px' }} onClick={cast}>🎣 Kasta spöet!</button>}
          {phase === 'casting' && <div style={{ fontSize: 40, animation: 'bounce 0.5s infinite' }}>🎣</div>}
          {phase === 'waiting' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 36 }}>🏝️</div>
              <div style={{ color: '#60a5fa', fontSize: 14, marginTop: 8 }}>Väntar på napp...</div>
              <div style={{ fontSize: 24, marginTop: 4, animation: 'float 2s ease-in-out infinite' }}>〰️</div>
            </div>
          )}
          {phase === 'bite' && (
            <button onClick={reel} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, animation: 'shake 0.3s infinite' }}>
              <div style={{ fontSize: 48 }}>🔔</div>
              <div style={{ color: '#fbbf24', fontWeight: 700, fontSize: 18 }}>NAPP! TRYCK!</div>
            </button>
          )}
          {phase === 'result' && lastCatch && (
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{ fontSize: 52 }}>{lastCatch.emoji}</div>
              <div style={{ fontFamily: 'var(--ff-head)', fontSize: 20, fontWeight: 700, color: getRarityColor(lastCatch.rarity) }}>{lastCatch.name}!</div>
              <div style={{ fontSize: 13, color: '#888' }}>{lastCatch.weight[0].toFixed(1)}kg · {lastCatch.rarity}</div>
              <div style={{ display: 'flex', gap: 12, fontSize: 14 }}>
                <span style={{ color: '#fbbf24' }}>+{lastCatch.coins} 🪙</span>
                <span style={{ color: '#a855f7' }}>+{lastCatch.xp} XP</span>
              </div>
              <button className="btn-primary" style={{ marginTop: 8 }} onClick={() => setPhase('idle')}>Fiska igen!</button>
            </div>
          )}
        </div>

        {/* Reel minigame */}
        {phase === 'reel' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '12px 16px' }}>
              <div style={{ position: 'relative', height: 28, background: 'rgba(255,255,255,0.08)', borderRadius: 6, overflow: 'hidden' }}>
                {/* Target zone */}
                <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${Math.max(0, targetPos - 12)}%`, width: '24%', background: 'rgba(74,222,128,0.3)', borderRadius: 4 }} />
                {/* Hook */}
                <div style={{ position: 'absolute', top: 4, bottom: 4, left: `${hookPos}%`, width: 4, background: '#a855f7', borderRadius: 2, transform: 'translateX(-2px)', transition: 'left 0.05s' }} />
                <div style={{ position: 'absolute', top: '50%', left: `${hookPos}%`, transform: 'translate(-50%,-50%)', fontSize: 16 }}>🪝</div>
              </div>
            </div>
            {/* Progress */}
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 6 }}>
              <div style={{ height: 10, background: 'rgba(255,255,255,0.08)', borderRadius: 5, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg,#4ade80,#22c55e)', borderRadius: 5, transition: 'width 0.08s' }} />
              </div>
            </div>
            {/* Controls — hold to continuously move */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <HoldButton label="◀ Vänster" dir={-1} onMove={moveHook} style={{ ...dpad, flex: 1 }} />
              <HoldButton label="Höger ▶" dir={1} onMove={moveHook} style={{ ...dpad, flex: 1 }} />
            </div>
            <div style={{ textAlign: 'center', fontSize: 13, color: '#888' }}>Håll krokens i den gröna zonen!</div>
          </div>
        )}

        {/* Catch history */}
        {catches > 0 && phase !== 'reel' && (
          <div style={{ fontSize: 13, color: '#888', textAlign: 'center' }}>
            Totalt fångade: {catches} 🐟
          </div>
        )}
      </div>
    </div>
  )
})

const dpad: React.CSSProperties = { padding: '12px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#e8e8f0', fontSize: 14, cursor: 'pointer' }

const HoldButton = memo(function HoldButton({ label, dir, onMove, style }: {
  label: string; dir: number; onMove: (dir: number) => void; style: React.CSSProperties
}) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const start = () => {
    onMove(dir)
    intervalRef.current = setInterval(() => onMove(dir), 80)
  }
  const stop = () => { if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null } }
  useEffect(() => () => stop(), [])
  return (
    <button
      style={style}
      onPointerDown={start}
      onPointerUp={stop}
      onPointerLeave={stop}
    >{label}</button>
  )
})
