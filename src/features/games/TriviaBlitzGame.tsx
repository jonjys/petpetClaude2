import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const QS = [
  { q: 'Vad heter Australiens huvudstad?', opts: ['Canberra','Sydney','Melbourne','Perth'], a: 0 },
  { q: 'Hur många planeter har solsystemet?', opts: ['8','9','7','10'], a: 0 },
  { q: 'Vilket land uppfann pappret?', opts: ['Kina','Egypten','Indien','Persien'], a: 0 },
  { q: 'Vad kallas rädslan för spindlar?', opts: ['Araknofob','Klaustrofob','Xenofob','Agorafob'], a: 0 },
  { q: 'Hur många strängar har en gitarr?', opts: ['6','5','7','4'], a: 0 },
  { q: 'Vilket element är H₂O?', opts: ['Vatten','Väte','Syre','Helium'], a: 0 },
  { q: 'Hur många dagar har februari (skottår)?', opts: ['29','28','30','27'], a: 0 },
  { q: 'Vad heter världens längsta flod?', opts: ['Nilen','Amazonas','Yangtze','Mississippi'], a: 0 },
  { q: 'Hur många sekunder är en timme?', opts: ['3600','3000','4200','2400'], a: 0 },
  { q: 'Vilket land har flest tidszoner?', opts: ['Frankrike','Ryssland','USA','Kina'], a: 0 },
  { q: 'Vilket instrument har tangenter och strängar?', opts: ['Piano','Gitarr','Violin','Harpa'], a: 0 },
  { q: 'Hur många ribs (revben) har en vuxen människa?', opts: ['24','22','26','20'], a: 0 },
  { q: 'Vad heter den kemiska beteckningen för salt?', opts: ['NaCl','HCl','KCl','NaOH'], a: 0 },
  { q: 'I vilket land ligger Machu Picchu?', opts: ['Peru','Chile','Bolivia','Colombia'], a: 0 },
  { q: 'Hur många hjärtan har en bläckfisk?', opts: ['3','1','2','4'], a: 0 },
  { q: 'Vad är kvadratroten av 144?', opts: ['12','11','13','14'], a: 0 },
  { q: 'Vilket hav ligger norr om Europa?', opts: ['Arktiska havet','Atlanten','Nordsjön','Ishavet'], a: 0 },
  { q: 'I vilken stad ligger Eiffeltornet?', opts: ['Paris','London','Berlin','Rom'], a: 0 },
  { q: 'Hur många färger är det i en regnbåge?', opts: ['7','6','8','5'], a: 0 },
  { q: 'Vad kallas ett triangel med tre lika sidor?', opts: ['Liksidig','Likbent','Rätvinklig','Skalén'], a: 0 },
]

const TIME = 5
const TOTAL = 12

function pick<T>(arr: T[], n: number): T[] {
  const a = [...arr].sort(() => Math.random() - 0.5)
  return a.slice(0, n)
}

export const TriviaBlitzGame = memo(function TriviaBlitzGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [qs, setQs] = useState<typeof QS>([])
  const [idx, setIdx] = useState(0)
  const [sel, setSel] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [timeLeft, setTimeLeft] = useState(TIME)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_tb_best') ?? 0))
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const nextQ = useCallback((correct: boolean) => {
    if (timerRef.current) clearInterval(timerRef.current)
    setTimeout(() => {
      setSel(null)
      setIdx(i => {
        const next = i + 1
        if (next >= TOTAL) { setPhase('done'); return i }
        setTimeLeft(TIME)
        return next
      })
    }, 700)
    if (correct) {
      const ns = streak + 1; setStreak(ns)
      setScore(s => s + (ns >= 3 ? 2 : 1))
      audio.coin()
    } else { setStreak(0); audio.click() }
  }, [streak])

  const answer = useCallback((i: number) => {
    if (sel !== null) return
    setSel(i)
    nextQ(i === qs[idx]?.a)
  }, [sel, qs, idx, nextQ])

  useEffect(() => {
    if (phase !== 'playing' || sel !== null) return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current!); setSel(-1); nextQ(false); return 0 }
        return t - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase, idx, sel, nextQ])

  useEffect(() => {
    if (phase === 'done') {
      const prev = Number(localStorage.getItem('k0509_tb_best') ?? 0)
      if (score > prev) localStorage.setItem('k0509_tb_best', String(score))
      onWin(score * 15, score * 20)
      audio.achievement()
    }
  }, [phase, score, onWin])

  const start = () => {
    setQs(pick(QS, TOTAL)); setIdx(0); setScore(0); setStreak(0); setSel(null); setTimeLeft(TIME)
    setPhase('playing')
  }

  const q = qs[idx]
  const timerPct = (timeLeft / TIME) * 100
  const timerColor = timeLeft > 2 ? '#4ade80' : '#f87171'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>⚡ Trivia Blitz</span>
        <span className={styles.scoreDisplay}>{score}p · {idx}/{TOTAL}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>⚡</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Trivia Blitz</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            {TOTAL} frågor · 5 sekunder per fråga<br />Streak-bonus vid 3+ i rad
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore} poäng</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && q && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,.08)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${timerPct}%`, background: timerColor, borderRadius: 2, transition: 'width 1s linear' }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 900, color: timerColor, minWidth: 20 }}>{timeLeft}</span>
            {streak >= 3 && <span style={{ fontSize: 11, color: '#fbbf24' }}>🔥{streak}×</span>}
          </div>
          <div style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 16, padding: '16px 14px', minHeight: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--ff-head)', fontSize: 15, fontWeight: 700, color: '#e8e8f0', lineHeight: 1.4 }}>{q.q}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {q.opts.map((opt, i) => {
              const isCorrect = i === q.a
              const isSelected = sel === i
              const shown = sel !== null
              const bg = shown ? (isCorrect ? 'rgba(74,222,128,.2)' : isSelected ? 'rgba(248,113,113,.2)' : 'rgba(255,255,255,.04)') : 'rgba(255,255,255,.06)'
              const border = shown ? (isCorrect ? 'rgba(74,222,128,.5)' : isSelected ? 'rgba(248,113,113,.5)' : 'rgba(255,255,255,.08)') : 'rgba(255,255,255,.12)'
              const color = shown ? (isCorrect ? '#4ade80' : isSelected ? '#f87171' : '#888') : '#e8e8f0'
              return (
                <button key={i} onClick={() => answer(i)} disabled={sel !== null} style={{
                  padding: '12px 8px', borderRadius: 12, fontSize: 13, fontWeight: 700,
                  background: bg, border: `2px solid ${border}`, color, cursor: 'pointer', transition: 'all .15s',
                }}>
                  {opt}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{score >= 18 ? '⚡' : score >= 10 ? '⭐' : '🧠'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{score}/{TOTAL * 2 - TOTAL} poäng</div>
          <div style={{ fontSize: 14, color: score >= 18 ? '#4ade80' : '#fbbf24' }}>
            {score >= 18 ? 'Quiz-legend! ⚡' : score >= 10 ? 'Riktigt bra! ⭐' : 'Öva mer! 🧠'}
          </div>
          {score > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{score * 15}🪙 +{score * 20} XP</div>
          <button className="btn-primary" style={{ padding: '14px 32px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
