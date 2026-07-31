import { memo, useState, useCallback, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const WORD_PAIRS = [
  { clue: 'Vad katter säger', word: 'MJAU' },
  { clue: 'Jordens närmaste stjärna', word: 'SOL' },
  { clue: 'Söt dryck av frukt', word: 'JUS' },
  { clue: 'Grönt djur som hoppar', word: 'GRODA' },
  { clue: 'Vatten fryser till', word: 'IS' },
  { clue: 'Djur med långa öron', word: 'HARE' },
  { clue: 'Rött hjärta symboliserar', word: 'KÄRLEK' },
  { clue: 'Gul frukt med skal', word: 'BANAN' },
  { clue: 'Sover på natten, lyser', word: 'MÅNE' },
  { clue: 'Insekt som gör honung', word: 'BI' },
  { clue: 'Fyra hjul, motor', word: 'BIL' },
  { clue: 'Bokstäver på rad', word: 'ORD' },
  { clue: 'Kalla årstiden', word: 'VINTER' },
  { clue: 'Havets mjuka havdjur', word: 'FISK' },
  { clue: 'Läsa och lära', word: 'SKOLA' },
]

const GAME_TIME = 90

export const WordCrossGame = memo(function WordCrossGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [qIdx, setQIdx] = useState(0)
  const [order, setOrder] = useState<number[]>([])
  const [input, setInput] = useState('')
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_TIME)
  const [hint, setHint] = useState(false)
  const [shake, setShake] = useState(false)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_wcr_best') ?? 0))
  const scoreRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const shuffle = useCallback(() => {
    const idxs = Array.from({ length: WORD_PAIRS.length }, (_, i) => i)
    for (let i = idxs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [idxs[i], idxs[j]] = [idxs[j], idxs[i]]
    }
    return idxs
  }, [])

  const end = useCallback((s: number) => {
    if (timerRef.current) clearInterval(timerRef.current)
    const prev = Number(localStorage.getItem('k0509_wcr_best') ?? 0)
    if (s > prev) localStorage.setItem('k0509_wcr_best', String(s))
    onWin(s * 12, s * 40)
    setPhase('done')
    audio.achievement()
  }, [onWin])

  const start = useCallback(() => {
    scoreRef.current = 0
    setScore(0); setInput(''); setHint(false); setQIdx(0); setTimeLeft(GAME_TIME)
    const ord = shuffle()
    setOrder(ord)
    setPhase('playing')
    timerRef.current = setInterval(() => {
      setTimeLeft(t => { if (t <= 1) { end(scoreRef.current); return 0 } return t - 1 })
    }, 1000)
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [shuffle, end])

  const submit = useCallback(() => {
    if (order.length === 0) return
    const q = WORD_PAIRS[order[qIdx]]
    if (input.trim().toUpperCase() === q.word) {
      scoreRef.current++
      setScore(scoreRef.current)
      audio.coin()
      setHint(false)
      setInput('')
      const nextIdx = qIdx + 1
      if (nextIdx >= WORD_PAIRS.length) {
        end(scoreRef.current)
      } else {
        setQIdx(nextIdx)
      }
    } else {
      setShake(true)
      audio.click()
      setTimeout(() => setShake(false), 400)
      setInput('')
    }
    inputRef.current?.focus()
  }, [order, qIdx, input, end])

  const onKey = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') submit()
  }, [submit])

  const skip = useCallback(() => {
    setHint(false); setInput('')
    const nextIdx = qIdx + 1
    if (nextIdx >= WORD_PAIRS.length || nextIdx >= order.length) {
      end(scoreRef.current)
    } else {
      setQIdx(nextIdx)
    }
    inputRef.current?.focus()
  }, [qIdx, order, end])

  const timerColor = timeLeft > 45 ? '#4ade80' : timeLeft > 20 ? '#fbbf24' : '#f87171'
  const q = order.length > 0 ? WORD_PAIRS[order[qIdx]] : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>📝 Ordkryss</span>
        <span className={styles.scoreDisplay}>{score}p</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>📝</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Ordkryss</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Läs ledtråden och skriv rätt ord. Hoppa över svåra ord och lösa nästa. 90 sekunder.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}p</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && q && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'rgba(255,255,255,.08)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(timeLeft / GAME_TIME) * 100}%`, background: timerColor, transition: 'width 1s linear' }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 900, color: timerColor }}>{timeLeft}s</span>
          </div>

          <div style={{
            padding: '20px', borderRadius: 18, textAlign: 'center',
            background: 'rgba(255,255,255,.04)', border: `1px solid ${shake ? 'rgba(248,113,113,.5)' : 'rgba(255,255,255,.1)'}`,
            transition: 'border .2s',
          }}>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 8 }}>Ledtråd ({qIdx + 1}/{WORD_PAIRS.length}):</div>
            <div style={{ fontFamily: 'var(--ff-head)', fontSize: 20, fontWeight: 900, color: '#fbbf24', lineHeight: 1.4 }}>{q.clue}</div>
            {hint && <div style={{ fontSize: 12, color: '#60a5fa', marginTop: 8 }}>Första bokstav: {q.word[0]}, {q.word.length} bokstäver</div>}
          </div>

          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value.toUpperCase())}
            onKeyDown={onKey}
            placeholder="Skriv ordet..."
            style={{ fontSize: 22, fontWeight: 900, textAlign: 'center', padding: '14px', background: 'rgba(255,255,255,.06)', border: '2px solid rgba(255,255,255,.15)', borderRadius: 14, color: '#fff', width: '100%', boxSizing: 'border-box' }}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <button onClick={submit} className="btn-primary" style={{ padding: '12px 8px', fontSize: 14 }}>Svara</button>
            <button onClick={() => setHint(true)} disabled={hint} style={{ padding: '12px 8px', borderRadius: 12, background: 'rgba(96,165,250,.15)', border: '1px solid rgba(96,165,250,.3)', color: '#60a5fa', cursor: 'pointer', fontSize: 12 }}>💡 Ledtråd</button>
            <button onClick={skip} style={{ padding: '12px 8px', borderRadius: 12, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', color: '#888', cursor: 'pointer', fontSize: 12 }}>Hoppa →</button>
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{score >= 10 ? '🏆' : score >= 6 ? '⭐' : '📝'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{score} ord</div>
          <div style={{ fontSize: 13, color: score >= 10 ? '#4ade80' : '#fbbf24' }}>
            {score >= 14 ? 'ORDMÄSTARE! 🏆' : score >= 10 ? 'Utmärkt! ⭐' : score >= 6 ? 'Bra! 👍' : 'Öva mer! 📝'}
          </div>
          {score > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{score * 12}🪙 +{score * 40} XP</div>
          <button className="btn-primary" style={{ padding: '14px 32px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
