import { memo, useState, useCallback, useRef, useEffect } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const ROUNDS = 8
const GRID = 5
const TIME_LIMIT = 30

function makeRound(round: number): { grid: string[]; targets: string[] } {
  const count = 4 + round
  const letters = Array.from({ length: count }, (_, i) =>
    String.fromCharCode(65 + i)
  )
  const allLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const fillers = Array.from({ length: GRID * GRID - count }, () =>
    allLetters[Math.floor(Math.random() * 26)]
  )
  const combined = [...letters, ...fillers]
  for (let i = combined.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[combined[i], combined[j]] = [combined[j], combined[i]]
  }
  return { grid: combined, targets: letters }
}

export const LetterGridGame = memo(function LetterGridGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'play' | 'feedback' | 'done'>('ready')
  const [round, setRound] = useState(0)
  const [grid, setGrid] = useState<string[]>([])
  const [targets, setTargets] = useState<string[]>([])
  const [nextIdx, setNextIdx] = useState(0)
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT)
  const [tapped, setTapped] = useState<Set<number>>(new Set())
  const [score, setScore] = useState(0)
  const [wasCorrect, setWasCorrect] = useState(false)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_lgg_best') ?? 0))
  const scoreRef = useRef(0)
  const nextIdxRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const toRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const endRound = useCallback((success: boolean, r: number) => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    setWasCorrect(success)
    if (success) { scoreRef.current++; setScore(scoreRef.current); audio.coin() } else { audio.click() }
    setPhase('feedback')
    const nextR = r + 1
    toRef.current = setTimeout(() => {
      if (nextR >= ROUNDS) {
        const s = scoreRef.current
        const prev = Number(localStorage.getItem('k0509_lgg_best') ?? 0)
        if (s > prev) localStorage.setItem('k0509_lgg_best', String(s))
        onWin(s * 24, s * 75)
        setPhase('done')
        audio.achievement()
      } else {
        const { grid: g, targets: t } = makeRound(nextR)
        setGrid(g); setTargets(t)
        setNextIdx(0); nextIdxRef.current = 0
        setTapped(new Set())
        setTimeLeft(TIME_LIMIT)
        setRound(nextR)
        setPhase('play')
      }
    }, 1100)
  }, [onWin])

  useEffect(() => {
    if (phase !== 'play') return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { endRound(false, round); return 0 }
        return t - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase, round, endRound])

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (toRef.current) clearTimeout(toRef.current)
  }, [])

  const start = useCallback(() => {
    scoreRef.current = 0
    setScore(0)
    const { grid: g, targets: t } = makeRound(0)
    setGrid(g); setTargets(t)
    setNextIdx(0); nextIdxRef.current = 0
    setTapped(new Set())
    setTimeLeft(TIME_LIMIT)
    setRound(0)
    setPhase('play')
  }, [])

  const tapCell = useCallback((idx: number, letter: string) => {
    if (phase !== 'play') return
    const expected = targets[nextIdxRef.current]
    if (letter !== expected) { audio.tap(); return }
    const newIdx = nextIdxRef.current + 1
    nextIdxRef.current = newIdx
    setNextIdx(newIdx)
    setTapped(prev => { const n = new Set(prev); n.add(idx); return n })
    audio.tap()
    if (newIdx === targets.length) endRound(true, round)
  }, [phase, targets, round, endRound])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🔤 Bokstavsgrid</span>
        <span className={styles.scoreDisplay}>{score}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🔤</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Bokstavsgrid</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Hitta och tryck bokstäverna A, B, C... i rätt ordning i 5×5-rutnätet innan tiden tar slut! 8 ronder.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}/{ROUNDS}</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'play' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--t3)' }}>Rond {round + 1}/{ROUNDS}</div>
            <div style={{ fontSize: 13, color: timeLeft <= 8 ? '#f87171' : '#4ade80', fontWeight: 900 }}>⏱ {timeLeft}s</div>
          </div>
          <div style={{ fontSize: 12, color: '#fbbf24', textAlign: 'center' }}>
            Nästa: <span style={{ fontWeight: 900, fontSize: 16 }}>{targets[nextIdx]}</span>
            <span style={{ color: 'var(--t3)', marginLeft: 8 }}>({nextIdx}/{targets.length})</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${GRID}, 1fr)`, gap: 6 }}>
            {grid.map((letter, i) => {
              const done = tapped.has(i)
              return (
                <button
                  key={i}
                  onClick={() => tapCell(i, letter)}
                  disabled={done}
                  style={{
                    height: 52, borderRadius: 10, fontSize: 16, fontWeight: 900,
                    background: done ? 'rgba(74,222,128,.2)' : 'rgba(255,255,255,.08)',
                    color: done ? '#4ade80' : '#fff',
                    border: done ? '1px solid rgba(74,222,128,.4)' : '1px solid rgba(255,255,255,.12)',
                    cursor: done ? 'default' : 'pointer',
                    transition: 'all .1s',
                  }}
                >{letter}</button>
              )
            })}
          </div>
        </div>
      )}

      {phase === 'feedback' && (
        <div style={{ padding: '32px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 52 }}>{wasCorrect ? '✅' : '❌'}</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: wasCorrect ? '#4ade80' : '#f87171' }}>
            {wasCorrect ? 'Alla bokstäver funna!' : 'Tiden tog slut!'}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{score >= 6 ? '🏆' : score >= 4 ? '⭐' : '🔤'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{score} / {ROUNDS}</div>
          <div style={{ fontSize: 13, color: score >= 6 ? '#4ade80' : '#fbbf24' }}>
            {score === 8 ? 'PERFEKT! 🏆' : score >= 6 ? 'Utmärkt! ⭐' : score >= 4 ? 'Bra! 👍' : 'Öva mer! 🔤'}
          </div>
          {score > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{score * 24}🪙 +{score * 75} XP</div>
          <button className="btn-primary" style={{ padding: '14px 32px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
