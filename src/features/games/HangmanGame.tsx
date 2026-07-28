import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const WORDS = [
  { word: 'KATT', hint: 'Djur som jamar' },
  { word: 'PIANO', hint: 'Musikinstrument' },
  { word: 'DRAGON', hint: 'Mytologiskt eldfyrand djur' },
  { word: 'Sverige', hint: 'Land i Skandinavien' },
  { word: 'STJARNA', hint: 'Lyser på himlen om natten' },
  { word: 'FOTBOLL', hint: 'Populär sport' },
  { word: 'REGNBÅGE', hint: 'Sju färger efter regn' },
  { word: 'TRUMPET', hint: 'Blåsinstrument av mässing' },
  { word: 'KAMEL', hint: 'Ökendjur med puckel' },
  { word: 'VULKAN', hint: 'Spyr lava' },
  { word: 'PINGVIN', hint: 'Fågel som inte flyger' },
  { word: 'CHOKLAD', hint: 'Sött som görs av kakao' },
  { word: 'ROBOT', hint: 'Mekanisk maskin' },
  { word: 'SPINDEL', hint: 'Spindlar har åtta ben' },
  { word: 'MAGNET', hint: 'Attraherar järn' },
  { word: 'BIBLIOTEK', hint: 'Låna böcker här' },
  { word: 'GITARR', hint: 'Stränginstrument' },
  { word: 'FJÄRIL', hint: 'Kläcks ur en kokong' },
  { word: 'MOLN', hint: 'Vattenånga i himlen' },
  { word: 'HAJAR', hint: 'Farliga rovfiskar' },
]

const MAX_WRONG = 6
const ROUNDS = 4

export const HangmanGame = memo(function HangmanGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [words, setWords] = useState<typeof WORDS>([])
  const [wordIdx, setWordIdx] = useState(0)
  const [guessed, setGuessed] = useState<Set<string>>(new Set())
  const [wrong, setWrong] = useState(0)
  const [score, setScore] = useState(0)
  const [roundFeedback, setRoundFeedback] = useState<'won' | 'lost' | null>(null)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_hangman_best') ?? 0))
  const nextRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const current = words[wordIdx]

  const getDisplay = (word: string) => word.split('').map(ch => guessed.has(ch) ? ch : '_').join(' ')
  const isWon = current ? current.word.split('').every(ch => guessed.has(ch)) : false
  const isLost = wrong >= MAX_WRONG

  useEffect(() => {
    if (!current) return
    if (isWon) {
      setRoundFeedback('won')
      setScore(s => s + Math.max(1, MAX_WRONG - wrong))
      audio.coin()
      nextRef.current = setTimeout(() => {
        setRoundFeedback(null)
        if (wordIdx + 1 >= ROUNDS) setPhase('done')
        else { setWordIdx(i => i + 1); setGuessed(new Set()); setWrong(0) }
      }, 1200)
    } else if (isLost) {
      setRoundFeedback('lost')
      audio.click()
      nextRef.current = setTimeout(() => {
        setRoundFeedback(null)
        if (wordIdx + 1 >= ROUNDS) setPhase('done')
        else { setWordIdx(i => i + 1); setGuessed(new Set()); setWrong(0) }
      }, 1500)
    }
    return () => { if (nextRef.current) clearTimeout(nextRef.current) }
  }, [isWon, isLost, wordIdx, wrong, current])

  const guess = useCallback((letter: string) => {
    if (guessed.has(letter) || isWon || isLost || roundFeedback) return
    const newGuessed = new Set([...guessed, letter])
    setGuessed(newGuessed)
    if (current && !current.word.includes(letter)) {
      setWrong(w => w + 1)
      audio.click()
    } else audio.tap()
  }, [guessed, isWon, isLost, roundFeedback, current])

  const start = useCallback(() => {
    const pool = [...WORDS].sort(() => Math.random() - 0.5).slice(0, ROUNDS)
    setWords(pool); setWordIdx(0); setGuessed(new Set()); setWrong(0); setScore(0); setRoundFeedback(null)
    setPhase('playing')
  }, [])

  useEffect(() => {
    if (phase === 'done') {
      const prev = Number(localStorage.getItem('k0509_hangman_best') ?? 0)
      if (score > prev) localStorage.setItem('k0509_hangman_best', String(score))
      onWin(score * 20, score * 25)
      audio.achievement()
    }
  }, [phase, score, onWin])

  const KEYBOARD = 'ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ'.split('')
  const hangParts = ['○', '|', '/', '\\', '/', '\\']
  const WRONG_DISPLAY = ['😀','😅','😓','😰','😱','😵','💀']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🔡 Hänga Gubbe</span>
        <span className={styles.scoreDisplay}>{score} · {wordIdx + (phase === 'playing' ? 1 : 0)}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🔡</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Hänga Gubbe</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Gissa det dolda ordet bokstav för bokstav!<br />{ROUNDS} ord · Max {MAX_WRONG} fel per ord
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore} poäng</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && current && (
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--t3)' }}>Ord {wordIdx + 1}/{ROUNDS}</div>
            <div style={{ fontSize: 28 }}>{WRONG_DISPLAY[wrong]}</div>
            <div style={{ fontSize: 11, color: '#f87171' }}>Fel: {wrong}/{MAX_WRONG}</div>
          </div>

          <div style={{
            background: roundFeedback === 'won' ? 'rgba(74,222,128,.1)' : roundFeedback === 'lost' ? 'rgba(248,113,113,.1)' : 'rgba(255,255,255,.04)',
            border: `1px solid ${roundFeedback === 'won' ? 'rgba(74,222,128,.4)' : roundFeedback === 'lost' ? 'rgba(248,113,113,.4)' : 'rgba(255,255,255,.1)'}`,
            borderRadius: 16, padding: '18px 16px', textAlign: 'center', transition: 'all .2s',
          }}>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 10 }}>Tips: {current.hint}</div>
            <div style={{ letterSpacing: 8, fontSize: 26, fontWeight: 900, fontFamily: 'monospace', color: '#e8e8f0' }}>
              {getDisplay(current.word)}
            </div>
            {roundFeedback === 'won' && <div style={{ marginTop: 8, color: '#4ade80', fontWeight: 700 }}>✓ {current.word}!</div>}
            {roundFeedback === 'lost' && <div style={{ marginTop: 8, color: '#f87171', fontWeight: 700 }}>✗ Svaret var: {current.word}</div>}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, justifyContent: 'center' }}>
            {KEYBOARD.map(ch => {
              const used = guessed.has(ch)
              const correct = used && current.word.includes(ch)
              const incorrect = used && !current.word.includes(ch)
              return (
                <button
                  key={ch}
                  onClick={() => guess(ch)}
                  disabled={used || !!roundFeedback}
                  style={{
                    width: 32, height: 32, borderRadius: 8, fontSize: 11, fontWeight: 900,
                    background: correct ? 'rgba(74,222,128,.2)' : incorrect ? 'rgba(248,113,113,.1)' : 'rgba(255,255,255,.07)',
                    border: `1px solid ${correct ? 'rgba(74,222,128,.5)' : incorrect ? 'rgba(248,113,113,.3)' : 'rgba(255,255,255,.1)'}`,
                    color: correct ? '#4ade80' : incorrect ? '#f87171' : '#e8e8f0',
                    cursor: used ? 'default' : 'pointer', opacity: used ? 0.5 : 1,
                  }}
                >{ch}</button>
              )
            })}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{score >= 15 ? '🏆' : score >= 8 ? '⭐' : '🔡'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{score} poäng</div>
          <div style={{ fontSize: 14, color: score >= 15 ? '#4ade80' : '#fbbf24' }}>
            {score >= 15 ? 'Ordmästare! 🏆' : score >= 8 ? 'Bra! ⭐' : 'Öva mer! 🔡'}
          </div>
          {score > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{score * 20}🪙 +{score * 25} XP</div>
          <button className="btn-primary" style={{ padding: '14px 32px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
