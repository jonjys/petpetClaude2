import { memo, useState, useEffect, useCallback, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const GRID_SIZE = 9
const GAME_TIME = 30
const HOLE_ACTIVE_MS = 800
const HOLE_INTERVAL_MS = 600

const MOLES = [
  { emoji: '🐹', points: 1, color: '#fbbf24' },
  { emoji: '💣', points: -2, color: '#f87171' },
  { emoji: '⭐', points: 3, color: '#a855f7' },
  { emoji: '🌸', points: 2, color: '#f472b6' },
]

export const WhackMoleGame = memo(function WhackMoleGame({ onExit, onWin }: Props) {
  const [holes, setHoles] = useState<(number | null)[]>(Array(GRID_SIZE).fill(null))
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_TIME)
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [whacked, setWhacked] = useState<Record<number, string>>({})
  const [combo, setCombo] = useState(0)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_whack_best') ?? 0))
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const moleRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const holeTimers = useRef<ReturnType<typeof setTimeout>[]>([])

  const clearAll = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (moleRef.current) clearInterval(moleRef.current)
    holeTimers.current.forEach(clearTimeout)
    holeTimers.current = []
  }, [])

  const start = useCallback(() => {
    setScore(0); setTimeLeft(GAME_TIME); setHoles(Array(GRID_SIZE).fill(null))
    setWhacked({}); setCombo(0); setPhase('playing')
  }, [])

  useEffect(() => {
    if (phase !== 'playing') return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          setPhase('done')
          clearAll()
          return 0
        }
        return t - 1
      })
    }, 1000)
    moleRef.current = setInterval(() => {
      const emptyHoles = Array.from({ length: GRID_SIZE }, (_, i) => i).filter(i => true)
      const idx = emptyHoles[Math.floor(Math.random() * emptyHoles.length)]
      const mole = MOLES[Math.floor(Math.random() * MOLES.length)]
      setHoles(prev => {
        if (prev[idx] !== null) return prev
        const next = [...prev]
        next[idx] = MOLES.indexOf(mole)
        return next
      })
      const t = setTimeout(() => {
        setHoles(prev => {
          const next = [...prev]
          if (next[idx] === MOLES.indexOf(mole)) next[idx] = null
          return next
        })
      }, HOLE_ACTIVE_MS)
      holeTimers.current.push(t)
    }, HOLE_INTERVAL_MS)
    return clearAll
  }, [phase, clearAll])

  useEffect(() => {
    if (phase === 'done') {
      const prev = Number(localStorage.getItem('k0509_whack_best') ?? 0)
      if (score > prev) localStorage.setItem('k0509_whack_best', String(score))
      const coins = Math.max(0, score * 3)
      const xp = Math.max(0, score * 4)
      onWin(coins, xp)
      audio.achievement()
    }
  }, [phase, score, onWin])

  const whack = useCallback((idx: number) => {
    if (phase !== 'playing' || holes[idx] === null) return
    const moleIdx = holes[idx] as number
    const mole = MOLES[moleIdx]
    const isGood = mole.points > 0
    const newCombo = isGood ? combo + 1 : 0
    setCombo(newCombo)
    const comboMult = newCombo >= 5 ? 2 : newCombo >= 3 ? 1.5 : 1
    const pts = isGood ? Math.ceil(mole.points * comboMult) : mole.points
    setScore(s => Math.max(0, s + pts))
    setWhacked(prev => ({ ...prev, [idx]: mole.emoji }))
    setHoles(prev => { const next = [...prev]; next[idx] = null; return next })
    audio.coin()
    setTimeout(() => setWhacked(prev => { const next = { ...prev }; delete next[idx]; return next }), 300)
  }, [phase, holes, combo])

  const timerColor = timeLeft > 15 ? '#4ade80' : timeLeft > 7 ? '#fbbf24' : '#f87171'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={() => { clearAll(); onExit() }}>←</button>
        <span className={styles.gameTitle}>🐹 Hamra</span>
        <span className={styles.scoreDisplay}>{score} poäng</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🐹</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Hamra Mullvaden!</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260 }}>
            Tryck på 🐹+⭐+🌸 men undvik 💣 i {GAME_TIME} sekunder!
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore} poäng</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {(phase === 'playing' || phase === 'done') && (
        <>
          {/* Timer bar */}
          <div style={{ padding: '0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: timerColor, fontFamily: 'var(--ff-head)', minWidth: 28 }}>{timeLeft}</div>
            <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,.1)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(timeLeft / GAME_TIME) * 100}%`, background: timerColor, borderRadius: 3, transition: 'width 1s linear, background .5s' }} />
            </div>
            {combo >= 3 && <div style={{ fontSize: 11, color: '#fbbf24', fontWeight: 900 }}>🔥{combo}x</div>}
          </div>

          {/* Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, padding: '0 16px' }}>
            {Array.from({ length: GRID_SIZE }, (_, i) => {
              const moleIdx = holes[i]
              const mole = moleIdx !== null ? MOLES[moleIdx] : null
              const isWhacked = whacked[i]
              return (
                <button
                  key={i}
                  onClick={() => whack(i)}
                  style={{
                    aspectRatio: '1', borderRadius: 16,
                    background: mole ? `rgba(${mole.color.replace('#','').match(/../g)?.map(h=>parseInt(h,16)).join(',')},.15)` : 'rgba(255,255,255,.04)',
                    border: `2px solid ${mole ? mole.color + '55' : 'rgba(255,255,255,.08)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 36, cursor: 'pointer',
                    transform: mole ? 'scale(1.05)' : 'scale(1)',
                    transition: 'all .1s',
                  }}
                >
                  {isWhacked ? (
                    <span style={{ fontSize: 20, opacity: 0.6 }}>{isWhacked}</span>
                  ) : (
                    mole ? mole.emoji : ''
                  )}
                </button>
              )
            })}
          </div>

          <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--t3)', paddingBottom: 4 }}>
            🐹+1 · ⭐+3 · 🌸+2 · 💣-2
          </div>
        </>
      )}

      {phase === 'done' && (
        <div style={{ padding: '16px', textAlign: 'center', background: 'rgba(74,222,128,.08)', borderRadius: 16, margin: '0 16px', border: '1px solid rgba(74,222,128,.25)' }}>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 20, fontWeight: 900, color: '#4ade80' }}>Klart!</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#fbbf24', marginTop: 4 }}>{score} poäng</div>
          {score > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24', marginTop: 6 }}>+{Math.max(0, score * 3)}🪙 +{Math.max(0, score * 4)} XP</div>
          <button className="btn-primary" style={{ marginTop: 10, padding: '12px 28px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
