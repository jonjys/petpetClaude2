import { memo, useState, useCallback, useRef, useEffect } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const ROUNDS = 10

function makeQ(difficulty: number) {
  const targets = difficulty < 4 ? [5, 10] : difficulty < 7 ? [10, 20, 100] : [20, 50, 100]
  const target = targets[Math.floor(Math.random() * targets.length)]
  const given = 1 + Math.floor(Math.random() * (target - 1))
  const answer = target - given
  const wrong1 = answer + 1
  const wrong2 = Math.max(1, answer - 1)
  const wrong3 = answer + 2 + Math.floor(Math.random() * 3)
  const opts = [answer, wrong1, wrong2, wrong3]
    .filter((v, i, arr) => arr.indexOf(v) === i && v > 0 && v < target)
    .slice(0, 4)
  while (opts.length < 4) opts.push(opts[0] + opts.length + 1)
  return { target, given, answer, options: opts.sort(() => Math.random() - 0.5) }
}

export const NumberBondGame = memo(function NumberBondGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'play' | 'feedback' | 'done'>('ready')
  const [round, setRound] = useState(0)
  const [q, setQ] = useState(() => makeQ(0))
  const [score, setScore] = useState(0)
  const [wasCorrect, setWasCorrect] = useState(false)
  const [chosen, setChosen] = useState<number | null>(null)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_nbg_best') ?? 0))
  const scoreRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const nextRound = useCallback((r: number) => {
    if (r >= ROUNDS) {
      const s = scoreRef.current
      const prev = Number(localStorage.getItem('k0509_nbg_best') ?? 0)
      if (s > prev) localStorage.setItem('k0509_nbg_best', String(s))
      onWin(s * 19, s * 57)
      setPhase('done')
      audio.achievement()
      return
    }
    setQ(makeQ(Math.floor(r / 3)))
    setChosen(null)
    setRound(r)
    setPhase('play')
  }, [onWin])

  const start = useCallback(() => {
    scoreRef.current = 0
    setScore(0)
    nextRound(0)
  }, [nextRound])

  const answer = useCallback((val: number) => {
    if (phase !== 'play') return
    setChosen(val)
    const correct = val === q.answer
    setWasCorrect(correct)
    if (correct) { scoreRef.current++; setScore(scoreRef.current); audio.coin() } else { audio.click() }
    setPhase('feedback')
    timerRef.current = setTimeout(() => nextRound(round + 1), 1100)
  }, [phase, q, round, nextRound])

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🔢 Talbindning</span>
        <span className={styles.scoreDisplay}>{score}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🔢</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Talbindning</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Vad saknas för att nå målsumman? T.ex. "? + 4 = 10" → svar 6. {ROUNDS} ronder.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}/{ROUNDS}</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'play' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--t3)', textAlign: 'center' }}>Fråga {round + 1}/{ROUNDS}</div>
          <div style={{ background: 'rgba(255,255,255,.05)', borderRadius: 18, padding: '32px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 14, color: 'var(--t3)', marginBottom: 8 }}>Vad är ?</div>
            <div style={{ fontSize: 38, fontWeight: 900, color: '#fff', letterSpacing: 4 }}>
              ? + {q.given} = {q.target}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {q.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => answer(opt)}
                style={{
                  height: 64, borderRadius: 14, fontSize: 24, fontWeight: 900,
                  background: 'rgba(255,255,255,.08)', color: '#fff',
                  border: '2px solid rgba(255,255,255,.12)',
                  cursor: 'pointer',
                }}
              >{opt}</button>
            ))}
          </div>
        </div>
      )}

      {phase === 'feedback' && (
        <div style={{ padding: '32px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 52 }}>{wasCorrect ? '✅' : '❌'}</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>{q.answer} + {q.given} = {q.target}</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: wasCorrect ? '#4ade80' : '#f87171' }}>
            {wasCorrect ? 'Rätt!' : `Fel! Svaret är ${q.answer}`}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{score >= 8 ? '🏆' : score >= 6 ? '⭐' : '🔢'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{score} / {ROUNDS}</div>
          <div style={{ fontSize: 13, color: score >= 8 ? '#4ade80' : '#fbbf24' }}>
            {score === 10 ? 'PERFEKT! 🏆' : score >= 8 ? 'Utmärkt! ⭐' : score >= 6 ? 'Bra! 👍' : 'Öva mer! 🔢'}
          </div>
          {score > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{score * 19}🪙 +{score * 57} XP</div>
          <button className="btn-primary" style={{ padding: '14px 32px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
