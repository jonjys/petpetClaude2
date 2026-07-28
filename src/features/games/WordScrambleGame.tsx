import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const WORDS = [
  'KATT', 'HUND', 'FISK', 'FÅGEL', 'BJÖRN', 'TIGER', 'LEJON', 'HÄST', 'ÄLG', 'VARG',
  'PIZZA', 'GLASS', 'ÄPPLE', 'BANAN', 'MELON', 'CITRON', 'JORDGUBBE',
  'SKOLA', 'BOKEN', 'STOL', 'BORD', 'LAMPA', 'DÖRR', 'FÖNSTER',
  'Sverige', 'PARIS', 'LONDON', 'TOKYO', 'BERLIN',
  'SOL', 'MÅN', 'STJÄRNA', 'PLANET', 'RYMD', 'KOMET',
  'MUSIK', 'GITARR', 'PIANO', 'TRUMMA', 'VIOLIN',
  'SPORT', 'FOTBOLL', 'TENNIS', 'BASKET', 'SIMNING',
]

const ROUND_COUNT = 6
const TIME_PER_WORD = 15

function scramble(word: string): string {
  const arr = word.split('')
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  const result = arr.join('')
  return result === word ? scramble(word) : result
}

export const WordScrambleGame = memo(function WordScrambleGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [words, setWords] = useState<string[]>([])
  const [wordIdx, setWordIdx] = useState(0)
  const [scrambled, setScrambled] = useState('')
  const [guess, setGuess] = useState('')
  const [correct, setCorrect] = useState(0)
  const [timeLeft, setTimeLeft] = useState(TIME_PER_WORD)
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_word_best') ?? 0))
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const nextWord = useCallback((wasCorrect: boolean) => {
    if (wasCorrect) setCorrect(c => c + 1)
    setFeedback(wasCorrect ? 'correct' : 'wrong')
    setTimeout(() => {
      setFeedback(null)
      setGuess('')
      if (wordIdx + 1 >= ROUND_COUNT) {
        setPhase('done')
      } else {
        setWordIdx(i => i + 1)
        setTimeLeft(TIME_PER_WORD)
      }
    }, 700)
  }, [wordIdx])

  useEffect(() => {
    if (wordIdx < words.length) {
      setScrambled(scramble(words[wordIdx]))
    }
  }, [wordIdx, words])

  useEffect(() => {
    if (phase !== 'playing') return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!)
          nextWord(false)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase, wordIdx, nextWord])

  const start = useCallback(() => {
    const pool = [...WORDS].sort(() => Math.random() - 0.5).slice(0, ROUND_COUNT)
    setWords(pool); setWordIdx(0); setCorrect(0); setGuess(''); setFeedback(null)
    setTimeLeft(TIME_PER_WORD)
    setPhase('playing')
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [])

  const submit = useCallback(() => {
    if (!words[wordIdx] || feedback) return
    if (timerRef.current) clearInterval(timerRef.current)
    const isCorrect = guess.trim().toUpperCase() === words[wordIdx]
    if (isCorrect) audio.coin(); else audio.click()
    nextWord(isCorrect)
  }, [guess, words, wordIdx, feedback, nextWord])

  useEffect(() => {
    if (phase === 'done') {
      const prev = Number(localStorage.getItem('k0509_word_best') ?? 0)
      if (correct > prev) localStorage.setItem('k0509_word_best', String(correct))
      onWin(correct * 15 + (correct >= ROUND_COUNT ? 60 : 0), correct * 20)
      audio.achievement()
    }
  }, [phase, correct, onWin])

  const timerColor = timeLeft > 8 ? '#4ade80' : timeLeft > 4 ? '#fbbf24' : '#f87171'
  const word = words[wordIdx]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>📝 Ordvrak</span>
        <span className={styles.scoreDisplay}>{correct}/{wordIdx}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>📝</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Ordvrak!</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260 }}>
            {ROUND_COUNT} ord · {TIME_PER_WORD} sekunder per ord · Avkoda bokstäverna!
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}/{ROUND_COUNT}</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && word && (
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,.08)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(timeLeft / TIME_PER_WORD) * 100}%`, background: timerColor, borderRadius: 2, transition: 'width 1s linear, background .3s' }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 900, color: timerColor }}>{timeLeft}s</span>
            <span style={{ fontSize: 11, color: 'var(--t3)' }}>Ord {wordIdx + 1}/{ROUND_COUNT}</span>
          </div>

          <div style={{
            background: feedback === 'correct' ? 'rgba(74,222,128,.12)' : feedback === 'wrong' ? 'rgba(248,113,113,.12)' : 'rgba(255,255,255,.05)',
            border: `1px solid ${feedback === 'correct' ? 'rgba(74,222,128,.4)' : feedback === 'wrong' ? 'rgba(248,113,113,.4)' : 'rgba(255,255,255,.1)'}`,
            borderRadius: 16, padding: '24px 16px', textAlign: 'center', transition: 'all .2s',
          }}>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 10 }}>Omdana detta ord:</div>
            <div style={{ letterSpacing: 10, fontSize: 28, fontWeight: 900, color: '#fff', fontFamily: 'monospace' }}>
              {scrambled}
            </div>
            {feedback === 'wrong' && (
              <div style={{ fontSize: 13, color: '#f87171', marginTop: 8, fontWeight: 700 }}>✗ Rätt svar: {word}</div>
            )}
            {feedback === 'correct' && (
              <div style={{ fontSize: 13, color: '#4ade80', marginTop: 8, fontWeight: 700 }}>✓ Rätt!</div>
            )}
          </div>

          {!feedback && (
            <>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  ref={inputRef}
                  value={guess}
                  onChange={e => setGuess(e.target.value.toUpperCase())}
                  onKeyDown={e => { if (e.key === 'Enter') submit() }}
                  placeholder="Skriv ordet..."
                  style={{
                    flex: 1, padding: '12px 14px', borderRadius: 12,
                    background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.15)',
                    color: '#fff', fontSize: 15, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase',
                    outline: 'none',
                  }}
                />
                <button className="btn-primary" style={{ padding: '12px 16px' }} onClick={submit}>✓</button>
              </div>
              {/* Letter hints */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 4, flexWrap: 'wrap' }}>
                {scrambled.split('').map((ch, i) => (
                  <div key={i} style={{ width: 32, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.08)', borderRadius: 8, fontSize: 14, fontWeight: 900, color: '#e8e8f0', border: '1px solid rgba(255,255,255,.1)' }}>{ch}</div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{correct >= ROUND_COUNT ? '🏆' : correct >= Math.ceil(ROUND_COUNT / 2) ? '⭐' : '📝'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{correct}/{ROUND_COUNT}</div>
          <div style={{ fontSize: 14, color: correct >= ROUND_COUNT ? '#4ade80' : '#fbbf24' }}>
            {correct >= ROUND_COUNT ? 'PERFEKT! 🌟' : correct >= Math.ceil(ROUND_COUNT / 2) ? 'Bra jobbat! ⭐' : 'Öva mer! 💪'}
          </div>
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{correct * 15 + (correct >= ROUND_COUNT ? 60 : 0)}🪙 +{correct * 20} XP</div>
          {correct > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <button className="btn-primary" style={{ padding: '14px 32px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
