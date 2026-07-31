import { memo, useState, useCallback, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const ROUNDS = 10
const EMOJIS = ['🍎', '🌟', '🎈', '🐸', '🦋']

function makeRound(difficulty: number) {
  const vals: Record<string, number> = {}
  for (let i = 0; i < 3; i++) {
    vals[EMOJIS[i]] = 1 + Math.floor(Math.random() * (3 + difficulty))
  }
  const a = EMOJIS[0], b = EMOJIS[1], c = EMOJIS[2]
  const ops = ['+', '-', '*'] as const
  const op = ops[Math.floor(Math.random() * (difficulty < 3 ? 2 : 3))]
  let answer: number
  if (op === '+') answer = vals[a] + vals[b]
  else if (op === '-') answer = Math.abs(vals[a] - vals[b])
  else answer = vals[a] * vals[b]

  const wrong1 = answer + 1 + Math.floor(Math.random() * 3)
  const wrong2 = Math.max(0, answer - 1 - Math.floor(Math.random() * 3))
  const wrong3 = answer + 4 + Math.floor(Math.random() * 5)
  const options = [answer, wrong1, wrong2, wrong3]
    .filter((v, idx, arr) => arr.indexOf(v) === idx)
    .slice(0, 4)
    .sort(() => Math.random() - 0.5)

  const lhs = op === '-'
    ? (vals[a] >= vals[b] ? `${a} - ${b}` : `${b} - ${a}`)
    : `${a} ${op === '*' ? '×' : op} ${b}`

  return { vals, a, b, c, lhs, answer, options }
}

export const EmojiMathGame = memo(function EmojiMathGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'play' | 'feedback' | 'done'>('ready')
  const [round, setRound] = useState(0)
  const [q, setQ] = useState(() => makeRound(0))
  const [score, setScore] = useState(0)
  const [wasCorrect, setWasCorrect] = useState(false)
  const [chosen, setChosen] = useState<number | null>(null)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_emg_best') ?? 0))
  const scoreRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const nextRound = useCallback((r: number) => {
    if (r >= ROUNDS) {
      const s = scoreRef.current
      const prev = Number(localStorage.getItem('k0509_emg_best') ?? 0)
      if (s > prev) localStorage.setItem('k0509_emg_best', String(s))
      onWin(s * 22, s * 68)
      setPhase('done')
      audio.achievement()
      return
    }
    setQ(makeRound(Math.floor(r / 3)))
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
    timerRef.current = setTimeout(() => nextRound(round + 1), 1000)
  }, [phase, q, round, nextRound])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🧮 Emojimatte</span>
        <span className={styles.scoreDisplay}>{score}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🧮</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Emojimatte</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Emojis representerar tal. Lös ekvationen och välj rätt svar! 10 ronder.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}/{ROUNDS}</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'play' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--t3)', textAlign: 'center' }}>Rond {round + 1}/{ROUNDS}</div>
          <div style={{ background: 'rgba(255,255,255,.05)', borderRadius: 14, padding: 14 }}>
            <div style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 8, textAlign: 'center' }}>Emojivärdena:</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 20, flexWrap: 'wrap' }}>
              {Object.entries(q.vals).map(([emoji, val]) => (
                <div key={emoji} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 28 }}>{emoji}</div>
                  <div style={{ fontSize: 14, color: '#fbbf24', fontWeight: 900 }}>= {val}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', textAlign: 'center', marginTop: 14 }}>
              {q.lhs} = ?
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {q.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => answer(opt)}
                style={{
                  height: 58, borderRadius: 14, fontSize: 20, fontWeight: 900,
                  background: 'rgba(255,255,255,.08)',
                  color: '#fff',
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
          <div style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>{q.lhs} = {q.answer}</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: wasCorrect ? '#4ade80' : '#f87171' }}>
            {wasCorrect ? 'Rätt!' : `Fel! Du valde ${chosen}`}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{score >= 8 ? '🏆' : score >= 5 ? '⭐' : '🧮'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{score} / {ROUNDS}</div>
          <div style={{ fontSize: 13, color: score >= 8 ? '#4ade80' : '#fbbf24' }}>
            {score === 10 ? 'PERFEKT! 🏆' : score >= 8 ? 'Utmärkt! ⭐' : score >= 5 ? 'Bra! 👍' : 'Öva mer! 🧮'}
          </div>
          {score > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{score * 22}🪙 +{score * 68} XP</div>
          <button className="btn-primary" style={{ padding: '14px 32px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
