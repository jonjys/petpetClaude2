import { memo, useState, useEffect, useCallback, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const COLORS = [
  { id: 'red',    label: '🔴', hex: '#f87171', name: 'RÖD'    },
  { id: 'blue',   label: '🔵', hex: '#60a5fa', name: 'BLÅ'    },
  { id: 'green',  label: '🟢', hex: '#4ade80', name: 'GRÖN'   },
  { id: 'yellow', label: '🟡', hex: '#fbbf24', name: 'GUL'    },
  { id: 'purple', label: '🟣', hex: '#c084fc', name: 'LILA'   },
]

const GAME_TIME = 30
const ROUNDS = 20

interface Round {
  displayWord: string
  displayColor: string
  correctAnswer: string
}

function buildRound(): Round {
  const word = COLORS[Math.floor(Math.random() * COLORS.length)]
  let colorIdx = Math.floor(Math.random() * COLORS.length)
  const congruent = Math.random() > 0.4
  if (congruent) colorIdx = COLORS.indexOf(word)
  const displayColor = COLORS[colorIdx].hex
  return { displayWord: word.name, displayColor, correctAnswer: COLORS[colorIdx].id }
}

export const ColorMatchGame = memo(function ColorMatchGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [round, setRound] = useState<Round | null>(null)
  const [score, setScore] = useState(0)
  const [roundIdx, setRoundIdx] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_TIME)
  const [streak, setStreak] = useState(0)
  const [feedback, setFeedback] = useState<boolean | null>(null)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_color_best') ?? 0))
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const nextRound = useCallback(() => {
    setFeedback(null)
    if (roundIdx + 1 >= ROUNDS) {
      setPhase('done')
      return
    }
    setRoundIdx(i => i + 1)
    setRound(buildRound())
  }, [roundIdx])

  useEffect(() => {
    if (phase !== 'playing') return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!)
          setPhase('done')
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase])

  const start = useCallback(() => {
    setScore(0); setRoundIdx(0); setStreak(0); setFeedback(null)
    setTimeLeft(GAME_TIME); setRound(buildRound())
    setPhase('playing')
  }, [])

  const pick = useCallback((colorId: string) => {
    if (!round || feedback !== null) return
    const correct = colorId === round.correctAnswer
    setFeedback(correct)
    if (correct) {
      const newStreak = streak + 1
      setStreak(newStreak)
      const bonus = newStreak >= 5 ? 2 : 1
      setScore(s => s + bonus)
      audio.coin()
    } else {
      setStreak(0)
      audio.click()
    }
    setTimeout(nextRound, 350)
  }, [round, feedback, streak, nextRound])

  useEffect(() => {
    if (phase === 'done') {
      const prev = Number(localStorage.getItem('k0509_color_best') ?? 0)
      if (score > prev) localStorage.setItem('k0509_color_best', String(score))
      onWin(score * 3, score * 5)
      audio.achievement()
    }
  }, [phase, score, onWin])

  const timerColor = timeLeft > 15 ? '#4ade80' : timeLeft > 7 ? '#fbbf24' : '#f87171'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🎨 Färgmatch</span>
        <span className={styles.scoreDisplay}>{score}/{roundIdx}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🎨</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Färgmatch</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 280, lineHeight: 1.6 }}>
            Tryck på knappen vars <strong>FÄRG</strong> matchar texten — inte vad texten säger!
            <br />Exempel: texten säger <span style={{ color: '#f87171', fontWeight: 900 }}>BLÅ</span> men är röd → tryck 🔴
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore} rätt</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && round && (
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,.08)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(timeLeft / GAME_TIME) * 100}%`, background: timerColor, borderRadius: 3, transition: 'width 1s linear, background .3s' }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 900, color: timerColor }}>{timeLeft}s</span>
            {streak >= 3 && <span style={{ fontSize: 11, color: '#fbbf24' }}>🔥{streak}×</span>}
          </div>

          <div style={{
            textAlign: 'center', padding: '28px 16px',
            background: feedback === true ? 'rgba(74,222,128,.1)' : feedback === false ? 'rgba(248,113,113,.1)' : 'rgba(255,255,255,.04)',
            border: `1px solid ${feedback === true ? 'rgba(74,222,128,.4)' : feedback === false ? 'rgba(248,113,113,.4)' : 'rgba(255,255,255,.1)'}`,
            borderRadius: 20, transition: 'all .2s',
          }}>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 8 }}>Tryck på färgen som MATCHAR</div>
            <div style={{
              fontFamily: 'var(--ff-head)', fontSize: 42, fontWeight: 900,
              color: round.displayColor,
              textShadow: `0 0 20px ${round.displayColor}66`,
            }}>
              {round.displayWord}
            </div>
            <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 8 }}>Runda {roundIdx + 1}/{ROUNDS}</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {COLORS.filter((_, i) => i < 3).map(c => (
              <button
                key={c.id}
                onClick={() => pick(c.id)}
                disabled={feedback !== null}
                style={{
                  padding: '18px 6px', borderRadius: 16, textAlign: 'center',
                  background: `${c.hex}22`, border: `2px solid ${c.hex}66`,
                  cursor: 'pointer', fontSize: 24, transition: 'all .15s',
                  opacity: feedback !== null ? 0.5 : 1,
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {COLORS.filter((_, i) => i >= 3).map(c => (
              <button
                key={c.id}
                onClick={() => pick(c.id)}
                disabled={feedback !== null}
                style={{
                  padding: '18px 6px', borderRadius: 16, textAlign: 'center',
                  background: `${c.hex}22`, border: `2px solid ${c.hex}66`,
                  cursor: 'pointer', fontSize: 24, transition: 'all .15s',
                  opacity: feedback !== null ? 0.5 : 1,
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{score >= 15 ? '🏆' : score >= 10 ? '⭐' : '🎨'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{score} / {ROUNDS}</div>
          <div style={{ fontSize: 13, color: score >= 15 ? '#4ade80' : '#fbbf24' }}>
            {score >= 18 ? 'GENI! 🧠' : score >= 15 ? 'Utmärkt! ⭐' : score >= 10 ? 'Bra! 👍' : 'Öva mer! 🎨'}
          </div>
          {score > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{score * 3}🪙 +{score * 5} XP</div>
          <button className="btn-primary" style={{ padding: '14px 32px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
