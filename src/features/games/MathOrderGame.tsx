import { memo, useState, useCallback, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const ROUNDS = 10

function getNumbers(round: number): number[] {
  const count = Math.min(4 + Math.floor(round / 2), 8)
  const nums = new Set<number>()
  while (nums.size < count) nums.add(Math.floor(Math.random() * (20 + round * 4)) + 1)
  return Array.from(nums).sort(() => Math.random() - 0.5)
}

export const MathOrderGame = memo(function MathOrderGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'play' | 'feedback' | 'done'>('ready')
  const [round, setRound] = useState(0)
  const [numbers, setNumbers] = useState<number[]>([])
  const [tapped, setTapped] = useState<number[]>([])
  const [score, setScore] = useState(0)
  const [wasCorrect, setWasCorrect] = useState(false)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_mog_best') ?? 0))
  const scoreRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const nextRound = useCallback((r: number) => {
    if (r >= ROUNDS) {
      const s = scoreRef.current
      const prev = Number(localStorage.getItem('k0509_mog_best') ?? 0)
      if (s > prev) localStorage.setItem('k0509_mog_best', String(s))
      onWin(s * 18, s * 55)
      setPhase('done')
      audio.achievement()
      return
    }
    setNumbers(getNumbers(r))
    setTapped([])
    setRound(r)
    setPhase('play')
  }, [onWin])

  const start = useCallback(() => {
    scoreRef.current = 0
    setScore(0)
    nextRound(0)
  }, [nextRound])

  const tapNumber = useCallback((n: number) => {
    setTapped(prev => {
      const next = [...prev, n]
      const sorted = [...numbers].sort((a, b) => a - b)
      if (next[next.length - 1] !== sorted[next.length - 1]) {
        setWasCorrect(false)
        setPhase('feedback')
        audio.click()
        timerRef.current = setTimeout(() => nextRound(round + 1), 900)
        return prev
      }
      if (next.length === numbers.length) {
        scoreRef.current++
        setScore(scoreRef.current)
        setWasCorrect(true)
        setPhase('feedback')
        audio.coin()
        timerRef.current = setTimeout(() => nextRound(round + 1), 900)
      }
      return next
    })
  }, [numbers, round, nextRound])

  const sorted = [...numbers].sort((a, b) => a - b)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🔢 Nummerordning</span>
        <span className={styles.scoreDisplay}>{score}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🔢</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Nummerordning</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Tryck på siffrorna från minst till störst! Fler siffror varje runda. 10 ronder.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}/{ROUNDS}</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'play' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--t3)', textAlign: 'center' }}>
            Tryck minst → störst ({round + 1}/{ROUNDS}) · {tapped.length}/{numbers.length}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
            {numbers.map((n, i) => {
              const done = tapped.includes(n)
              return (
                <button
                  key={i}
                  onClick={() => !done && tapNumber(n)}
                  style={{
                    width: 60, height: 60, borderRadius: 14,
                    fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900,
                    color: done ? 'rgba(255,255,255,.3)' : '#fff',
                    background: done ? 'rgba(255,255,255,.04)' : 'rgba(255,255,255,.1)',
                    border: done ? '2px solid rgba(255,255,255,.06)' : '2px solid rgba(255,255,255,.2)',
                    cursor: done ? 'default' : 'pointer',
                    transition: 'all .12s',
                  }}
                >
                  {n}
                </button>
              )
            })}
          </div>
          <div style={{ fontSize: 10, color: 'var(--t3)', textAlign: 'center' }}>
            Nästa: {tapped.length < sorted.length ? sorted[tapped.length] : '—'}
          </div>
        </div>
      )}

      {phase === 'feedback' && (
        <div style={{ padding: '32px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 52 }}>{wasCorrect ? '✅' : '❌'}</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: wasCorrect ? '#4ade80' : '#f87171' }}>
            {wasCorrect ? 'Perfekt ordning!' : `Fel! Rätt ordning: ${sorted.join(' → ')}`}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{score >= 9 ? '🏆' : score >= 6 ? '⭐' : '🔢'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{score} / {ROUNDS}</div>
          <div style={{ fontSize: 13, color: score >= 9 ? '#4ade80' : '#fbbf24' }}>
            {score === 10 ? 'PERFEKT! 🏆' : score >= 8 ? 'Utmärkt! ⭐' : score >= 6 ? 'Bra! 👍' : 'Öva mer! 🔢'}
          </div>
          {score > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{score * 18}🪙 +{score * 55} XP</div>
          <button className="btn-primary" style={{ padding: '14px 32px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
