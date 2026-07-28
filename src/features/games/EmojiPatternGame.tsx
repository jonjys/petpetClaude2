import { memo, useState, useCallback, useEffect } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const EMOJI_SETS = [
  ['🌙', '⭐', '☀️', '🌈'],
  ['🔴', '🟡', '🟢', '🔵'],
  ['🐱', '🐶', '🐸', '🐼'],
  ['🍎', '🍋', '🍇', '🍓'],
  ['⚡', '🔥', '❄️', '💧'],
  ['🎵', '🎸', '🎹', '🎺'],
]

const ROUNDS = 10

function buildPattern(): { seq: string[]; options: string[]; answer: string } {
  const set = EMOJI_SETS[Math.floor(Math.random() * EMOJI_SETS.length)]
  const patternLen = 3 + Math.floor(Math.random() * 3)
  const templateRepeat = Math.ceil((patternLen + 1) / set.length)
  const basePattern = Array.from({ length: templateRepeat }, () => [...set]).flat().slice(0, patternLen + 1)
  const seq = basePattern.slice(0, patternLen)
  const answer = basePattern[patternLen]
  const wrongOptions = [...set].filter(e => e !== answer).sort(() => Math.random() - 0.5).slice(0, 3)
  const options = [...wrongOptions, answer].sort(() => Math.random() - 0.5)
  return { seq, options, answer }
}

export const EmojiPatternGame = memo(function EmojiPatternGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [roundIdx, setRoundIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [pattern, setPattern] = useState<ReturnType<typeof buildPattern> | null>(null)
  const [feedback, setFeedback] = useState<boolean | null>(null)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_emoji_best') ?? 0))

  const nextRound = useCallback((wasCorrect: boolean) => {
    if (wasCorrect) {
      const newStreak = streak + 1
      setStreak(newStreak)
      setScore(s => s + (newStreak >= 3 ? 2 : 1))
      audio.coin()
    } else {
      setStreak(0)
      audio.click()
    }
    setFeedback(wasCorrect)
    setTimeout(() => {
      setFeedback(null)
      if (roundIdx + 1 >= ROUNDS) {
        setPhase('done')
      } else {
        setRoundIdx(i => i + 1)
        setPattern(buildPattern())
      }
    }, 600)
  }, [streak, roundIdx])

  const start = useCallback(() => {
    setRoundIdx(0); setScore(0); setStreak(0); setFeedback(null)
    setPattern(buildPattern())
    setPhase('playing')
  }, [])

  useEffect(() => {
    if (phase === 'done') {
      const prev = Number(localStorage.getItem('k0509_emoji_best') ?? 0)
      if (score > prev) localStorage.setItem('k0509_emoji_best', String(score))
      onWin(score * 8, score * 12)
      audio.achievement()
    }
  }, [phase, score, onWin])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🎭 Emojimönster</span>
        <span className={styles.scoreDisplay}>{score}/{roundIdx}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🎭</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Emojimönster</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Vad kommer härnäst i sekvensen?<br />{ROUNDS} rundor · Streak ger dubbla poäng!
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore} poäng</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && pattern && (
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--t3)', textAlign: 'center' }}>
            Runda {roundIdx + 1}/{ROUNDS} {streak >= 3 && <span style={{ color: '#fbbf24' }}>🔥×{streak}</span>}
          </div>

          <div style={{
            background: feedback === true ? 'rgba(74,222,128,.1)' : feedback === false ? 'rgba(248,113,113,.1)' : 'rgba(255,255,255,.04)',
            border: `1px solid ${feedback === true ? 'rgba(74,222,128,.4)' : feedback === false ? 'rgba(248,113,113,.4)' : 'rgba(255,255,255,.1)'}`,
            borderRadius: 20, padding: '20px 16px', textAlign: 'center', transition: 'all .2s',
          }}>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 10 }}>Vad är nästa?</div>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {pattern.seq.map((e, i) => (
                <span key={i} style={{ fontSize: 30 }}>{e}</span>
              ))}
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: 'rgba(99,102,241,.2)', border: '2px dashed rgba(99,102,241,.6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, fontWeight: 900, color: '#818cf8',
              }}>?</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {pattern.options.map((emoji, i) => (
              <button
                key={i}
                onClick={() => { if (feedback !== null) return; nextRound(emoji === pattern.answer) }}
                disabled={feedback !== null}
                style={{
                  padding: 18, borderRadius: 16, fontSize: 32, textAlign: 'center',
                  background: 'rgba(255,255,255,.05)', border: '2px solid rgba(255,255,255,.1)',
                  cursor: 'pointer', transition: 'all .15s', opacity: feedback !== null ? 0.5 : 1,
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{score >= 15 ? '🧠' : score >= 8 ? '⭐' : '🎭'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{score} poäng</div>
          <div style={{ fontSize: 14, color: score >= 15 ? '#4ade80' : '#fbbf24' }}>
            {score >= 15 ? 'Mönstermästare! 🧠' : score >= 8 ? 'Bra öga! ⭐' : 'Öva mer! 🎭'}
          </div>
          {score > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{score * 8}🪙 +{score * 12} XP</div>
          <button className="btn-primary" style={{ padding: '14px 32px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
