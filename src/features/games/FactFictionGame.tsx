import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const FACTS = [
  { text: 'En katt har 9 liv.', answer: false, explain: 'Det är bara en myt! Katter har ett liv.' },
  { text: 'Flamingor är rosa p.g.a. sin diet av alger och räkor.', answer: true, explain: 'Karotenoidpigment i maten ger dem den rosa färgen.' },
  { text: 'Elefanter kan hoppa.', answer: false, explain: 'Elefanter är det enda däggdjuret som inte kan hoppa.' },
  { text: 'En snigel kan sova i 3 år.', answer: true, explain: 'Sniglar kan hibernate i upp till 3 år under torra perioder.' },
  { text: 'Fiskar kan drunkna.', answer: true, explain: 'Fiskar behöver syre upplöst i vatten — om syret tar slut drunknar de.' },
  { text: 'Myror kan lyfta 1000 gånger sin kroppsvikt.', answer: false, explain: 'De kan lyfta ca 10-50 gånger sin vikt — imponerande, men inte 1000x.' },
  { text: 'Bläckfiskar har tre hjärtan.', answer: true, explain: 'Bläckfiskar har faktiskt tre hjärtan — två pumpar blod till gälarna.' },
  { text: 'Koalor har unika fingeravtryck precis som människor.', answer: true, explain: 'Koalors fingeravtryck är faktiskt svåra att skilja från mänskliga!' },
  { text: 'Getter har rektangulära pupiller.', answer: true, explain: 'Getters horisontella pupiller ger dem vidvinkelsyn för att se rovdjur.' },
  { text: 'Döda havet är det saltaste havet i världen.', answer: false, explain: 'Döda havet är en sjö, inte ett hav. Don Juandam i Antarktis är saltare.' },
  { text: 'Pingviner kan flyga under vatten men inte i luften.', answer: true, explain: 'Pingviner "flyger" med sina vingar under vatten upp till 36 km/h.' },
  { text: 'Vargar skäller inte alls.', answer: false, explain: 'Vargar kan skälla, men det är ovanligt — de ylar oftast istället.' },
  { text: 'En ko ger mer mjölk om den lyssnar på lugn musik.', answer: true, explain: 'Studier visar att kor ger mer mjölk när de lyssnar på avslappnande musik.' },
  { text: 'Björnar brusar alltid hela vintern utan att vakna.', answer: false, explain: 'Björnar kan vakna upp under vinterdvalan och röra sig korta sträckor.' },
  { text: 'Delfiner sover med ena ögat öppet.', answer: true, explain: 'Halvhjärnesömn! Ena hjärnhalvan sover medan den andra håller koll.' },
  { text: 'Hajar måste ständigt röra sig för att andas.', answer: false, explain: 'Många hajar kan pumpa vatten över gälarna och vila på havsbotten.' },
  { text: 'Bi:ens vingar slår 200 gånger per sekund.', answer: true, explain: 'Honungsbi:ens vingar slår ca 200 Hz vilket skapar det charakteristiska surret.' },
  { text: 'Krokodiler gråter på riktigt.', answer: true, explain: 'Krokodilstänger ger sekret från ögonen när de äter — det ser ut som tårar.' },
  { text: 'Sjöhästar simmar med nosen framåt.', answer: false, explain: 'Sjöhästar simmar vertikalt med nosen uppåt och använder en ryggfena.' },
  { text: 'Ormar hör med sin hud och käke, inte öron.', answer: true, explain: 'Ormar saknar yttre öron men känner vibrationer via kinden och käken.' },
]

const ROUNDS = 10
const TIME_PER_Q = 6

export const FactFictionGame = memo(function FactFictionGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [pool, setPool] = useState<typeof FACTS>([])
  const [qi, setQi] = useState(0)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [timeLeft, setTimeLeft] = useState(TIME_PER_Q)
  const [feedback, setFeedback] = useState<{ ok: boolean; explain: string } | null>(null)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_ff_best') ?? 0))
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const nextQ = useCallback((q: number, p: typeof FACTS) => {
    setQi(q); setFeedback(null); setTimeLeft(TIME_PER_Q)
  }, [])

  const start = useCallback(() => {
    const shuffled = [...FACTS].sort(() => Math.random() - 0.5).slice(0, ROUNDS)
    setPool(shuffled); setScore(0); setStreak(0); setQi(0); setFeedback(null); setPhase('playing')
    setTimeLeft(TIME_PER_Q)
  }, [])

  useEffect(() => {
    if (phase !== 'playing' || feedback !== null) return
    timerRef.current = setInterval(() => setTimeLeft(t => {
      if (t <= 1) {
        if (timerRef.current) clearInterval(timerRef.current)
        setFeedback({ ok: false, explain: '⏰ Tiden gick ut! ' + pool[qi]?.explain })
        setStreak(0)
        setTimeout(() => {
          const nq = qi + 1
          if (nq >= ROUNDS) { finalize(score); return }
          nextQ(nq, pool)
        }, 1500)
        return 0
      }
      return t - 1
    }), 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase, qi, feedback, pool])

  const finalize = (s: number) => {
    const prev = Number(localStorage.getItem('k0509_ff_best') ?? 0)
    if (s > prev) localStorage.setItem('k0509_ff_best', String(s))
    if (s > 0) onWin(Math.round(s / 8), s)
    setPhase('done')
  }

  const answer = useCallback((ans: boolean) => {
    if (timerRef.current) clearInterval(timerRef.current)
    const q = pool[qi]
    const ok = ans === q.answer
    const pts = ok ? Math.max(20, timeLeft * 10) + (streak + 1) * 10 : 0
    const newScore = score + pts
    const newStreak = ok ? streak + 1 : 0
    setFeedback({ ok, explain: (ok ? '✅ Rätt! ' : '❌ Fel. ') + q.explain })
    audio[ok ? 'coin' : 'tap']()
    setTimeout(() => {
      const nq = qi + 1
      if (nq >= ROUNDS) { finalize(newScore); return }
      setScore(newScore); setStreak(newStreak); nextQ(nq, pool)
    }, 1600)
  }, [pool, qi, timeLeft, score, streak, nextQ])

  const q = pool[qi]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🧐 Fakta/Fiktion</span>
        <span className={styles.scoreDisplay}>{score}p · {qi}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🧐</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Fakta eller Fiktion</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Är påståendet sant eller falskt? Snabba svar ger mer poäng. Streak-bonus! 10 frågor om djur & natur.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}p</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && q && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* timer */}
          <div style={{ display: 'flex', gap: 4 }}>
            {Array.from({ length: TIME_PER_Q }, (_, i) => (
              <div key={i} style={{ flex: 1, height: 5, borderRadius: 3, background: i < timeLeft ? (timeLeft <= 2 ? '#f87171' : '#4ade80') : 'rgba(255,255,255,.1)', transition: 'background .3s' }} />
            ))}
          </div>

          {streak >= 2 && <div style={{ textAlign: 'center', fontSize: 12, color: '#fbbf24', fontWeight: 700 }}>🔥 Streak ×{streak}</div>}

          <div style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 16, padding: '20px', minHeight: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: 14, color: '#e8e8f0', lineHeight: 1.7, textAlign: 'center' }}>{q.text}</div>
          </div>

          {feedback
            ? <div style={{ textAlign: 'center', fontSize: 12, color: feedback.ok ? '#4ade80' : '#f87171', lineHeight: 1.6, padding: '0 8px' }}>{feedback.explain}</div>
            : (
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn-primary" style={{ flex: 1, padding: '16px', fontSize: 16, background: 'linear-gradient(135deg, #22c55e, #16a34a)' }} onClick={() => answer(true)}>✅ SANT</button>
                <button className="btn-primary" style={{ flex: 1, padding: '16px', fontSize: 16, background: 'linear-gradient(135deg, #ef4444, #dc2626)' }} onClick={() => answer(false)}>❌ FALSKT</button>
              </div>
            )
          }
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <div style={{ fontWeight: 900, color: '#4ade80', fontSize: 20 }}>🧐 {score}p!</div>
          <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
