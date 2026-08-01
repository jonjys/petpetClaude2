import { memo, useState, useCallback, useRef, useEffect } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const ROUNDS = 10
const DISPLAY_MS = 1500

const EMOJI_SETS = ['🍎🍊🍋🍇🍓', '⭐💫🌟✨🌙', '🐶🐱🐭🐹🐰', '🎯🎱🎮🎲🎳', '🌸🌺🌻🌹🌷']

function makeQ(difficulty: number) {
  const set = EMOJI_SETS[Math.floor(Math.random() * EMOJI_SETS.length)].split('')
  const emoji = set[Math.floor(Math.random() * set.length)]
  const maxCount = difficulty < 3 ? 8 : difficulty < 6 ? 12 : 16
  const count = 2 + Math.floor(Math.random() * (maxCount - 2))
  const distractors = set.filter(e => e !== emoji)
  const distractorCount = Math.floor(Math.random() * (count * 0.8))
  const allEmojis = [
    ...Array(count).fill(emoji),
    ...Array(distractorCount).fill(null).map(() => distractors[Math.floor(Math.random() * distractors.length)]),
  ].sort(() => Math.random() - 0.5)
  const wrong1 = count + 1
  const wrong2 = Math.max(1, count - 1)
  const wrong3 = count + 2
  const opts = [count, wrong1, wrong2, wrong3]
    .filter((v, i, arr) => arr.indexOf(v) === i && v > 0)
    .slice(0, 4)
    .sort(() => Math.random() - 0.5)
  return { emoji, count, allEmojis, options: opts }
}

export const EmojiCountGame = memo(function EmojiCountGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'show' | 'answer' | 'feedback' | 'done'>('ready')
  const [round, setRound] = useState(0)
  const [q, setQ] = useState(() => makeQ(0))
  const [score, setScore] = useState(0)
  const [wasCorrect, setWasCorrect] = useState(false)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_ecg_best') ?? 0))
  const scoreRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const nextRound = useCallback((r: number) => {
    if (r >= ROUNDS) {
      const s = scoreRef.current
      const prev = Number(localStorage.getItem('k0509_ecg_best') ?? 0)
      if (s > prev) localStorage.setItem('k0509_ecg_best', String(s))
      onWin(s * 20, s * 60)
      setPhase('done')
      audio.achievement()
      return
    }
    const newQ = makeQ(Math.floor(r / 3))
    setQ(newQ)
    setRound(r)
    setPhase('show')
    timerRef.current = setTimeout(() => setPhase('answer'), DISPLAY_MS)
  }, [onWin])

  const start = useCallback(() => {
    scoreRef.current = 0
    setScore(0)
    nextRound(0)
  }, [nextRound])

  const answer = useCallback((val: number) => {
    if (phase !== 'answer') return
    const correct = val === q.count
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
        <span className={styles.gameTitle}>🔢 Emojitellaren</span>
        <span className={styles.scoreDisplay}>{score}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🔢</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Emojitellaren</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Emojis visas kort — räkna hur många av målemojin du såg! {ROUNDS} ronder.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}/{ROUNDS}</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'show' && (
        <div style={{ padding: '0 14px' }}>
          <div style={{ fontSize: 11, color: 'var(--t3)', textAlign: 'center', marginBottom: 12 }}>
            Räkna {q.emoji}! Runda {round + 1}/{ROUNDS}
          </div>
          <div style={{ background: 'rgba(255,255,255,.05)', borderRadius: 18, padding: '20px 12px', minHeight: 160, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 6, alignContent: 'center' }}>
            {q.allEmojis.map((e, i) => (
              <span key={i} style={{ fontSize: 26 }}>{e}</span>
            ))}
          </div>
        </div>
      )}

      {phase === 'answer' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 13, color: '#fff', textAlign: 'center', fontWeight: 700 }}>
            Hur många {q.emoji} såg du?
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {q.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => answer(opt)}
                style={{
                  height: 64, borderRadius: 14, fontSize: 26, fontWeight: 900,
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
          <div style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>Det var {q.count}st {q.emoji}</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: wasCorrect ? '#4ade80' : '#f87171' }}>
            {wasCorrect ? 'Rätt räknat! 🎯' : 'Räkna noga nästa gång!'}
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
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{score * 20}🪙 +{score * 60} XP</div>
          <button className="btn-primary" style={{ padding: '14px 32px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
