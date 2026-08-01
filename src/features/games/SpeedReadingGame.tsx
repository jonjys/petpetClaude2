import { memo, useState, useCallback, useRef, useEffect } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const ROUNDS = 8

type Question = { words: string[]; question: string; answer: string; options: string[] }

const SENTENCES: Question[] = [
  { words: ['Katten', 'satt', 'på', 'mattan'], question: 'Vad satt på mattan?', answer: 'Katten', options: ['Katten', 'Hunden', 'Fågeln', 'Fisken'] },
  { words: ['Solen', 'skiner', 'idag'], question: 'Vad skiner idag?', answer: 'Solen', options: ['Solen', 'Månen', 'Stjärnan', 'Lampan'] },
  { words: ['Barnet', 'leker', 'i', 'parken'], question: 'Var leker barnet?', answer: 'parken', options: ['parken', 'skogen', 'staden', 'skolan'] },
  { words: ['Hunden', 'springer', 'fort'], question: 'Hur springer hunden?', answer: 'fort', options: ['fort', 'sakta', 'tyst', 'glatt'] },
  { words: ['Boken', 'är', 'på', 'bordet'], question: 'Var är boken?', answer: 'bordet', options: ['bordet', 'golvet', 'stolen', 'hyllan'] },
  { words: ['Fågeln', 'sjunger', 'i', 'trädet'], question: 'Var sjunger fågeln?', answer: 'trädet', options: ['trädet', 'huset', 'parken', 'fönstret'] },
  { words: ['Regnet', 'faller', 'ute'], question: 'Vad faller ute?', answer: 'Regnet', options: ['Regnet', 'Snön', 'Löven', 'Solen'] },
  { words: ['Flickan', 'dansar', 'glatt'], question: 'Hur dansar flickan?', answer: 'glatt', options: ['glatt', 'trist', 'fort', 'sakta'] },
  { words: ['Bilen', 'kör', 'på', 'vägen'], question: 'Var kör bilen?', answer: 'vägen', options: ['vägen', 'gatan', 'fältet', 'bron'] },
  { words: ['Fisken', 'simmar', 'djupt'], question: 'Hur simmar fisken?', answer: 'djupt', options: ['djupt', 'fort', 'grunt', 'sakta'] },
  { words: ['Stjärnorna', 'lyser', 'på', 'natten'], question: 'När lyser stjärnorna?', answer: 'natten', options: ['natten', 'dagen', 'morgonen', 'kvällen'] },
  { words: ['Pojken', 'äter', 'en', 'glass'], question: 'Vad äter pojken?', answer: 'glass', options: ['glass', 'kaka', 'äpple', 'smörgås'] },
]

function makeRound(difficulty: number): Question {
  const pool = difficulty < 4 ? SENTENCES.filter(s => s.words.length <= 4) : SENTENCES
  return pool[Math.floor(Math.random() * pool.length)]
}

export const SpeedReadingGame = memo(function SpeedReadingGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'show' | 'answer' | 'feedback' | 'done'>('ready')
  const [round, setRound] = useState(0)
  const [q, setQ] = useState<Question>(() => makeRound(0))
  const [wordIdx, setWordIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [wasCorrect, setWasCorrect] = useState(false)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_srg2_best') ?? 0))
  const scoreRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wpmDelay = useRef(400)

  const nextRound = useCallback((r: number) => {
    if (r >= ROUNDS) {
      const s = scoreRef.current
      const prev = Number(localStorage.getItem('k0509_srg2_best') ?? 0)
      if (s > prev) localStorage.setItem('k0509_srg2_best', String(s))
      onWin(s * 24, s * 72)
      setPhase('done')
      audio.achievement()
      return
    }
    const newQ = makeRound(Math.floor(r / 3))
    setQ(newQ)
    setWordIdx(0)
    setRound(r)
    wpmDelay.current = r < 3 ? 500 : r < 6 ? 380 : 280
    setPhase('show')
  }, [onWin])

  const start = useCallback(() => {
    scoreRef.current = 0
    setScore(0)
    nextRound(0)
  }, [nextRound])

  useEffect(() => {
    if (phase !== 'show') return
    if (wordIdx < q.words.length) {
      timerRef.current = setTimeout(() => setWordIdx(i => i + 1), wpmDelay.current)
    } else {
      timerRef.current = setTimeout(() => setPhase('answer'), 300)
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [phase, wordIdx, q])

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const answer = useCallback((val: string) => {
    if (phase !== 'answer') return
    const correct = val === q.answer
    setWasCorrect(correct)
    if (correct) { scoreRef.current++; setScore(scoreRef.current); audio.coin() } else { audio.click() }
    setPhase('feedback')
    timerRef.current = setTimeout(() => nextRound(round + 1), 1200)
  }, [phase, q, round, nextRound])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>📖 Snabbläsning</span>
        <span className={styles.scoreDisplay}>{score}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>📖</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Snabbläsning</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Ord visas ett i taget i högt tempo — läs och svara på frågan efteråt! {ROUNDS} meningar.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}/{ROUNDS}</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'show' && (
        <div style={{ padding: '0 14px' }}>
          <div style={{ fontSize: 11, color: 'var(--t3)', textAlign: 'center', marginBottom: 16 }}>Mening {round + 1}/{ROUNDS} · Läs!</div>
          <div style={{ background: 'rgba(255,255,255,.05)', borderRadius: 18, height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: 42, fontWeight: 900, color: '#fff', textAlign: 'center' }}>
              {wordIdx < q.words.length ? q.words[wordIdx] : ''}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 12 }}>
            {q.words.map((_, i) => (
              <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: i < wordIdx ? '#4ade80' : i === wordIdx ? '#fff' : 'rgba(255,255,255,.2)' }} />
            ))}
          </div>
        </div>
      )}

      {phase === 'answer' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', textAlign: 'center' }}>{q.question}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {q.options.map((opt, i) => (
              <button key={i} onClick={() => answer(opt)} style={{ padding: '16px 20px', borderRadius: 14, fontSize: 16, fontWeight: 700, background: 'rgba(255,255,255,.08)', color: '#fff', border: '2px solid rgba(255,255,255,.12)', cursor: 'pointer', textAlign: 'left' }}>{opt}</button>
            ))}
          </div>
        </div>
      )}

      {phase === 'feedback' && (
        <div style={{ padding: '32px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 52 }}>{wasCorrect ? '✅' : '❌'}</div>
          <div style={{ fontSize: 14, color: 'var(--t3)' }}>{q.words.join(' ')}</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: wasCorrect ? '#4ade80' : '#f87171' }}>
            {wasCorrect ? 'Rätt! 📖' : `Fel! Svaret var "${q.answer}"`}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{score >= 6 ? '🏆' : score >= 4 ? '⭐' : '📖'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{score} / {ROUNDS}</div>
          <div style={{ fontSize: 13, color: score >= 6 ? '#4ade80' : '#fbbf24' }}>
            {score === 8 ? 'PERFEKT! 🏆' : score >= 6 ? 'Utmärkt! ⭐' : score >= 4 ? 'Bra! 👍' : 'Öva mer! 📖'}
          </div>
          {score > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{score * 24}🪙 +{score * 72} XP</div>
          <button className="btn-primary" style={{ padding: '14px 32px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
