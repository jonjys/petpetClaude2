import { memo, useState, useCallback } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const TRUTHS = [
  'Vilket är ditt pinsammaste minne?',
  'Har du någonsin ljugit för att undvika träning?',
  'Vad är den konstigaste maträtten du ätit?',
  'Har du haft hemligheter du aldrig berättat?',
  'Vilket djur liknar du mest?',
  'Vad är ditt värsta vanebrott?',
  'Har du någonsin känt dig avundsjuk på ett husdjur?',
  'Vad skrattar du åt men egentligen inte borde?',
  'Är du morgonmänniska eller nattmänniska?',
  'Vad är din hemligaste talang?',
]

const DARES = [
  'Imitera en katt i 10 sekunder!',
  'Sjung introt till din favoritlåt!',
  'Gör 5 hoppjack nu direkt!',
  'Ta en selfie med en rolig grimas!',
  'Imponera på någon med en rolig faktabit!',
  'Gör din bästa djurimitiation!',
  'Dans i 15 sekunder utan musik!',
  'Berätta ett dåligt skämt!',
  'Gör din bästa robotrörelse!',
  'Säg alfabetet baklänges så fort du kan!',
]

const ROUNDS = 8

export const TruthOrDareGame = memo(function TruthOrDareGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [round, setRound] = useState(0)
  const [current, setCurrent] = useState<{ type: 'truth' | 'dare'; text: string } | null>(null)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_tod_best') ?? 0))
  const [answered, setAnswered] = useState(false)

  const pick = useCallback((type: 'truth' | 'dare') => {
    const pool = type === 'truth' ? TRUTHS : DARES
    const text = pool[Math.floor(Math.random() * pool.length)]
    setCurrent({ type, text })
    setAnswered(false)
    audio.tap()
  }, [])

  const done = useCallback(() => {
    if (answered) return
    setAnswered(true)
    const pts = current?.type === 'dare' ? 80 + streak * 20 : 50 + streak * 10
    const ns = streak + 1
    setStreak(ns); setScore(s => s + pts)
    audio.coin()
  }, [current, streak, answered])

  const skip = useCallback(() => {
    setStreak(0); setRound(r => r)
    audio.tap()
  }, [])

  const next = useCallback(() => {
    const nr = round + 1
    if (nr >= ROUNDS) {
      const s = score + (answered ? 0 : 0)
      const prev = Number(localStorage.getItem('k0509_tod_best') ?? 0)
      if (s > prev) localStorage.setItem('k0509_tod_best', String(s))
      if (s > 0) onWin(Math.round(s / 8), s)
      setPhase('done')
    } else {
      setRound(nr); setCurrent(null); setAnswered(false)
    }
  }, [round, score, answered, onWin])

  const start = useCallback(() => {
    setScore(0); setStreak(0); setRound(0); setCurrent(null); setAnswered(false)
    setPhase('playing')
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🎲 Sanning eller Konka</span>
        <span className={styles.scoreDisplay}>{score}p · {round}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🎲</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Sanning eller Konka</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Välj Sanning (+50p) eller Konka (+80p), utför det och klicka "Klar" — streak ger bonus! 8 runder.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}p</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {streak >= 2 && <div style={{ textAlign: 'center', fontSize: 12, color: '#fbbf24', fontWeight: 700 }}>🔥 Streak ×{streak}</div>}

          {!current ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--t3)' }}>Runda {round + 1} — välj din utmaning:</div>
              <button onClick={() => pick('truth')} style={{ padding: '20px', borderRadius: 16, background: 'rgba(96,165,250,.12)', border: '2px solid rgba(96,165,250,.3)', color: '#93c5fd', fontSize: 16, fontWeight: 900, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 32 }}>💬</span>
                Sanning
                <span style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 400 }}>+50p (+10p/streak)</span>
              </button>
              <button onClick={() => pick('dare')} style={{ padding: '20px', borderRadius: 16, background: 'rgba(239,68,68,.12)', border: '2px solid rgba(239,68,68,.3)', color: '#f87171', fontSize: 16, fontWeight: 900, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 32 }}>⚡</span>
                Konka
                <span style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 400 }}>+80p (+20p/streak)</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ padding: '20px 16px', background: current.type === 'dare' ? 'rgba(239,68,68,.08)' : 'rgba(96,165,250,.08)', border: `1px solid ${current.type === 'dare' ? 'rgba(239,68,68,.25)' : 'rgba(96,165,250,.25)'}`, borderRadius: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 28 }}>{current.type === 'dare' ? '⚡' : '💬'}</div>
                <div style={{ fontSize: 12, color: current.type === 'dare' ? '#f87171' : '#93c5fd', fontWeight: 700, marginBottom: 8 }}>{current.type === 'dare' ? 'KONKA!' : 'SANNING!'}</div>
                <div style={{ fontSize: 14, color: '#fff', lineHeight: 1.6 }}>{current.text}</div>
              </div>
              {!answered ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={done} className="btn-primary" style={{ flex: 2, padding: '14px' }}>✅ Klar! +{current.type === 'dare' ? 80 + streak * 20 : 50 + streak * 10}p</button>
                  <button onClick={skip} style={{ flex: 1, padding: '14px', borderRadius: 12, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: 'var(--t3)', cursor: 'pointer', fontSize: 13 }}>Skip</button>
                </div>
              ) : (
                <button onClick={next} className="btn-primary" style={{ padding: '14px' }}>Nästa →</button>
              )}
            </div>
          )}
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <div style={{ fontWeight: 900, color: '#4ade80', fontSize: 20 }}>🎲 {score}p!</div>
          <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
