import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const ROUNDS = 10
const EMOJI_POOLS = [
  ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼'],
  ['🍎', '🍊', '🍋', '🍇', '🍓', '🍒', '🍑', '🥝'],
  ['⭐', '🌟', '✨', '💫', '🌙', '☀️', '🌤️', '⛅'],
  ['🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫', '⚪'],
  ['🎸', '🎹', '🎺', '🎻', '🥁', '🪘', '🎷', '🪗'],
]

function makeRound(round: number) {
  const gridSize = round < 4 ? 9 : round < 7 ? 12 : 16
  const pool = EMOJI_POOLS[Math.floor(Math.random() * EMOJI_POOLS.length)]
  const main = pool[Math.floor(Math.random() * pool.length)]
  let odd = pool[Math.floor(Math.random() * pool.length)]
  while (odd === main) odd = pool[Math.floor(Math.random() * pool.length)]
  const oddIdx = Math.floor(Math.random() * gridSize)
  const cells = Array.from({ length: gridSize }, (_, i) => i === oddIdx ? odd : main)
  const cols = round < 4 ? 3 : round < 7 ? 4 : 4
  return { cells, oddIdx, cols }
}

export const OddOneOutGame = memo(function OddOneOutGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [puzzle, setPuzzle] = useState<ReturnType<typeof makeRound> | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState(5)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_ooo_best') ?? 0))

  const nextRound = useCallback((r: number) => {
    setPuzzle(makeRound(r))
    setFeedback(null)
    setTimeLeft(5)
  }, [])

  const start = useCallback(() => {
    setRound(0); setScore(0); setStreak(0); setPhase('playing')
    nextRound(0)
  }, [nextRound])

  useEffect(() => {
    if (phase !== 'playing' || feedback !== null) return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          setFeedback('⏱ Timeout!')
          setStreak(0)
          audio.click()
          setTimeout(() => {
            const nextR = round + 1
            if (nextR >= ROUNDS) {
              const prev = Number(localStorage.getItem('k0509_ooo_best') ?? 0)
              if (score > prev) localStorage.setItem('k0509_ooo_best', String(score))
              onWin(Math.round(score / 5), score)
              setPhase('done')
            } else {
              setRound(nextR)
              nextRound(nextR)
            }
          }, 800)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase, round, feedback, score, nextRound, onWin])

  const handleCell = useCallback((idx: number) => {
    if (phase !== 'playing' || !puzzle || feedback !== null) return
    if (timerRef.current) clearInterval(timerRef.current)
    const correct = idx === puzzle.oddIdx
    if (correct) {
      const pts = (streak + 1) * 50 + timeLeft * 10
      const ns = streak + 1
      setScore(s => s + pts)
      setStreak(ns)
      setFeedback(`✅ +${pts}p${ns > 1 ? ` 🔥×${ns}` : ''}`)
      audio.coin()
    } else {
      setFeedback('❌ Fel!')
      setStreak(0)
      audio.tap()
    }
    setTimeout(() => {
      const nextR = round + 1
      if (nextR >= ROUNDS) {
        const finalScore = score + (correct ? (streak + 1) * 50 + timeLeft * 10 : 0)
        const prev = Number(localStorage.getItem('k0509_ooo_best') ?? 0)
        if (finalScore > prev) localStorage.setItem('k0509_ooo_best', String(finalScore))
        onWin(Math.round(finalScore / 5), finalScore)
        setPhase('done')
      } else {
        setRound(nextR)
        nextRound(nextR)
      }
    }, 700)
  }, [phase, puzzle, feedback, round, score, streak, timeLeft, nextRound, onWin])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🔍 Hitta Skillnaden</span>
        <span className={styles.scoreDisplay}>{score}p · {round}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🔍</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Hitta Skillnaden</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Hitta den emoji som skiljer sig från de andra!<br />Snabb = mer poäng. Streak ger bonus! ({ROUNDS} runder)
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}p</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {(phase === 'playing' || phase === 'done') && puzzle && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {phase === 'playing' && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 12, color: 'var(--t3)' }}>Runda {round + 1}/{ROUNDS}</div>
              <div style={{ display: 'flex', gap: 4 }}>
                {Array.from({ length: 5 }, (_, i) => (
                  <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: i < timeLeft ? '#4ade80' : 'rgba(255,255,255,.15)', transition: 'background .3s' }} />
                ))}
              </div>
              {streak > 1 && <div style={{ fontSize: 11, color: '#f59e0b', fontWeight: 700 }}>🔥 ×{streak}</div>}
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${puzzle.cols}, 1fr)`, gap: 6 }}>
            {puzzle.cells.map((cell, i) => (
              <button
                key={i}
                onClick={() => handleCell(i)}
                style={{
                  aspectRatio: '1',
                  fontSize: 22,
                  borderRadius: 10,
                  border: '1px solid rgba(255,255,255,.1)',
                  background: 'rgba(255,255,255,.05)',
                  cursor: 'pointer',
                  transition: 'transform .1s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {cell}
              </button>
            ))}
          </div>
          {feedback && (
            <div style={{ textAlign: 'center', fontSize: 15, fontWeight: 700, color: feedback.startsWith('✅') ? '#4ade80' : '#f87171' }}>
              {feedback}
            </div>
          )}
          {phase === 'done' && (
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', marginTop: 8 }}>
              <div style={{ fontWeight: 900, color: '#4ade80', fontSize: 16 }}>🎉 {score}p på {ROUNDS} runder!</div>
              <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Spela igen!</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
})
