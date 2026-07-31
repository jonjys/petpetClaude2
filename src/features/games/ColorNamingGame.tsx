import { memo, useState, useCallback, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const ROUNDS = 10

const COLORS: { name: string; hex: string }[] = [
  { name: 'Röd',     hex: '#ef4444' },
  { name: 'Blå',     hex: '#3b82f6' },
  { name: 'Grön',    hex: '#22c55e' },
  { name: 'Gul',     hex: '#eab308' },
  { name: 'Lila',    hex: '#a855f7' },
  { name: 'Orange',  hex: '#f97316' },
  { name: 'Rosa',    hex: '#ec4899' },
  { name: 'Cyan',    hex: '#06b6d4' },
  { name: 'Vit',     hex: '#f1f5f9' },
  { name: 'Grå',     hex: '#94a3b8' },
]

function makeRound() {
  const shuffled = [...COLORS].sort(() => Math.random() - 0.5)
  const target = shuffled[0]
  const displayColor = shuffled[Math.floor(Math.random() * COLORS.length)]
  const options = shuffled.slice(0, 4)
  if (!options.find(c => c.name === target.name)) {
    options[Math.floor(Math.random() * 4)] = target
  }
  return { target, displayColor, options: options.sort(() => Math.random() - 0.5) }
}

export const ColorNamingGame = memo(function ColorNamingGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'play' | 'feedback' | 'done'>('ready')
  const [round, setRound] = useState(0)
  const [q, setQ] = useState(() => makeRound())
  const [score, setScore] = useState(0)
  const [wasCorrect, setWasCorrect] = useState(false)
  const [chosen, setChosen] = useState('')
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_cng_best') ?? 0))
  const scoreRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isStroop = useRef(false)

  const nextRound = useCallback((r: number) => {
    if (r >= ROUNDS) {
      const s = scoreRef.current
      const prev = Number(localStorage.getItem('k0509_cng_best') ?? 0)
      if (s > prev) localStorage.setItem('k0509_cng_best', String(s))
      onWin(s * 21, s * 63)
      setPhase('done')
      audio.achievement()
      return
    }
    const newQ = makeRound()
    isStroop.current = r >= 5
    setQ(newQ)
    setChosen('')
    setRound(r)
    setPhase('play')
  }, [onWin])

  const start = useCallback(() => {
    scoreRef.current = 0
    setScore(0)
    nextRound(0)
  }, [nextRound])

  const answer = useCallback((colorName: string) => {
    if (phase !== 'play') return
    setChosen(colorName)
    const correct = colorName === q.target.name
    setWasCorrect(correct)
    if (correct) { scoreRef.current++; setScore(scoreRef.current); audio.coin() } else { audio.click() }
    setPhase('feedback')
    timerRef.current = setTimeout(() => nextRound(round + 1), 1100)
  }, [phase, q, round, nextRound])

  const isStroopRound = round >= 5 && phase === 'play'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🎨 Färgnamnaren</span>
        <span className={styles.scoreDisplay}>{score}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🎨</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Färgnamnaren</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Välj rätt namn på färgen som visas! Stroop-effekt väntar på runda 6. {ROUNDS} ronder.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}/{ROUNDS}</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'play' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--t3)', textAlign: 'center' }}>
            Runda {round + 1}/{ROUNDS} {isStroopRound ? '· 🧠 Stroop-läge!' : ''}
          </div>
          <div style={{ background: 'rgba(255,255,255,.05)', borderRadius: 18, padding: '32px 20px', textAlign: 'center' }}>
            {isStroopRound ? (
              <div style={{ fontSize: 44, fontWeight: 900, color: q.displayColor.hex, letterSpacing: 2 }}>
                {q.target.name}
              </div>
            ) : (
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: q.target.hex, margin: '0 auto', boxShadow: `0 0 24px ${q.target.hex}60` }} />
            )}
            <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 10 }}>
              {isStroopRound ? 'Vilken FÄRG har texten?' : 'Vad heter färgen?'}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {q.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => answer(isStroopRound ? opt.name : opt.name)}
                style={{
                  height: 56, borderRadius: 14, fontSize: 15, fontWeight: 900,
                  background: 'rgba(255,255,255,.08)', color: '#fff',
                  border: `2px solid ${opt.hex}50`,
                  cursor: 'pointer',
                }}
              >{opt.name}</button>
            ))}
          </div>
        </div>
      )}

      {phase === 'feedback' && (
        <div style={{ padding: '32px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 52 }}>{wasCorrect ? '✅' : '❌'}</div>
          <div style={{ width: 50, height: 50, borderRadius: '50%', background: q.target.hex, margin: '0 auto' }} />
          <div style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>Rätt svar: {q.target.name}</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: wasCorrect ? '#4ade80' : '#f87171' }}>
            {wasCorrect ? 'Rätt! 🎨' : `Fel! Du svarade ${chosen}`}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{score >= 8 ? '🏆' : score >= 6 ? '⭐' : '🎨'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{score} / {ROUNDS}</div>
          <div style={{ fontSize: 13, color: score >= 8 ? '#4ade80' : '#fbbf24' }}>
            {score === 10 ? 'PERFEKT! 🏆' : score >= 8 ? 'Utmärkt! ⭐' : score >= 6 ? 'Bra! 👍' : 'Öva mer! 🎨'}
          </div>
          {score > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{score * 21}🪙 +{score * 63} XP</div>
          <button className="btn-primary" style={{ padding: '14px 32px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
