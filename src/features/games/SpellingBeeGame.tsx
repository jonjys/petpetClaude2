import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const GAME_DURATION = 60
const WORDS_DATA = [
  { word: 'bibliotek', hint: 'Plats med böcker att låna' },
  { word: 'paraply', hint: 'Skyddar mot regn' },
  { word: 'hallon', hint: 'Röd bär att äta' },
  { word: 'fjäril', hint: 'Insekt med färgglada vingar' },
  { word: 'telefon', hint: 'Ringer och kommunicerar' },
  { word: 'choklad', hint: 'Söt godsak av kakao' },
  { word: 'giraff', hint: 'Djur med lång hals' },
  { word: 'ballong', hint: 'Svävande luftfylld boll' },
  { word: 'kalender', hint: 'Visar dagar och månader' },
  { word: 'krokodil', hint: 'Grön reptil i vatten' },
  { word: 'gitarr', hint: 'Musikinstrument med strängar' },
  { word: 'pannkaka', hint: 'Platt mat med sylt och grädde' },
  { word: 'pyramid', hint: 'Triangelformat monument i Egypten' },
  { word: 'pingvin', hint: 'Fågel som inte flyger i Antarktis' },
  { word: 'diamant', hint: 'Hårt glittrande ädelsten' },
]

function pickWords(n: number) {
  return [...WORDS_DATA].sort(() => Math.random() - 0.5).slice(0, n)
}

export const SpellingBeeGame = memo(function SpellingBeeGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [words] = useState(() => pickWords(10))
  const [idx, setIdx] = useState(0)
  const [input, setInput] = useState('')
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION)
  const [feedback, setFeedback] = useState<'right' | 'wrong' | null>(null)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_spb_best') ?? 0))
  const scoreRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const endGame = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    const s = scoreRef.current
    const prev = Number(localStorage.getItem('k0509_spb_best') ?? 0)
    if (s > prev) localStorage.setItem('k0509_spb_best', String(s))
    if (s > 0) onWin(Math.round(s * 18), s * 60)
    setPhase('done')
  }, [onWin])

  const start = useCallback(() => {
    scoreRef.current = 0; setScore(0); setIdx(0); setInput(''); setFeedback(null)
    setTimeLeft(GAME_DURATION); setPhase('playing')
    timerRef.current = setInterval(() => {
      setTimeLeft(t => { if (t <= 1) { endGame(); return 0 } return t - 1 })
    }, 1000)
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [endGame])

  const submit = useCallback(() => {
    const w = words[idx]
    if (!w) return
    if (input.trim().toLowerCase() === w.word) {
      audio.achievement(); setFeedback('right')
      scoreRef.current++; setScore(scoreRef.current)
      setTimeout(() => {
        const ni = idx + 1
        if (ni >= words.length) { endGame() } else { setIdx(ni); setInput(''); setFeedback(null); setTimeout(() => inputRef.current?.focus(), 50) }
      }, 500)
    } else {
      audio.tap(); setFeedback('wrong')
      setTimeout(() => { setFeedback(null); setInput('') }, 600)
    }
  }, [words, idx, input, endGame])

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  const w = words[idx]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🐝 Stavningsbiet</span>
        <span className={styles.scoreDisplay}>{score}/{words.length} · {timeLeft}s</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🐝</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Stavningsbiet</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Stava rätt utifrån ledtråden! 10 ord på 60 sekunder.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}/{words.length}</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && w && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,.08)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(timeLeft / GAME_DURATION) * 100}%`, background: timeLeft <= 10 ? '#f87171' : '#fbbf24', transition: 'width 1s linear' }} />
          </div>
          <div style={{
            textAlign: 'center', padding: '28px 16px', borderRadius: 16,
            background: feedback === 'right' ? 'rgba(74,222,128,.1)' : feedback === 'wrong' ? 'rgba(248,113,113,.1)' : 'rgba(255,255,255,.05)',
            border: `2px solid ${feedback === 'right' ? '#4ade80' : feedback === 'wrong' ? '#f87171' : 'rgba(255,255,255,.1)'}`,
          }}>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 8 }}>Ord {idx + 1}/{words.length} — Stava:</div>
            <div style={{ fontSize: 16, color: '#fbbf24', fontWeight: 700 }}>"{w.hint}"</div>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 6 }}>{w.word.length} bokstäver</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') submit() }}
              style={{
                flex: 1, padding: '12px 14px', borderRadius: 10, fontSize: 16,
                background: 'rgba(255,255,255,.08)', border: '2px solid rgba(255,255,255,.12)',
                color: '#fff', outline: 'none',
              }}
              placeholder="Skriv ordet..."
              autoComplete="off" autoCapitalize="off" spellCheck={false}
            />
            <button onClick={submit} style={{ padding: '12px 16px', borderRadius: 10, background: '#fbbf24', border: 'none', color: '#000', fontWeight: 900, fontSize: 16, cursor: 'pointer' }}>OK</button>
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <div style={{ fontWeight: 900, color: '#fbbf24', fontSize: 20 }}>🐝 {score}/{words.length} rätt!</div>
          <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
