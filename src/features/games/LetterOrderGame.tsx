import { memo, useState, useCallback, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const ROUNDS = 10

const WORDS = [
  'KATT', 'HUND', 'FISK', 'FÅRA', 'BJÖRN', 'LEJON', 'TIGER', 'ANKA',
  'ÄPPLE', 'BANAN', 'CITRON', 'MANGO', 'KÖRSBÄR', 'JORDGUBB',
  'SKOLA', 'CYKEL', 'LAMPA', 'FÖNSTER', 'TAVLA', 'KUDDE',
  'SOMMAR', 'VINTER', 'HÖST', 'REGN', 'SNÖBOLL',
  'RYMD', 'PLANET', 'STJÄRNA', 'KOMET', 'GALAX',
]

function makeRound(difficulty: number) {
  const pool = difficulty < 4 ? WORDS.filter(w => w.length <= 5) : WORDS
  const word = pool[Math.floor(Math.random() * pool.length)]
  const letters = word.split('').sort(() => Math.random() - 0.5)
  while (letters.join('') === word) letters.sort(() => Math.random() - 0.5)
  return { word, letters }
}

export const LetterOrderGame = memo(function LetterOrderGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'play' | 'feedback' | 'done'>('ready')
  const [round, setRound] = useState(0)
  const [q, setQ] = useState(() => makeRound(0))
  const [selected, setSelected] = useState<number[]>([])
  const [score, setScore] = useState(0)
  const [wasCorrect, setWasCorrect] = useState(false)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_log_best') ?? 0))
  const scoreRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const nextRound = useCallback((r: number) => {
    if (r >= ROUNDS) {
      const s = scoreRef.current
      const prev = Number(localStorage.getItem('k0509_log_best') ?? 0)
      if (s > prev) localStorage.setItem('k0509_log_best', String(s))
      onWin(s * 22, s * 66)
      setPhase('done')
      audio.achievement()
      return
    }
    setQ(makeRound(Math.floor(r / 3)))
    setSelected([])
    setRound(r)
    setPhase('play')
  }, [onWin])

  const start = useCallback(() => {
    scoreRef.current = 0
    setScore(0)
    nextRound(0)
  }, [nextRound])

  const pickLetter = useCallback((idx: number) => {
    if (phase !== 'play' || selected.includes(idx)) return
    const newSelected = [...selected, idx]
    setSelected(newSelected)
    if (newSelected.length === q.letters.length) {
      const formed = newSelected.map(i => q.letters[i]).join('')
      const correct = formed === q.word
      setWasCorrect(correct)
      if (correct) { scoreRef.current++; setScore(scoreRef.current); audio.coin() } else { audio.click() }
      setPhase('feedback')
      timerRef.current = setTimeout(() => nextRound(round + 1), 1200)
    }
  }, [phase, selected, q, round, nextRound])

  const removeLast = useCallback(() => {
    if (phase !== 'play' || selected.length === 0) return
    setSelected(prev => prev.slice(0, -1))
  }, [phase, selected])

  const formed = selected.map(i => q.letters[i]).join('')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🔡 Bokstavsordning</span>
        <span className={styles.scoreDisplay}>{score}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🔡</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Bokstavsordning</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Tryck bokstäverna i rätt ordning för att bilda ett ord! {ROUNDS} ord.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}/{ROUNDS}</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'play' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 11, color: 'var(--t3)', textAlign: 'center' }}>Ord {round + 1}/{ROUNDS}</div>
          <div style={{ background: 'rgba(255,255,255,.05)', borderRadius: 16, padding: '20px 14px', minHeight: 58, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {formed.length > 0 ? (
              formed.split('').map((l, i) => (
                <span key={i} style={{ fontSize: 28, fontWeight: 900, color: '#fff', background: 'rgba(68,136,255,.2)', borderRadius: 8, padding: '4px 10px', border: '1px solid rgba(68,136,255,.4)' }}>{l}</span>
              ))
            ) : (
              <span style={{ fontSize: 14, color: 'var(--t3)' }}>Tryck bokstäverna i rätt ordning…</span>
            )}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
            {q.letters.map((l, i) => (
              <button
                key={i}
                onClick={() => pickLetter(i)}
                disabled={selected.includes(i)}
                style={{
                  width: 50, height: 50, borderRadius: 12, fontSize: 20, fontWeight: 900,
                  background: selected.includes(i) ? 'rgba(255,255,255,.03)' : 'rgba(255,255,255,.1)',
                  color: selected.includes(i) ? 'rgba(255,255,255,.2)' : '#fff',
                  border: `2px solid ${selected.includes(i) ? 'rgba(255,255,255,.05)' : 'rgba(255,255,255,.2)'}`,
                  cursor: selected.includes(i) ? 'default' : 'pointer',
                }}
              >{l}</button>
            ))}
          </div>
          {selected.length > 0 && (
            <button onClick={removeLast} style={{ padding: '8px 16px', borderRadius: 10, background: 'rgba(248,113,113,.12)', color: '#f87171', border: '1px solid rgba(248,113,113,.3)', cursor: 'pointer', fontSize: 12, fontWeight: 700, alignSelf: 'center' }}>
              ← Ångra sista
            </button>
          )}
        </div>
      )}

      {phase === 'feedback' && (
        <div style={{ padding: '32px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 52 }}>{wasCorrect ? '✅' : '❌'}</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#fff', letterSpacing: 4 }}>{q.word}</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: wasCorrect ? '#4ade80' : '#f87171' }}>
            {wasCorrect ? 'Rätt! 🎯' : `Fel! Du stavade ${formed}`}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{score >= 8 ? '🏆' : score >= 6 ? '⭐' : '🔡'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{score} / {ROUNDS}</div>
          <div style={{ fontSize: 13, color: score >= 8 ? '#4ade80' : '#fbbf24' }}>
            {score === 10 ? 'PERFEKT! 🏆' : score >= 8 ? 'Utmärkt! ⭐' : score >= 6 ? 'Bra! 👍' : 'Öva mer! 🔡'}
          </div>
          {score > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{score * 22}🪙 +{score * 66} XP</div>
          <button className="btn-primary" style={{ padding: '14px 32px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
