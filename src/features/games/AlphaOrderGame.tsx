import { memo, useState, useCallback, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const ROUNDS = 10
const WORDS = [
  'KATT', 'HUND', 'FISK', 'FÅGEL', 'BJÖRN', 'LEJON', 'TIGER', 'HÄST',
  'KANIN', 'ANKA', 'RÅTTA', 'ÖRNEN', 'PANDA', 'ZEBRA', 'KOALA', 'ÄLGEN',
  'ELEFANT', 'GIRAFF', 'DELFIN', 'PINGVIN', 'FLAMINGO', 'KROKODIL',
  'LABYRINT', 'STJÄRNA', 'PLANET', 'ROBOT', 'MAGNET', 'TRUMPET',
]

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

function getRound(r: number) {
  const pool = WORDS.filter(w => w.length >= 4 + Math.floor(r / 3))
  const word = pool[Math.floor(Math.random() * pool.length)] || WORDS[r % WORDS.length]
  const letters = shuffle(word.split(''))
  return { word, letters }
}

export const AlphaOrderGame = memo(function AlphaOrderGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'play' | 'feedback' | 'done'>('ready')
  const [round, setRound] = useState(0)
  const [word, setWord] = useState('')
  const [letters, setLetters] = useState<string[]>([])
  const [tapped, setTapped] = useState<string[]>([])
  const [usedIdx, setUsedIdx] = useState<number[]>([])
  const [score, setScore] = useState(0)
  const [wasCorrect, setWasCorrect] = useState(false)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_aog_best') ?? 0))
  const scoreRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const nextRound = useCallback((r: number) => {
    if (r >= ROUNDS) {
      const s = scoreRef.current
      const prev = Number(localStorage.getItem('k0509_aog_best') ?? 0)
      if (s > prev) localStorage.setItem('k0509_aog_best', String(s))
      onWin(s * 16, s * 50)
      setPhase('done')
      audio.achievement()
      return
    }
    const { word: w, letters: ls } = getRound(r)
    setWord(w)
    setLetters(ls)
    setTapped([])
    setUsedIdx([])
    setRound(r)
    setPhase('play')
  }, [onWin])

  const start = useCallback(() => {
    scoreRef.current = 0
    setScore(0)
    nextRound(0)
  }, [nextRound])

  const tapLetter = useCallback((letter: string, idx: number) => {
    if (usedIdx.includes(idx)) return
    const sorted = [...word].sort()
    const nextExpected = sorted[tapped.length]
    if (letter !== nextExpected) {
      setWasCorrect(false)
      setPhase('feedback')
      audio.click()
      timerRef.current = setTimeout(() => nextRound(round + 1), 1000)
      return
    }
    const newTapped = [...tapped, letter]
    setTapped(newTapped)
    setUsedIdx(prev => [...prev, idx])
    if (newTapped.length === word.length) {
      scoreRef.current++
      setScore(scoreRef.current)
      setWasCorrect(true)
      setPhase('feedback')
      audio.coin()
      timerRef.current = setTimeout(() => nextRound(round + 1), 900)
    }
  }, [usedIdx, word, tapped, round, nextRound])

  const sorted = [...word].sort()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🔤 Bokstavsordning</span>
        <span className={styles.scoreDisplay}>{score}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🔤</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Bokstavsordning</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Tryck på bokstäverna i alfabetisk ordning! Orden blir längre för varje runda. 10 ronder.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}/{ROUNDS}</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'play' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--t3)', textAlign: 'center' }}>
            Tryck A→Ö ({round + 1}/{ROUNDS})
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap', minHeight: 40 }}>
            {tapped.map((l, i) => (
              <div key={i} style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(74,222,128,.2)', border: '2px solid #4ade80', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#4ade80' }}>
                {l}
              </div>
            ))}
            {tapped.length < word.length && (
              <div style={{ width: 36, height: 36, borderRadius: 8, border: '2px dashed rgba(255,255,255,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t3)', fontSize: 18 }}>
                ?
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
            {letters.map((l, i) => {
              const used = usedIdx.includes(i)
              return (
                <button
                  key={i}
                  onClick={() => tapLetter(l, i)}
                  disabled={used}
                  style={{
                    width: 52, height: 52, borderRadius: 12,
                    fontFamily: 'var(--ff-head)', fontSize: 20, fontWeight: 900,
                    color: used ? 'rgba(255,255,255,.2)' : '#fff',
                    background: used ? 'rgba(255,255,255,.03)' : 'rgba(255,255,255,.1)',
                    border: used ? '2px solid rgba(255,255,255,.05)' : '2px solid rgba(255,255,255,.2)',
                    cursor: used ? 'default' : 'pointer',
                  }}
                >
                  {l}
                </button>
              )
            })}
          </div>
          <div style={{ fontSize: 10, color: 'var(--t3)', textAlign: 'center' }}>
            Nästa: {tapped.length < sorted.length ? sorted[tapped.length] : '—'}
          </div>
        </div>
      )}

      {phase === 'feedback' && (
        <div style={{ padding: '32px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 52 }}>{wasCorrect ? '✅' : '❌'}</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: wasCorrect ? '#4ade80' : '#f87171' }}>
            {wasCorrect ? 'Rätt ordning!' : `Fel! Rätt: ${[...word].sort().join(' ')}`}
          </div>
          <div style={{ fontSize: 13, color: 'var(--t3)' }}>Ordet: {word}</div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{score >= 8 ? '🏆' : score >= 5 ? '⭐' : '🔤'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{score} / {ROUNDS}</div>
          <div style={{ fontSize: 13, color: score >= 8 ? '#4ade80' : '#fbbf24' }}>
            {score === 10 ? 'PERFEKT! 🏆' : score >= 8 ? 'Utmärkt! ⭐' : score >= 5 ? 'Bra! 👍' : 'Öva mer! 🔤'}
          </div>
          {score > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{score * 16}🪙 +{score * 50} XP</div>
          <button className="btn-primary" style={{ padding: '14px 32px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
