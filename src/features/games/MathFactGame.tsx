import { memo, useState, useCallback, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const ROUNDS = 10

type Fact = { expr: string; stated: number; answer: number; correct: boolean }

function makeFact(difficulty: number): Fact {
  const ops = difficulty < 4 ? ['+', '-'] : ['+', '-', '×']
  const op = ops[Math.floor(Math.random() * ops.length)]
  let a: number, b: number, answer: number

  if (op === '+') {
    const max = difficulty < 4 ? 20 : 50
    a = 1 + Math.floor(Math.random() * max)
    b = 1 + Math.floor(Math.random() * max)
    answer = a + b
  } else if (op === '-') {
    const max = difficulty < 4 ? 20 : 50
    b = 1 + Math.floor(Math.random() * (max / 2))
    a = b + 1 + Math.floor(Math.random() * (max / 2))
    answer = a - b
  } else {
    const maxA = difficulty < 7 ? 9 : 12
    a = 2 + Math.floor(Math.random() * (maxA - 2))
    b = 2 + Math.floor(Math.random() * 8)
    answer = a * b
  }

  const isCorrect = Math.random() < 0.5
  const offset = isCorrect ? 0 : (Math.random() < 0.5 ? 1 : -1) * (1 + Math.floor(Math.random() * 3))
  const stated = answer + offset
  const expr = `${a} ${op} ${b} = ${stated}`
  return { expr, stated, answer, correct: isCorrect }
}

export const MathFactGame = memo(function MathFactGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'play' | 'feedback' | 'done'>('ready')
  const [round, setRound] = useState(0)
  const [fact, setFact] = useState<Fact>(() => makeFact(0))
  const [score, setScore] = useState(0)
  const [wasCorrect, setWasCorrect] = useState(false)
  const [userSaidTrue, setUserSaidTrue] = useState(false)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_mfg_best') ?? 0))
  const scoreRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const nextRound = useCallback((r: number) => {
    if (r >= ROUNDS) {
      const s = scoreRef.current
      const prev = Number(localStorage.getItem('k0509_mfg_best') ?? 0)
      if (s > prev) localStorage.setItem('k0509_mfg_best', String(s))
      onWin(s * 22, s * 65)
      setPhase('done')
      audio.achievement()
      return
    }
    setFact(makeFact(Math.floor(r / 3)))
    setRound(r)
    setPhase('play')
  }, [onWin])

  const answer = useCallback((saidTrue: boolean) => {
    if (phase !== 'play') return
    const correct = saidTrue === fact.correct
    setUserSaidTrue(saidTrue)
    setWasCorrect(correct)
    if (correct) { scoreRef.current++; setScore(scoreRef.current); audio.coin() } else { audio.click() }
    setPhase('feedback')
    timerRef.current = setTimeout(() => nextRound(round + 1), 1200)
  }, [phase, fact, round, nextRound])

  const start = useCallback(() => {
    scoreRef.current = 0
    setScore(0)
    nextRound(0)
  }, [nextRound])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🧮 Mattafakta</span>
        <span className={styles.scoreDisplay}>{score}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🧮</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Mattafakta</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Är uträkningen korrekt? Svara SANT eller FALSKT! {ROUNDS} ronder. Svårigheten ökar.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}/{ROUNDS}</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'play' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ fontSize: 11, color: 'var(--t3)', textAlign: 'center' }}>Runda {round + 1}/{ROUNDS}</div>
          <div style={{ background: 'rgba(255,255,255,.05)', borderRadius: 18, padding: '36px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 32, fontWeight: 900, color: '#fff', letterSpacing: 2 }}>
              {fact.expr}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <button
              onClick={() => answer(true)}
              style={{
                height: 70, borderRadius: 16, fontSize: 18, fontWeight: 900,
                background: 'rgba(74,222,128,.12)', color: '#4ade80',
                border: '2px solid rgba(74,222,128,.35)',
                cursor: 'pointer',
              }}
            >✓ SANT</button>
            <button
              onClick={() => answer(false)}
              style={{
                height: 70, borderRadius: 16, fontSize: 18, fontWeight: 900,
                background: 'rgba(248,113,113,.12)', color: '#f87171',
                border: '2px solid rgba(248,113,113,.35)',
                cursor: 'pointer',
              }}
            >✗ FALSKT</button>
          </div>
        </div>
      )}

      {phase === 'feedback' && (
        <div style={{ padding: '32px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 52 }}>{wasCorrect ? '✅' : '❌'}</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>{fact.expr}</div>
          <div style={{ fontSize: 13, color: 'var(--t3)' }}>
            Rätt svar: {fact.answer} → Påståendet är {fact.correct ? 'SANT' : 'FALSKT'}
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: wasCorrect ? '#4ade80' : '#f87171' }}>
            {wasCorrect ? 'Rätt! 🎯' : `Fel! Du sade ${userSaidTrue ? 'SANT' : 'FALSKT'}`}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{score >= 8 ? '🏆' : score >= 6 ? '⭐' : '🧮'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{score} / {ROUNDS}</div>
          <div style={{ fontSize: 13, color: score >= 8 ? '#4ade80' : '#fbbf24' }}>
            {score === 10 ? 'PERFEKT! 🏆' : score >= 8 ? 'Utmärkt! ⭐' : score >= 6 ? 'Bra! 👍' : 'Öva mer! 🧮'}
          </div>
          {score > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{score * 22}🪙 +{score * 65} XP</div>
          <button className="btn-primary" style={{ padding: '14px 32px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
