import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

interface Item {
  id: number
  x: number
  y: number
  val: string
  isLetter: boolean
  speed: number
}

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const BADS = ['💣', '☠️', '🔴', '❌', '⚡', '🌊', '🔥']
const DURATION = 30

let nid = 0

export const LetterChaosGame = memo(function LetterChaosGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [items, setItems] = useState<Item[]>([])
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [timeLeft, setTimeLeft] = useState(DURATION)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_lc_best') ?? 0))
  const scoreRef = useRef(0)
  const comboRef = useRef(0)
  const spawnRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const fallRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const spawnItem = useCallback((elapsed: number) => {
    const isLetter = Math.random() < 0.55
    const item: Item = {
      id: nid++,
      x: 5 + Math.random() * 80,
      y: -10,
      val: isLetter ? LETTERS[Math.floor(Math.random() * LETTERS.length)] : BADS[Math.floor(Math.random() * BADS.length)],
      isLetter,
      speed: 1.5 + Math.random() * 1.5 + elapsed * 0.03,
    }
    setItems(prev => [...prev.slice(-20), item])
    setTimeout(() => setItems(prev => prev.filter(i => i.id !== item.id)), 4000)
  }, [])

  const finalize = useCallback((s: number) => {
    const prev = Number(localStorage.getItem('k0509_lc_best') ?? 0)
    if (s > prev) localStorage.setItem('k0509_lc_best', String(s))
    if (s > 0) onWin(Math.round(s / 5), s)
    setPhase('done')
  }, [onWin])

  const start = useCallback(() => {
    setScore(0); setCombo(0); setItems([]); setTimeLeft(DURATION)
    scoreRef.current = 0; comboRef.current = 0
    setPhase('playing')
    let elapsed = 0
    spawnRef.current = setInterval(() => { elapsed++; spawnItem(elapsed) }, 700)
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          if (spawnRef.current) clearInterval(spawnRef.current)
          if (timerRef.current) clearInterval(timerRef.current)
          if (fallRef.current) clearInterval(fallRef.current)
          finalize(scoreRef.current); return 0
        }
        return t - 1
      })
    }, 1000)
    fallRef.current = setInterval(() => {
      setItems(prev => prev.map(i => ({ ...i, y: i.y + i.speed })).filter(i => i.y < 110))
    }, 50)
  }, [spawnItem, finalize])

  useEffect(() => () => {
    if (spawnRef.current) clearInterval(spawnRef.current)
    if (timerRef.current) clearInterval(timerRef.current)
    if (fallRef.current) clearInterval(fallRef.current)
  }, [])

  const tap = useCallback((item: Item) => {
    setItems(prev => prev.filter(i => i.id !== item.id))
    if (item.isLetter) {
      comboRef.current += 1; setCombo(comboRef.current)
      const pts = 10 * Math.max(1, comboRef.current)
      scoreRef.current += pts; setScore(s => s + pts)
      audio.coin()
    } else {
      comboRef.current = 0; setCombo(0)
      scoreRef.current = Math.max(0, scoreRef.current - 20)
      setScore(s => Math.max(0, s - 20))
      audio.tap()
    }
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🔤 Bokstavkaos</span>
        <span className={styles.scoreDisplay}>{score}p · {timeLeft}s</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🔤</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Bokstavkaos</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Bokstäver och bomber faller — tryck BARA på bokstäver! Combo ger bonuspoäng. Undvik bomber (-20p). 30 sekunder.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}p</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {(phase === 'playing' || phase === 'done') && (
        <div style={{ padding: '0 14px' }}>
          {combo > 2 && <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#fbbf24', marginBottom: 4 }}>🔥 COMBO ×{combo}</div>}
          <div style={{ position: 'relative', height: 300, background: 'rgba(0,10,20,.9)', border: '2px solid rgba(255,255,255,.08)', borderRadius: 14, overflow: 'hidden' }}>
            {items.map(item => (
              <button
                key={item.id}
                onClick={() => tap(item)}
                style={{
                  position: 'absolute',
                  left: `${item.x}%`,
                  top: `${item.y}%`,
                  transform: 'translate(-50%,-50%)',
                  background: item.isLetter ? 'rgba(96,165,250,.15)' : 'none',
                  border: item.isLetter ? '2px solid rgba(96,165,250,.4)' : 'none',
                  borderRadius: item.isLetter ? 8 : 0,
                  color: item.isLetter ? '#60a5fa' : undefined,
                  fontSize: item.isLetter ? 22 : 26,
                  fontWeight: 900,
                  cursor: 'pointer',
                  padding: item.isLetter ? '4px 8px' : '2px',
                  lineHeight: 1,
                  fontFamily: 'var(--ff-head)',
                }}
              >
                {item.val}
              </button>
            ))}
            {phase === 'done' && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.7)' }}>
                <div style={{ fontWeight: 900, color: '#4ade80', fontSize: 18 }}>🔤 {score}p!</div>
                <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Spela igen!</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
})
