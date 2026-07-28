import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const WORD_BANK = ['KATT','TIGER','RÄKA','KANEL','LEMON','NÖT','TALL','LEJON','NYCKEL','LINS','SOPPA','ÄPPLE','ELEFANT','TIGER','ROBOT','TACK','KLOV','VÄXT','TÄLT','LAND','DRAKE','EKAN','NATT','TAPIR','RÄV']

const GAME_TIME = 60

function isValidWord(word: string): boolean {
  return WORD_BANK.includes(word.toUpperCase()) || word.length >= 3
}

function lastLetter(word: string): string {
  return word.slice(-1).toUpperCase()
}

function firstLetter(word: string): string {
  return word.charAt(0).toUpperCase()
}

function getComputerWord(letter: string, used: string[]): string | null {
  const words = WORD_BANK.filter(w => firstLetter(w) === letter && !used.includes(w))
  return words.length > 0 ? words[Math.floor(Math.random() * words.length)] : null
}

export const WordChainGame = memo(function WordChainGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [chain, setChain] = useState<{ word: string; player: boolean }[]>([])
  const [input, setInput] = useState('')
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_TIME)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [used, setUsed] = useState<string[]>([])
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_wchain_best') ?? 0))
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const scoreRef = useRef(0)

  const start = useCallback(() => {
    const first = WORD_BANK[Math.floor(Math.random() * WORD_BANK.length)]
    scoreRef.current = 0
    setChain([{ word: first, player: false }])
    setUsed([first]); setInput(''); setScore(0); setTimeLeft(GAME_TIME); setFeedback(null)
    setPhase('playing')
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [])

  useEffect(() => {
    if (phase !== 'playing') return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!)
          const s = scoreRef.current
          const prev = Number(localStorage.getItem('k0509_wchain_best') ?? 0)
          if (s > prev) localStorage.setItem('k0509_wchain_best', String(s))
          onWin(s * 8, s * 15)
          audio.achievement()
          setPhase('done')
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current!)
  }, [phase, onWin])

  const handleSubmit = useCallback(() => {
    const word = input.trim().toUpperCase()
    if (!word) return
    const lastWord = chain[chain.length - 1]?.word ?? ''
    const needed = lastLetter(lastWord)

    if (firstLetter(word) !== needed) {
      setFeedback(`❌ Måste börja på "${needed}"!`)
      setTimeout(() => setFeedback(null), 1500)
      audio.click(); return
    }
    if (used.includes(word)) {
      setFeedback('❌ Redan använt!')
      setTimeout(() => setFeedback(null), 1500)
      audio.click(); return
    }
    if (!isValidWord(word)) {
      setFeedback('❌ Ogiltigt ord!')
      setTimeout(() => setFeedback(null), 1500)
      audio.click(); return
    }

    const newUsed = [...used, word]
    const newChain = [...chain, { word, player: true }]
    const newScore = scoreRef.current + 1
    scoreRef.current = newScore; setScore(newScore); setUsed(newUsed); setInput('')
    audio.coin()

    // Computer's turn
    const compWord = getComputerWord(lastLetter(word), newUsed)
    if (compWord) {
      setTimeout(() => {
        setChain(c => [...c, { word: compWord, player: false }])
        setUsed(u => [...u, compWord])
        setFeedback(null)
        inputRef.current?.focus()
      }, 600)
    } else {
      setFeedback('🏆 Datorn ger upp! Du vann!')
      const bonus = newScore + 5; scoreRef.current = bonus; setScore(bonus)
    }
    setChain(newChain)
  }, [input, chain, used])

  const handleKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter') handleSubmit() }
  const lastWord = chain[chain.length - 1]?.word ?? ''
  const needed = lastLetter(lastWord)
  const timerColor = timeLeft > 30 ? '#4ade80' : timeLeft > 10 ? '#fbbf24' : '#f87171'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🔗 Ordkedja</span>
        <span className={styles.scoreDisplay}>{score} ord · <span style={{ color: timerColor }}>{timeLeft}s</span></span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🔗</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Ordkedja</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Skriv ett ord som börjar på sista bokstaven!<br />Spela mot datorn · 60 sekunder
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore} ord</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,.08)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(timeLeft / GAME_TIME) * 100}%`, background: timerColor, transition: 'width 1s linear', borderRadius: 2 }} />
            </div>
          </div>
          <div style={{ fontSize: 13, textAlign: 'center', color: '#818cf8', fontWeight: 700 }}>Nästa ord börjar på: <span style={{ fontSize: 22 }}>{needed}</span></div>
          {feedback && <div style={{ textAlign: 'center', fontSize: 13, color: feedback.startsWith('🏆') ? '#4ade80' : '#f87171', padding: '6px', background: 'rgba(255,255,255,.04)', borderRadius: 8 }}>{feedback}</div>}
          <div style={{ maxHeight: 140, overflowY: 'auto', display: 'flex', flexWrap: 'wrap', gap: 6, padding: '8px', background: 'rgba(255,255,255,.03)', borderRadius: 12 }}>
            {chain.slice(-12).map((c, i) => (
              <span key={i} style={{ padding: '3px 8px', borderRadius: 6, fontSize: 12, background: c.player ? 'rgba(129,140,248,.2)' : 'rgba(255,255,255,.06)', border: `1px solid ${c.player ? 'rgba(129,140,248,.3)' : 'rgba(255,255,255,.1)'}`, color: c.player ? '#818cf8' : '#888' }}>{c.word}</span>
            ))}
          </div>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value.toUpperCase())}
            onKeyDown={handleKey}
            style={{ padding: '12px 14px', borderRadius: 12, fontSize: 16, background: 'rgba(255,255,255,.06)', border: '2px solid rgba(255,255,255,.15)', color: '#e8e8f0', outline: 'none', letterSpacing: 2, fontFamily: 'var(--ff-head)', fontWeight: 700 }}
            placeholder={`Ord som börjar på ${needed}...`}
            autoComplete="off" spellCheck={false}
          />
          <button className="btn-primary" onClick={handleSubmit} style={{ padding: '12px' }}>Skicka!</button>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{score >= 10 ? '🏆' : score >= 5 ? '⭐' : '🔗'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{score} ord!</div>
          {score > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{score * 8}🪙 +{score * 15} XP</div>
          <button className="btn-primary" style={{ padding: '12px 28px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
