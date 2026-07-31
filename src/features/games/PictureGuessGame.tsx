import { memo, useState, useCallback, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const ROUNDS = 12
const TIME_PER_Q = 12

interface Question {
  emoji: string
  hint: string
  options: string[]
  answer: string
}

const QUESTIONS: Question[] = [
  { emoji: '🌋', hint: 'Naturkraft', options: ['Vulkan', 'Berg', 'Ö', 'Klippa'], answer: 'Vulkan' },
  { emoji: '🦋', hint: 'Insekt', options: ['Myra', 'Fjäril', 'Bi', 'Fluga'], answer: 'Fjäril' },
  { emoji: '🌈', hint: 'Väder', options: ['Moln', 'Blixt', 'Regnbåge', 'Sol'], answer: 'Regnbåge' },
  { emoji: '🗼', hint: 'Paris', options: ['Big Ben', 'Eiffeltornet', 'Kolosseum', 'Frihetsgudinnan'], answer: 'Eiffeltornet' },
  { emoji: '🦁', hint: 'Djur', options: ['Tiger', 'Panter', 'Lejon', 'Gepard'], answer: 'Lejon' },
  { emoji: '🍄', hint: 'Svamp', options: ['Morot', 'Svamp', 'Kaktus', 'Blomma'], answer: 'Svamp' },
  { emoji: '🚀', hint: 'Rymden', options: ['Flygplan', 'Satellit', 'Raket', 'UFO'], answer: 'Raket' },
  { emoji: '🎭', hint: 'Teater', options: ['Masker', 'Krona', 'Mikrofon', 'Scen'], answer: 'Masker' },
  { emoji: '⚡', hint: 'Väder', options: ['Regn', 'Blixt', 'Åska', 'Storm'], answer: 'Blixt' },
  { emoji: '🦊', hint: 'Djur', options: ['Räv', 'Hund', 'Varg', 'Katt'], answer: 'Räv' },
  { emoji: '🌊', hint: 'Havet', options: ['Flod', 'Sjö', 'Tsunami', 'Våg'], answer: 'Våg' },
  { emoji: '🏆', hint: 'Vinna', options: ['Medalj', 'Pokal', 'Krona', 'Rosett'], answer: 'Pokal' },
  { emoji: '🎸', hint: 'Musik', options: ['Piano', 'Violin', 'Gitarr', 'Trumma'], answer: 'Gitarr' },
  { emoji: '🌺', hint: 'Blomma', options: ['Ros', 'Hibiskus', 'Lilja', 'Tulpan'], answer: 'Hibiskus' },
  { emoji: '🦅', hint: 'Fågel', options: ['Örn', 'Falk', 'Höns', 'Papegoja'], answer: 'Örn' },
]

export const PictureGuessGame = memo(function PictureGuessGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [qIdx, setQIdx] = useState(0)
  const [order, setOrder] = useState<number[]>([])
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(TIME_PER_Q)
  const [picked, setPicked] = useState<string | null>(null)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_pg2_best') ?? 0))
  const scoreRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const nextRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const shuffle = useCallback(() => {
    const idxs = Array.from({ length: QUESTIONS.length }, (_, i) => i)
    for (let i = idxs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [idxs[i], idxs[j]] = [idxs[j], idxs[i]]
    }
    return idxs.slice(0, ROUNDS)
  }, [])

  const nextQ = useCallback((nextIdx: number, ord: number[]) => {
    if (nextIdx >= ROUNDS) {
      if (timerRef.current) clearInterval(timerRef.current)
      const s = scoreRef.current
      const prev = Number(localStorage.getItem('k0509_pg2_best') ?? 0)
      if (s > prev) localStorage.setItem('k0509_pg2_best', String(s))
      onWin(s * 15, s * 50)
      setPhase('done')
      audio.achievement()
      return
    }
    setQIdx(nextIdx)
    setPicked(null)
    setTimeLeft(TIME_PER_Q)
  }, [onWin])

  const start = useCallback(() => {
    scoreRef.current = 0
    setScore(0); setPicked(null)
    const ord = shuffle()
    setOrder(ord)
    setQIdx(0); setTimeLeft(TIME_PER_Q)
    setPhase('playing')

    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          setPicked(prev => {
            if (prev === null) {
              nextRef.current = setTimeout(() => nextQ(0, ord), 600)
            }
            return prev ?? ''
          })
          return TIME_PER_Q
        }
        return t - 1
      })
    }, 1000)
  }, [shuffle, nextQ])

  const pick = useCallback((opt: string, idx: number, ord: number[]) => {
    if (picked !== null) return
    const q = QUESTIONS[ord[idx]]
    const correct = opt === q.answer
    setPicked(opt)
    if (correct) {
      scoreRef.current++
      setScore(scoreRef.current)
      audio.coin()
    } else {
      audio.click()
    }
    nextRef.current = setTimeout(() => nextQ(idx + 1, ord), 800)
  }, [picked, nextQ])

  const timerColor = timeLeft > 7 ? '#4ade80' : timeLeft > 3 ? '#fbbf24' : '#f87171'
  const q = order.length > 0 ? QUESTIONS[order[qIdx]] : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🖼️ Bildgissning</span>
        <span className={styles.scoreDisplay}>{score}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🖼️</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Bildgissning</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Se emojin och ledtråden — välj rätt svar bland 4 alternativ! 12s per fråga.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}/{ROUNDS}</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && q && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'rgba(255,255,255,.08)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(timeLeft / TIME_PER_Q) * 100}%`, background: timerColor, transition: 'width 1s linear' }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 900, color: timerColor }}>{timeLeft}s</span>
          </div>

          <div style={{ textAlign: 'center', padding: '20px', background: 'rgba(255,255,255,.04)', borderRadius: 18, border: '1px solid rgba(255,255,255,.1)' }}>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 6 }}>Ledtråd: {q.hint} ({qIdx + 1}/{ROUNDS})</div>
            <div style={{ fontSize: 70, lineHeight: 1.1 }}>{q.emoji}</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {q.options.map(opt => {
              const isCorrect = opt === q.answer
              const isPicked = opt === picked
              let bg = 'rgba(255,255,255,.06)'
              let border = 'rgba(255,255,255,.12)'
              let color = '#fff'
              if (picked !== null) {
                if (isCorrect) { bg = 'rgba(74,222,128,.2)'; border = 'rgba(74,222,128,.5)'; color = '#4ade80' }
                else if (isPicked) { bg = 'rgba(248,113,113,.2)'; border = 'rgba(248,113,113,.5)'; color = '#f87171' }
              }
              return (
                <button
                  key={opt}
                  onClick={() => pick(opt, qIdx, order)}
                  disabled={picked !== null}
                  style={{ padding: '16px 10px', borderRadius: 14, fontSize: 14, fontWeight: 700, background: bg, border: `2px solid ${border}`, color, cursor: 'pointer', transition: 'all .2s' }}
                >
                  {opt}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{score >= 10 ? '🏆' : score >= 7 ? '⭐' : '🖼️'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{score} / {ROUNDS}</div>
          <div style={{ fontSize: 13, color: score >= 10 ? '#4ade80' : '#fbbf24' }}>
            {score >= 12 ? 'PERFEKT! 🏆' : score >= 10 ? 'Utmärkt! ⭐' : score >= 7 ? 'Bra! 👍' : 'Öva mer! 🖼️'}
          </div>
          {score > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{score * 15}🪙 +{score * 50} XP</div>
          <button className="btn-primary" style={{ padding: '14px 32px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
