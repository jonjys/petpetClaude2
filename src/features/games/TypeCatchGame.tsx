import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const GAME_DURATION = 35
const FALL_SPEED_BASE = 2.5
const SPAWN_INTERVAL = 1100
const CONTAINER_H = 200

interface FallingLetter {
  id: number
  letter: string
  x: number
  y: number
  color: string
}

const COLORS = ['#f87171', '#60a5fa', '#4ade80', '#fbbf24', '#c084fc', '#f97316']
const LETTERS = 'ABCDEFGHIJKLMNOPRSTUVWXYZ'

function pickButtons(active: string[]): string[] {
  const set = new Set(active)
  const base = Array.from(set).slice(0, 4)
  while (base.length < 6) {
    const l = LETTERS[Math.floor(Math.random() * LETTERS.length)]
    if (!base.includes(l)) base.push(l)
  }
  return base.sort(() => Math.random() - 0.5)
}

export const TypeCatchGame = memo(function TypeCatchGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [letters, setLetters] = useState<FallingLetter[]>([])
  const [buttons, setButtons] = useState<string[]>([])
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION)
  const [score, setScore] = useState(0)
  const [missed, setMissed] = useState(0)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_tc_best') ?? 0))
  const lettersRef = useRef<FallingLetter[]>([])
  const idRef = useRef(0)
  const scoreRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const spawnRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const frameRef = useRef<number>(0)
  const lastFrameRef = useRef(0)

  const stopAll = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (spawnRef.current) clearInterval(spawnRef.current)
    cancelAnimationFrame(frameRef.current)
  }, [])

  const animate = useCallback((ts: number) => {
    const dt = ts - lastFrameRef.current
    lastFrameRef.current = ts
    if (dt > 200) { frameRef.current = requestAnimationFrame(animate); return }
    const speed = FALL_SPEED_BASE * (dt / 16)
    const escaped: FallingLetter[] = []
    lettersRef.current = lettersRef.current.map(l => {
      const ny = l.y + speed
      if (ny >= CONTAINER_H) { escaped.push(l); return { ...l, y: ny } }
      return { ...l, y: ny }
    }).filter(l => l.y < CONTAINER_H)
    if (escaped.length > 0) setMissed(m => m + escaped.length)
    setLetters([...lettersRef.current])
    setButtons(pickButtons(lettersRef.current.map(l => l.letter)))
    frameRef.current = requestAnimationFrame(animate)
  }, [])

  const start = useCallback(() => {
    scoreRef.current = 0; setScore(0); setMissed(0)
    lettersRef.current = []; idRef.current = 0
    setLetters([]); setTimeLeft(GAME_DURATION); setPhase('playing')

    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          stopAll()
          const s = scoreRef.current
          const prev = Number(localStorage.getItem('k0509_tc_best') ?? 0)
          if (s > prev) localStorage.setItem('k0509_tc_best', String(s))
          if (s > 0) onWin(Math.round(s * 2), s * 12)
          setPhase('done')
          return 0
        }
        return t - 1
      })
    }, 1000)

    spawnRef.current = setInterval(() => {
      const letter = LETTERS[Math.floor(Math.random() * LETTERS.length)]
      const newL: FallingLetter = {
        id: idRef.current++,
        letter,
        x: 10 + Math.random() * 78,
        y: 0,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      }
      lettersRef.current = [...lettersRef.current, newL]
    }, SPAWN_INTERVAL)

    lastFrameRef.current = performance.now()
    frameRef.current = requestAnimationFrame(animate)
  }, [onWin, stopAll, animate])

  const catchLetter = useCallback((letter: string) => {
    if (phase !== 'playing') return
    const idx = lettersRef.current.findIndex(l => l.letter === letter)
    if (idx === -1) return
    audio.coin()
    scoreRef.current++; setScore(scoreRef.current)
    lettersRef.current = lettersRef.current.filter((_, i) => i !== idx)
    setLetters([...lettersRef.current])
  }, [phase])

  useEffect(() => () => stopAll(), [stopAll])

  const timerPct = (timeLeft / GAME_DURATION) * 100

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🔤 Bokstavsjakten</span>
        <span className={styles.scoreDisplay}>{score}p · {timeLeft}s</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🔤</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Bokstavsjakten</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Bokstäver faller från toppen! Tryck rätt knapp för att fånga dem innan de landar. 35 sekunder.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}p</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,.08)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${timerPct}%`, background: timerPct <= 30 ? '#f87171' : '#60a5fa', transition: 'width 1s linear' }} />
          </div>
          <div style={{ position: 'relative', height: CONTAINER_H, background: 'rgba(255,255,255,.04)', borderRadius: 12, border: '1px solid rgba(255,255,255,.08)', overflow: 'hidden' }}>
            {letters.map(l => (
              <div key={l.id} style={{
                position: 'absolute', left: `${l.x}%`, top: l.y,
                fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900,
                color: l.color, transform: 'translateX(-50%)',
                textShadow: `0 0 8px ${l.color}`,
                pointerEvents: 'none',
              }}>{l.letter}</div>
            ))}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: 'rgba(248,113,113,.4)' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {buttons.map(b => (
              <button key={b} onClick={() => catchLetter(b)} style={{
                padding: '14px 0', borderRadius: 12,
                fontFamily: 'var(--ff-head)', fontSize: 20, fontWeight: 900,
                background: lettersRef.current.some(l => l.letter === b) ? 'rgba(96,165,250,.2)' : 'rgba(255,255,255,.05)',
                border: `2px solid ${lettersRef.current.some(l => l.letter === b) ? '#60a5fa' : 'rgba(255,255,255,.1)'}`,
                color: lettersRef.current.some(l => l.letter === b) ? '#60a5fa' : 'var(--t3)',
                cursor: 'pointer', transition: 'all .1s',
              }}>{b}</button>
            ))}
          </div>
          <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--t3)' }}>Missade: {missed}</div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <div style={{ fontWeight: 900, color: '#4ade80', fontSize: 20 }}>🔤 {score} bokstäver!</div>
          <div style={{ fontSize: 12, color: 'var(--t3)' }}>Missade: {missed}</div>
          <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
