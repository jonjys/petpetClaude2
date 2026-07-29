import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const MIXES = [
  { result: '#ff6600', name: 'Orange', colors: [['#ff0000', 'Röd'], ['#ffff00', 'Gul']], wrongs: [['#ff0000', 'Röd'], ['#0000ff', 'Blå'], ['#ffff00', 'Gul'], ['#00ff00', 'Grön']] },
  { result: '#800080', name: 'Lila', colors: [['#ff0000', 'Röd'], ['#0000ff', 'Blå']], wrongs: [['#0000ff', 'Blå'], ['#ffff00', 'Gul'], ['#00ff00', 'Grön'], ['#ff0000', 'Röd']] },
  { result: '#008000', name: 'Grön', colors: [['#0000ff', 'Blå'], ['#ffff00', 'Gul']], wrongs: [['#ff0000', 'Röd'], ['#ffff00', 'Gul'], ['#0000ff', 'Blå'], ['#ff6600', 'Orange']] },
  { result: '#ff69b4', name: 'Rosa', colors: [['#ff0000', 'Röd'], ['#ffffff', 'Vit']], wrongs: [['#ff0000', 'Röd'], ['#000000', 'Svart'], ['#0000ff', 'Blå'], ['#ffffff', 'Vit']] },
  { result: '#964B00', name: 'Brun', colors: [['#ff0000', 'Röd'], ['#00ff00', 'Grön']], wrongs: [['#00ff00', 'Grön'], ['#0000ff', 'Blå'], ['#ff0000', 'Röd'], ['#ffff00', 'Gul']] },
  { result: '#808080', name: 'Grå', colors: [['#000000', 'Svart'], ['#ffffff', 'Vit']], wrongs: [['#ffffff', 'Vit'], ['#ffff00', 'Gul'], ['#000000', 'Svart'], ['#ff0000', 'Röd']] },
  { result: '#00ffff', name: 'Cyan', colors: [['#0000ff', 'Blå'], ['#00ff00', 'Grön']], wrongs: [['#00ff00', 'Grön'], ['#ff0000', 'Röd'], ['#0000ff', 'Blå'], ['#ffff00', 'Gul']] },
  { result: '#ff007f', name: 'Magenta', colors: [['#ff0000', 'Röd'], ['#0000ff', 'Blå']], wrongs: [['#0000ff', 'Blå'], ['#00ff00', 'Grön'], ['#ff0000', 'Röd'], ['#ffff00', 'Gul']] },
  { result: '#556B2F', name: 'Olivgrön', colors: [['#ffff00', 'Gul'], ['#00ff00', 'Grön']], wrongs: [['#ff0000', 'Röd'], ['#00ff00', 'Grön'], ['#ffff00', 'Gul'], ['#0000ff', 'Blå']] },
  { result: '#c0c000', name: 'Lime', colors: [['#ffff00', 'Gul'], ['#ffffff', 'Vit']], wrongs: [['#ffffff', 'Vit'], ['#0000ff', 'Blå'], ['#ffff00', 'Gul'], ['#ff0000', 'Röd']] },
]

const ROUNDS = 10

export const ColorMixGame2 = memo(function ColorMixGame2({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [pool] = useState(() => [...MIXES].sort(() => Math.random() - 0.5))
  const [qi, setQi] = useState(0)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [choices, setChoices] = useState<string[][]>([])
  const [timeLeft, setTimeLeft] = useState(7)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_cm2_best') ?? 0))
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const makeChoices = (m: typeof MIXES[0]) => {
    const wrong1 = m.wrongs.filter(w => !(w[0] === m.colors[0][0] || w[0] === m.colors[1][0])).slice(0, 2)
    const opts = [
      [...m.colors].map(c => c[1]).join(' + '),
      `${wrong1[0]?.[1] ?? 'Svart'} + ${m.colors[0][1]}`,
      `${m.colors[1][1]} + ${wrong1[1]?.[1] ?? 'Vit'}`,
      `${wrong1[0]?.[1] ?? 'Lila'} + ${wrong1[1]?.[1] ?? 'Orange'}`,
    ].sort(() => Math.random() - 0.5)
    return opts.map(o => [o])
  }

  const nextQ = useCallback((q: number) => {
    setQi(q); setChoices(makeChoices(pool[q])); setFeedback(null); setTimeLeft(7)
  }, [pool])

  const start = useCallback(() => { setScore(0); setStreak(0); setPhase('playing'); nextQ(0) }, [nextQ])

  useEffect(() => {
    if (phase !== 'playing' || feedback !== null) return
    timerRef.current = setInterval(() => setTimeLeft(t => {
      if (t <= 1) {
        if (timerRef.current) clearInterval(timerRef.current)
        const m = pool[qi]
        setFeedback(`⏰ Rätt: ${m.colors.map(c => c[1]).join(' + ')}`)
        setStreak(0); audio.tap()
        setTimeout(() => {
          const nq = qi + 1
          if (nq >= ROUNDS) { finalize(score); return }
          nextQ(nq)
        }, 1400)
        return 0
      }
      return t - 1
    }), 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase, qi, feedback])

  const finalize = (s: number) => {
    const prev = Number(localStorage.getItem('k0509_cm2_best') ?? 0)
    if (s > prev) localStorage.setItem('k0509_cm2_best', String(s))
    if (s > 0) onWin(Math.round(s / 8), s)
    setPhase('done')
  }

  const pick = useCallback((choice: string) => {
    if (!pool[qi] || feedback !== null) return
    if (timerRef.current) clearInterval(timerRef.current)
    const m = pool[qi]
    const correct = m.colors.map(c => c[1]).join(' + ')
    const ok = choice === correct
    const pts = ok ? Math.max(20, timeLeft * 12) + streak * 10 : 0
    const newScore = score + pts
    const newStreak = ok ? streak + 1 : 0
    setFeedback(ok ? `✅ Rätt! +${pts}p` : `❌ Rätt: ${correct}`)
    audio[ok ? 'coin' : 'tap']()
    setTimeout(() => {
      const nq = qi + 1
      if (nq >= ROUNDS) { finalize(newScore); return }
      setScore(newScore); setStreak(newStreak); nextQ(nq)
    }, 1300)
  }, [pool, qi, feedback, timeLeft, score, streak, nextQ])

  const mix = pool[qi]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🎨 Färgblandning</span>
        <span className={styles.scoreDisplay}>{score}p · {qi}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🎨</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Färgblandning</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Vilka TWÅ färger blandas för att få resultatet? Välj rätt kombination! 10 runder.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}p</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && mix && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 3 }}>
            {Array.from({ length: 7 }, (_, i) => (
              <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i < timeLeft ? '#60a5fa' : 'rgba(255,255,255,.08)' }} />
            ))}
          </div>
          {streak >= 2 && <div style={{ textAlign: 'center', fontSize: 12, color: '#fbbf24', fontWeight: 700 }}>🔥 ×{streak}</div>}

          <div style={{ textAlign: 'center', padding: '20px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 8 }}>Vilka färger blandar du för att få?</div>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: mix.result, margin: '0 auto 8px', boxShadow: `0 0 20px ${mix.result}60` }} />
            <div style={{ fontFamily: 'var(--ff-head)', fontSize: 20, fontWeight: 900, color: '#fff' }}>{mix.name}</div>
          </div>

          {feedback
            ? <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: feedback.startsWith('✅') ? '#4ade80' : '#f87171' }}>{feedback}</div>
            : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {choices.map((c, i) => (
                  <button key={i} onClick={() => pick(c[0])} style={{ padding: '14px', borderRadius: 14, fontSize: 14, fontWeight: 700, background: 'rgba(255,255,255,.06)', border: '2px solid rgba(255,255,255,.1)', color: '#e8e8f0', cursor: 'pointer', textAlign: 'center' }}>
                    {c[0]}
                  </button>
                ))}
              </div>
            )
          }
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <div style={{ fontWeight: 900, color: '#4ade80', fontSize: 20 }}>🎨 {score}p!</div>
          <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
