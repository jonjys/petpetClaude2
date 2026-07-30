import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const ROUNDS = 10

type Category = 'djur' | 'mat' | 'sport' | 'natur'
interface Question { q: string; choices: string[]; answer: string; cat: Category }

const QUESTIONS: Question[] = [
  { q: 'Vilket djur lägger ägg?', choices: ['Hund','Höna','Katt','Häst'], answer: 'Höna', cat: 'djur' },
  { q: 'Vad är Sveriges huvudstad?', choices: ['Oslo','Köpenhamn','Stockholm','Helsinki'], answer: 'Stockholm', cat: 'natur' },
  { q: 'Hur många ben har en spindel?', choices: ['6','8','10','4'], answer: '8', cat: 'djur' },
  { q: 'Vilket är det snabbaste djuret?', choices: ['Lejon','Gepard','Häst','Örn'], answer: 'Gepard', cat: 'djur' },
  { q: 'Var växer bananer?', choices: ['Träd','Buske','Under jord','Klippa'], answer: 'Träd', cat: 'mat' },
  { q: 'Hur många spelare i fotboll?', choices: ['9','10','11','12'], answer: '11', cat: 'sport' },
  { q: 'Vilket hav är störst?', choices: ['Atlanten','Arktiska','Indiska','Stilla havet'], answer: 'Stilla havet', cat: 'natur' },
  { q: 'Vad äter en panda?', choices: ['Kött','Bambu','Fisk','Nötter'], answer: 'Bambu', cat: 'djur' },
  { q: 'Hur många sekunder på en minut?', choices: ['30','45','60','100'], answer: '60', cat: 'natur' },
  { q: 'Vilket instrument har 88 tangenter?', choices: ['Gitarr','Piano','Fiol','Trumpet'], answer: 'Piano', cat: 'natur' },
  { q: 'Vilken frukt är gul och böjd?', choices: ['Äpple','Banan','Päron','Mango'], answer: 'Banan', cat: 'mat' },
  { q: 'Hur många färger i regnbågen?', choices: ['5','6','7','8'], answer: '7', cat: 'natur' },
  { q: 'Vad är is?', choices: ['Flytande vatten','Fast vatten','Gasigt vatten','Salt vatten'], answer: 'Fast vatten', cat: 'natur' },
  { q: 'Vilket djur är störst?', choices: ['Elefant','Blåval','Isbjörn','Krokodil'], answer: 'Blåval', cat: 'djur' },
  { q: 'Hur många poäng i tennis-game?', choices: ['3','4','5','6'], answer: '4', cat: 'sport' },
  { q: 'Vad heter Norges kung?', choices: ['Harald','Carl','Erik','Olav'], answer: 'Harald', cat: 'natur' },
  { q: 'Vilken sport spelas på is?', choices: ['Tennis','Ishockey','Golf','Friidrott'], answer: 'Ishockey', cat: 'sport' },
  { q: 'Hur många planeter i solsystemet?', choices: ['7','8','9','10'], answer: '8', cat: 'natur' },
  { q: 'Vad producerar bin?', choices: ['Mjölk','Honung','Ägg','Silke'], answer: 'Honung', cat: 'djur' },
  { q: 'Vilket land är störst?', choices: ['USA','Kina','Ryssland','Brasilien'], answer: 'Ryssland', cat: 'natur' },
]

function pickRound(used: Set<number>): Question & { idx: number } {
  const available = QUESTIONS.map((q, i) => i).filter(i => !used.has(i))
  const pool = available.length > 0 ? available : QUESTIONS.map((_, i) => i)
  const idx = pool[Math.floor(Math.random() * pool.length)]
  return { ...QUESTIONS[idx], idx }
}

export const QuickFireGame = memo(function QuickFireGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [q, setQ] = useState<(Question & { idx: number }) | null>(null)
  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(10)
  const [feedback, setFeedback] = useState<'right' | 'wrong' | null>(null)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_qf_best') ?? 0))
  const usedRef = useRef(new Set<number>())
  const scoreRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const roundRef = useRef(0)

  const nextQ = useCallback((r: number) => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (r >= ROUNDS) {
      const s = scoreRef.current
      const prev = Number(localStorage.getItem('k0509_qf_best') ?? 0)
      if (s > prev) localStorage.setItem('k0509_qf_best', String(s))
      if (s > 0) onWin(Math.round(s * 18), s * 60)
      setPhase('done'); return
    }
    const nq = pickRound(usedRef.current)
    usedRef.current.add(nq.idx)
    setQ(nq); setFeedback(null); setTimeLeft(10)
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          setFeedback('wrong')
          setTimeout(() => { roundRef.current++; setRound(roundRef.current); nextQ(roundRef.current) }, 800)
          return 0
        }
        return t - 1
      })
    }, 1000)
  }, [onWin])

  const start = useCallback(() => {
    scoreRef.current = 0; setScore(0); roundRef.current = 0; setRound(0)
    usedRef.current = new Set()
    setPhase('playing')
    nextQ(0)
  }, [nextQ])

  const answer = useCallback((choice: string) => {
    if (feedback || !q) return
    if (timerRef.current) clearInterval(timerRef.current)
    const correct = choice === q.answer
    if (correct) { audio.coin(); scoreRef.current++; setScore(scoreRef.current); setFeedback('right') }
    else { audio.tap(); setFeedback('wrong') }
    setTimeout(() => { roundRef.current++; setRound(roundRef.current); nextQ(roundRef.current) }, 700)
  }, [feedback, q, nextQ])

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🔥 Quick Fire</span>
        <span className={styles.scoreDisplay}>{score}/{ROUNDS} · {timeLeft}s</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🔥</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Quick Fire</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            10 frågor om allt! 10 sekunder per fråga — svara snabbt!
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}/{ROUNDS}</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && q && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,.08)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(timeLeft / 10) * 100}%`, background: timeLeft <= 3 ? '#f87171' : '#f97316', transition: 'width 1s linear' }} />
          </div>
          <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--t3)' }}>Fråga {round + 1}/{ROUNDS}</div>
          <div style={{
            padding: '18px 14px', borderRadius: 14, textAlign: 'center',
            background: feedback === 'right' ? 'rgba(74,222,128,.1)' : feedback === 'wrong' ? 'rgba(248,113,113,.1)' : 'rgba(255,255,255,.06)',
            border: `2px solid ${feedback === 'right' ? '#4ade80' : feedback === 'wrong' ? '#f87171' : 'rgba(255,255,255,.1)'}`,
          }}>
            <div style={{ fontSize: 14, color: '#fff', fontWeight: 700, lineHeight: 1.5 }}>{q.q}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {q.choices.map((c, i) => (
              <button key={i} onClick={() => answer(c)} style={{
                padding: '14px 8px', borderRadius: 12, fontSize: 13, fontWeight: 700,
                background: feedback && c === q.answer ? 'rgba(74,222,128,.2)' : feedback && c !== q.answer ? 'rgba(255,255,255,.04)' : 'rgba(255,255,255,.08)',
                border: `2px solid ${feedback && c === q.answer ? '#4ade80' : 'rgba(255,255,255,.1)'}`,
                color: '#fff', cursor: 'pointer',
              }}>{c}</button>
            ))}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <div style={{ fontWeight: 900, color: '#f97316', fontSize: 20 }}>🔥 {score}/{ROUNDS} rätt!</div>
          <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
