import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const QUESTIONS = [
  { text: 'Blommor är vackra.', question: 'Handlade texten om blommor?', answer: true },
  { text: 'Katter sover mycket.', question: 'Handlade texten om hundar?', answer: false },
  { text: 'Havet är djupt och blått.', question: 'Handlade texten om havet?', answer: true },
  { text: 'Äpplen är gröna eller röda.', question: 'Handlade texten om päron?', answer: false },
  { text: 'Stjärnor lyser om natten.', question: 'Handlade texten om stjärnor?', answer: true },
  { text: 'Bilar kör på vägarna.', question: 'Handlade texten om flygplan?', answer: false },
  { text: 'Regnbågen har sju färger.', question: 'Handlade texten om regnbågen?', answer: true },
  { text: 'Fiskar simmar i vatten.', question: 'Handlade texten om fåglar?', answer: false },
  { text: 'Solen värmer jordklotet.', question: 'Handlade texten om månen?', answer: false },
  { text: 'Björnar sover på vintern.', question: 'Handlade texten om björnar?', answer: true },
  { text: 'Pizza är en italiensk rätt.', question: 'Handlade texten om pizza?', answer: true },
  { text: 'Snö faller på vintern.', question: 'Handlade texten om regn?', answer: false },
  { text: 'Pianot har 88 tangenter.', question: 'Handlade texten om piano?', answer: true },
  { text: 'Lejon bor på savannen.', question: 'Handlade texten om tigrar?', answer: false },
  { text: 'Bokstäver bildar ord.', question: 'Handlade texten om siffror?', answer: false },
]

const SHOW_DURATION = 1800
const TOTAL = 12

export const SpeedReadGame = memo(function SpeedReadGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'show' | 'answer' | 'done'>('ready')
  const [qIdx, setQIdx] = useState(0)
  const [order, setOrder] = useState<number[]>([])
  const [score, setScore] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [feedback, setFeedback] = useState<boolean | null>(null)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_sr2_best') ?? 0))
  const scoreRef = useRef(0)
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const shuffle = useCallback(() => {
    const idxs = Array.from({ length: QUESTIONS.length }, (_, i) => i)
    for (let i = idxs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [idxs[i], idxs[j]] = [idxs[j], idxs[i]]
    }
    return idxs.slice(0, TOTAL)
  }, [])

  const showNext = useCallback((idx: number, ord: number[]) => {
    if (idx >= TOTAL) {
      const s = scoreRef.current
      const prev = Number(localStorage.getItem('k0509_sr2_best') ?? 0)
      if (s > prev) localStorage.setItem('k0509_sr2_best', String(s))
      onWin(s * 14, s * 45)
      setPhase('done')
      audio.achievement()
      return
    }
    setQIdx(idx)
    setFeedback(null)
    setPhase('show')
    showTimerRef.current = setTimeout(() => setPhase('answer'), SHOW_DURATION)
  }, [onWin])

  const start = useCallback(() => {
    scoreRef.current = 0
    setScore(0); setCorrect(0); setFeedback(null)
    const ord = shuffle()
    setOrder(ord)
    showNext(0, ord)
  }, [shuffle, showNext])

  const answer = useCallback((ans: boolean) => {
    if (phase !== 'answer') return
    const q = QUESTIONS[order[qIdx]]
    const isCorrect = ans === q.answer
    setFeedback(isCorrect)
    if (isCorrect) {
      scoreRef.current++
      setScore(scoreRef.current)
      setCorrect(c => c + 1)
      audio.coin()
    } else {
      audio.click()
    }
    setTimeout(() => showNext(qIdx + 1, order), 500)
  }, [phase, order, qIdx, showNext])

  useEffect(() => () => { if (showTimerRef.current) clearTimeout(showTimerRef.current) }, [])

  const q = order.length > 0 ? QUESTIONS[order[qIdx]] : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>📖 Snabbläsning</span>
        <span className={styles.scoreDisplay}>{correct}/{TOTAL}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>📖</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Snabbläsning</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Läs meningen snabbt — sedan svarar du JA eller NEJ på frågan. 12 ronder.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}/{TOTAL}</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'show' && q && (
        <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--t3)' }}>Läs snabbt! ({qIdx + 1}/{TOTAL})</div>
          <div style={{
            textAlign: 'center', padding: '28px 20px',
            background: 'rgba(96,165,250,.1)', border: '1px solid rgba(96,165,250,.3)',
            borderRadius: 20, width: '100%', boxSizing: 'border-box',
          }}>
            <div style={{ fontFamily: 'var(--ff-head)', fontSize: 20, fontWeight: 900, color: '#60a5fa', lineHeight: 1.4 }}>{q.text}</div>
          </div>
          <div style={{ fontSize: 11, color: 'var(--t3)' }}>Läser...</div>
        </div>
      )}

      {phase === 'answer' && q && (
        <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--t3)' }}>Svara! ({qIdx + 1}/{TOTAL})</div>
          <div style={{
            textAlign: 'center', padding: '20px',
            background: feedback === true ? 'rgba(74,222,128,.1)' : feedback === false ? 'rgba(248,113,113,.1)' : 'rgba(255,255,255,.04)',
            border: `1px solid ${feedback === true ? 'rgba(74,222,128,.4)' : feedback === false ? 'rgba(248,113,113,.4)' : 'rgba(255,255,255,.1)'}`,
            borderRadius: 20, width: '100%', boxSizing: 'border-box',
          }}>
            <div style={{ fontSize: 15, color: '#fff', fontWeight: 700, lineHeight: 1.5 }}>{q.question}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, width: '100%' }}>
            <button onClick={() => answer(true)} disabled={feedback !== null} style={{ padding: '18px', borderRadius: 16, fontSize: 22, background: 'rgba(74,222,128,.15)', border: '2px solid rgba(74,222,128,.4)', color: '#4ade80', cursor: 'pointer', fontWeight: 900 }}>✅ JA</button>
            <button onClick={() => answer(false)} disabled={feedback !== null} style={{ padding: '18px', borderRadius: 16, fontSize: 22, background: 'rgba(248,113,113,.15)', border: '2px solid rgba(248,113,113,.4)', color: '#f87171', cursor: 'pointer', fontWeight: 900 }}>❌ NEJ</button>
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{correct >= 10 ? '🏆' : correct >= 7 ? '⭐' : '📖'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{correct} / {TOTAL}</div>
          <div style={{ fontSize: 13, color: correct >= 10 ? '#4ade80' : '#fbbf24' }}>
            {correct >= 12 ? 'PERFEKT! 🧠' : correct >= 10 ? 'Utmärkt! ⭐' : correct >= 7 ? 'Bra! 👍' : 'Öva mer! 📖'}
          </div>
          {correct > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{correct * 14}🪙 +{correct * 45} XP</div>
          <button className="btn-primary" style={{ padding: '14px 32px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
