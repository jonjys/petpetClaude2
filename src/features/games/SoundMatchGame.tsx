import { memo, useState, useCallback, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const ROUNDS = 14

interface Question {
  desc: string
  question: string
  options: string[]
  answer: string
}

const QUESTIONS: Question[] = [
  { desc: '🦁', question: 'Vilket djur ryter?', options: ['Lejon', 'Elefant', 'Giraff', 'Zebra'], answer: 'Lejon' },
  { desc: '🐸', question: 'Vilket djur kvackar?', options: ['Anka', 'Groda', 'Orm', 'Mus'], answer: 'Groda' },
  { desc: '🎸', question: 'Vilket instrument har strängar?', options: ['Trumma', 'Flöjt', 'Gitarr', 'Trumpet'], answer: 'Gitarr' },
  { desc: '⚡', question: 'Vilket ljud gör åskan?', options: ['Visst', 'Knäpp', 'Dån', 'Pip'], answer: 'Dån' },
  { desc: '🐝', question: 'Vilket djur surrar?', options: ['Myra', 'Bi', 'Spindel', 'Mask'], answer: 'Bi' },
  { desc: '🎺', question: 'Vilket instrument blåses?', options: ['Piano', 'Gitarr', 'Trumpet', 'Violin'], answer: 'Trumpet' },
  { desc: '🌊', question: 'Vad brusar mot stranden?', options: ['Elden', 'Vinden', 'Havet', 'Regnet'], answer: 'Havet' },
  { desc: '🐦', question: 'Vilket djur kvittrar?', options: ['Hund', 'Fågel', 'Katt', 'Ko'], answer: 'Fågel' },
  { desc: '🥁', question: 'Vilket instrument trummar?', options: ['Harpa', 'Cello', 'Trumma', 'Klarinett'], answer: 'Trumma' },
  { desc: '🐺', question: 'Vilket djur ylar?', options: ['Räv', 'Varg', 'Björn', 'Älg'], answer: 'Varg' },
  { desc: '🔔', question: 'Vad ringer?', options: ['Klocka', 'Fönster', 'Dörr', 'Bord'], answer: 'Klocka' },
  { desc: '🌧️', question: 'Vad prasslar mot taket?', options: ['Snö', 'Hagel', 'Regn', 'Sol'], answer: 'Regn' },
  { desc: '🎻', question: 'Vilket instrument stryks med stråke?', options: ['Piano', 'Violin', 'Gitarr', 'Saxofon'], answer: 'Violin' },
  { desc: '🦆', question: 'Vilket djur kvackar på riktigt?', options: ['Anka', 'Höna', 'Gås', 'Tupp'], answer: 'Anka' },
  { desc: '🚂', question: 'Vad tuter och ångar?', options: ['Bil', 'Buss', 'Tåg', 'Cykel'], answer: 'Tåg' },
]

export const SoundMatchGame = memo(function SoundMatchGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [qIdx, setQIdx] = useState(0)
  const [order, setOrder] = useState<number[]>([])
  const [score, setScore] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_smd_best') ?? 0))
  const scoreRef = useRef(0)
  const nextRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const shuffle = useCallback(() => {
    const idxs = Array.from({ length: QUESTIONS.length }, (_, i) => i)
    for (let i = idxs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [idxs[i], idxs[j]] = [idxs[j], idxs[i]]
    }
    return idxs.slice(0, ROUNDS)
  }, [])

  const nextQ = useCallback((nextIdx: number) => {
    if (nextIdx >= ROUNDS) {
      const s = scoreRef.current
      const prev = Number(localStorage.getItem('k0509_smd_best') ?? 0)
      if (s > prev) localStorage.setItem('k0509_smd_best', String(s))
      onWin(s * 12, s * 42)
      setPhase('done')
      audio.achievement()
      return
    }
    setQIdx(nextIdx)
    setPicked(null)
  }, [onWin])

  const start = useCallback(() => {
    scoreRef.current = 0
    setScore(0); setPicked(null); setQIdx(0)
    const ord = shuffle()
    setOrder(ord)
    setPhase('playing')
  }, [shuffle])

  const pick = useCallback((opt: string, idx: number) => {
    if (picked !== null) return
    const q = QUESTIONS[order[idx]]
    const correct = opt === q.answer
    setPicked(opt)
    if (correct) {
      scoreRef.current++
      setScore(scoreRef.current)
      audio.coin()
    } else {
      audio.click()
    }
    nextRef.current = setTimeout(() => nextQ(idx + 1), 700)
  }, [picked, order, nextQ])

  const q = order.length > 0 ? QUESTIONS[order[qIdx]] : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🔊 Ljudmatch</span>
        <span className={styles.scoreDisplay}>{score}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🔊</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Ljudmatch</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Matcha emojin med rätt ljud eller djur! Välj bland 4 alternativ. 14 frågor.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}/{ROUNDS}</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && q && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ textAlign: 'center', padding: '20px', background: 'rgba(255,255,255,.04)', borderRadius: 18, border: '1px solid rgba(255,255,255,.1)' }}>
            <div style={{ fontSize: 64, lineHeight: 1.1, marginBottom: 8 }}>{q.desc}</div>
            <div style={{ fontSize: 15, color: '#fff', fontWeight: 700 }}>{q.question}</div>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 4 }}>({qIdx + 1}/{ROUNDS})</div>
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
                  onClick={() => pick(opt, qIdx)}
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
          <div style={{ fontSize: 52 }}>{score >= 12 ? '🏆' : score >= 8 ? '⭐' : '🔊'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{score} / {ROUNDS}</div>
          <div style={{ fontSize: 13, color: score >= 12 ? '#4ade80' : '#fbbf24' }}>
            {score >= 14 ? 'PERFEKT! 🏆' : score >= 12 ? 'Utmärkt! ⭐' : score >= 8 ? 'Bra! 👍' : 'Öva mer! 🔊'}
          </div>
          {score > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{score * 12}🪙 +{score * 42} XP</div>
          <button className="btn-primary" style={{ padding: '14px 32px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
