import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const ANIMALS = [
  { emoji: '🐄', name: 'Ko', sound: 'Råmar (moo)', wrongs: ['Grymtar', 'Kväker', 'Väser'] },
  { emoji: '🐸', name: 'Groda', sound: 'Kväker', wrongs: ['Råmar', 'Tuttar', 'Mesar'] },
  { emoji: '🐍', name: 'Orm', sound: 'Väser (hiss)', wrongs: ['Gormar', 'Skäller', 'Kväker'] },
  { emoji: '🦁', name: 'Lejon', sound: 'Ryter', wrongs: ['Kväker', 'Mesar', 'Gormar'] },
  { emoji: '🐺', name: 'Varg', sound: 'Ylar', wrongs: ['Ryter', 'Tuttar', 'Väser'] },
  { emoji: '🦆', name: 'Anka', sound: 'Kväker', wrongs: ['Råmar', 'Ylar', 'Väser'] },
  { emoji: '🐝', name: 'Bi', sound: 'Surrar (buzz)', wrongs: ['Tuttar', 'Ryter', 'Skäller'] },
  { emoji: '🦊', name: 'Räv', sound: 'Gormar/Ylar', wrongs: ['Kväker', 'Surrar', 'Råmar'] },
  { emoji: '🐘', name: 'Elefant', sound: 'Tuttar', wrongs: ['Ryter', 'Surrar', 'Kväker'] },
  { emoji: '🐢', name: 'Sköldpadda', sound: 'Stönar (ibland)', wrongs: ['Kväker', 'Ylar', 'Ryter'] },
  { emoji: '🦜', name: 'Papegoja', sound: 'Skriker/Pratar', wrongs: ['Gormar', 'Kväker', 'Surrar'] },
  { emoji: '🐬', name: 'Delfin', sound: 'Klickar/Visslar', wrongs: ['Tuttar', 'Ryter', 'Kväker'] },
  { emoji: '🐺', name: 'Hund', sound: 'Skäller (bark)', wrongs: ['Ylar', 'Mesar', 'Tuttar'] },
  { emoji: '🐱', name: 'Katt', sound: 'Jamar (meow)', wrongs: ['Skäller', 'Gormar', 'Kväker'] },
  { emoji: '🐦', name: 'Fågel', sound: 'Kvittrar/Sjunger', wrongs: ['Tuttar', 'Skäller', 'Råmar'] },
  { emoji: '🐊', name: 'Krokodil', sound: 'Väser/Ryter', wrongs: ['Kväker', 'Surrar', 'Jamar'] },
  { emoji: '🦋', name: 'Fjäril', sound: 'Tyst (gör inget ljud)', wrongs: ['Surrar', 'Kväker', 'Ryter'] },
  { emoji: '🐴', name: 'Häst', sound: 'Gnäggar', wrongs: ['Ryter', 'Skäller', 'Kväker'] },
  { emoji: '🐖', name: 'Gris', sound: 'Grymtar (oink)', wrongs: ['Gnäggar', 'Tuttar', 'Ylar'] },
  { emoji: '🦈', name: 'Haj', sound: 'Tyst (hajar är tysta)', wrongs: ['Klickar', 'Ryter', 'Väser'] },
]

const ROUNDS = 10

export const AnimalSoundGame = memo(function AnimalSoundGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [pool, setPool] = useState<typeof ANIMALS>([])
  const [qi, setQi] = useState(0)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [options, setOptions] = useState<string[]>([])
  const [feedback, setFeedback] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState(6)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_as_best') ?? 0))
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const makeOptions = (animal: typeof ANIMALS[0]) => {
    return [animal.sound, ...animal.wrongs.slice(0, 3)].sort(() => Math.random() - 0.5)
  }

  const nextQ = useCallback((q: number, p: typeof ANIMALS) => {
    setQi(q); setOptions(makeOptions(p[q])); setFeedback(null); setTimeLeft(6)
  }, [])

  const start = useCallback(() => {
    const shuffled = [...ANIMALS].sort(() => Math.random() - 0.5).slice(0, ROUNDS)
    setPool(shuffled); setScore(0); setStreak(0); setPhase('playing')
    setOptions(makeOptions(shuffled[0])); setQi(0); setFeedback(null); setTimeLeft(6)
  }, [])

  useEffect(() => {
    if (phase !== 'playing' || feedback !== null) return
    timerRef.current = setInterval(() => setTimeLeft(t => {
      if (t <= 1) {
        if (timerRef.current) clearInterval(timerRef.current)
        const a = pool[qi]
        setFeedback(`⏰ Rätt: ${a.sound}`)
        setStreak(0); audio.tap()
        setTimeout(() => {
          const nq = qi + 1
          if (nq >= ROUNDS) { finalize(score); return }
          nextQ(nq, pool)
        }, 1400)
        return 0
      }
      return t - 1
    }), 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase, qi, feedback, pool])

  const finalize = (s: number) => {
    const prev = Number(localStorage.getItem('k0509_as_best') ?? 0)
    if (s > prev) localStorage.setItem('k0509_as_best', String(s))
    if (s > 0) onWin(Math.round(s / 8), s)
    setPhase('done')
  }

  const pick = useCallback((opt: string) => {
    if (!pool[qi] || feedback !== null) return
    if (timerRef.current) clearInterval(timerRef.current)
    const ok = opt === pool[qi].sound
    const pts = ok ? Math.max(20, timeLeft * 12 + streak * 10) : 0
    const newScore = score + pts
    const newStreak = ok ? streak + 1 : 0
    setFeedback(ok ? `✅ Rätt! +${pts}p` : `❌ Rätt svar: ${pool[qi].sound}`)
    audio[ok ? 'coin' : 'tap']()
    setTimeout(() => {
      const nq = qi + 1
      if (nq >= ROUNDS) { finalize(newScore); return }
      setScore(newScore); setStreak(newStreak); nextQ(nq, pool)
    }, 1300)
  }, [pool, qi, feedback, timeLeft, score, streak, nextQ])

  const animal = pool[qi]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🔊 Djurljud</span>
        <span className={styles.scoreDisplay}>{score}p · {qi}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🔊</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Djurljud</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Vilket ljud gör djuret? Välj rätt svar bland 4 alternativ. 10 runder, streak-bonus!
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}p</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && animal && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 3 }}>
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i < timeLeft ? (timeLeft <= 2 ? '#f87171' : '#60a5fa') : 'rgba(255,255,255,.08)' }} />
            ))}
          </div>
          {streak >= 2 && <div style={{ textAlign: 'center', fontSize: 12, color: '#fbbf24', fontWeight: 700 }}>🔥 ×{streak}</div>}
          <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 16 }}>
            <div style={{ fontSize: 80, marginBottom: 6 }}>{animal.emoji}</div>
            <div style={{ fontFamily: 'var(--ff-head)', fontSize: 20, fontWeight: 900, color: '#fff' }}>{animal.name}</div>
            <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 4 }}>Vilket ljud gör den?</div>
          </div>
          {feedback
            ? <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: feedback.startsWith('✅') ? '#4ade80' : '#f87171' }}>{feedback}</div>
            : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {options.map((opt, i) => (
                  <button key={i} onClick={() => pick(opt)} style={{ padding: '14px 10px', borderRadius: 14, fontSize: 13, fontWeight: 700, background: 'rgba(255,255,255,.06)', border: '2px solid rgba(255,255,255,.1)', color: '#e8e8f0', cursor: 'pointer', textAlign: 'center', lineHeight: 1.4 }}>
                    {opt}
                  </button>
                ))}
              </div>
            )
          }
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <div style={{ fontWeight: 900, color: '#4ade80', fontSize: 20 }}>🔊 {score}p!</div>
          <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
