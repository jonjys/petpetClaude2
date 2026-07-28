import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const BASE_SHOW_MS = 1800
const ROUNDS = 6

function generateSequence(length: number): number[] {
  return Array.from({ length }, () => Math.floor(Math.random() * 9) + 1)
}

export const NumberMemoryGame = memo(function NumberMemoryGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'show' | 'input' | 'feedback' | 'done'>('ready')
  const [round, setRound] = useState(0)
  const [sequence, setSequence] = useState<number[]>([])
  const [guess, setGuess] = useState('')
  const [correct, setCorrect] = useState(0)
  const [feedback, setFeedback] = useState<boolean | null>(null)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_numMem_best') ?? 0))
  const inputRef = useRef<HTMLInputElement>(null)

  const seqLength = useCallback((r: number) => Math.min(3 + r, 9), [])

  const nextRound = useCallback((wasCorrect: boolean) => {
    if (wasCorrect) { setCorrect(c => c + 1); audio.coin() } else audio.click()
    setFeedback(wasCorrect)
    setPhase('feedback')
    setTimeout(() => {
      setFeedback(null)
      if (round + 1 >= ROUNDS) {
        setPhase('done')
      } else {
        const r = round + 1
        setRound(r)
        const seq = generateSequence(seqLength(r))
        setSequence(seq)
        setGuess('')
        setPhase('show')
        setTimeout(() => {
          setPhase('input')
          setTimeout(() => inputRef.current?.focus(), 50)
        }, BASE_SHOW_MS + r * 200)
      }
    }, 1000)
  }, [round, seqLength])

  const start = useCallback(() => {
    setRound(0); setCorrect(0); setGuess(''); setFeedback(null)
    const seq = generateSequence(seqLength(0))
    setSequence(seq)
    setPhase('show')
    setTimeout(() => {
      setPhase('input')
      setTimeout(() => inputRef.current?.focus(), 50)
    }, BASE_SHOW_MS)
  }, [seqLength])

  const submit = useCallback(() => {
    const target = sequence.join('')
    nextRound(guess === target)
  }, [guess, sequence, nextRound])

  useEffect(() => {
    if (phase === 'done') {
      const prev = Number(localStorage.getItem('k0509_numMem_best') ?? 0)
      if (correct > prev) localStorage.setItem('k0509_numMem_best', String(correct))
      onWin(correct * 25 + (correct >= ROUNDS ? 80 : 0), correct * 35)
      audio.achievement()
    }
  }, [phase, correct, onWin])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🔢 Sifferminne</span>
        <span className={styles.scoreDisplay}>{correct}/{round}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🔢</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Sifferminne</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Memorera siffersekvensen och skriv in den!<br />
            Börjar med 3 siffror, ökar varje runda.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}/{ROUNDS}</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'show' && (
        <div style={{ padding: '24px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: 'var(--t3)', marginBottom: 16 }}>Memorera! Runda {round + 1}/{ROUNDS}</div>
          <div style={{
            background: 'rgba(99,102,241,.15)', border: '2px solid rgba(99,102,241,.4)',
            borderRadius: 20, padding: '32px 16px',
          }}>
            <div style={{ letterSpacing: 14, fontSize: 38, fontWeight: 900, color: '#818cf8', fontFamily: 'monospace' }}>
              {sequence.join(' ')}
            </div>
          </div>
          <div style={{ marginTop: 12, fontSize: 11, color: 'var(--t3)' }}>Seq. längd: {sequence.length}</div>
        </div>
      )}

      {phase === 'input' && (
        <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--t3)' }}>Skriv sekvensen! Runda {round + 1}/{ROUNDS}</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
            {sequence.map((_, i) => (
              <div key={i} style={{
                width: 38, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: i < guess.length ? 'rgba(99,102,241,.3)' : 'rgba(255,255,255,.06)',
                border: `2px solid ${i < guess.length ? '#818cf8' : 'rgba(255,255,255,.1)'}`,
                borderRadius: 10, fontSize: 22, fontWeight: 900, color: '#818cf8', fontFamily: 'monospace',
              }}>
                {guess[i] ?? ''}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              ref={inputRef}
              value={guess}
              onChange={e => {
                const v = e.target.value.replace(/\D/g, '').slice(0, sequence.length)
                setGuess(v)
              }}
              onKeyDown={e => { if (e.key === 'Enter') submit() }}
              placeholder="Skriv siffrorna..."
              inputMode="numeric"
              style={{
                flex: 1, padding: '12px 14px', borderRadius: 12,
                background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.15)',
                color: '#fff', fontSize: 20, fontFamily: 'monospace', letterSpacing: 4, outline: 'none',
              }}
            />
            <button className="btn-primary" style={{ padding: '12px 16px' }} onClick={submit}>✓</button>
          </div>
        </div>
      )}

      {phase === 'feedback' && (
        <div style={{ padding: '24px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 52 }}>{feedback ? '✅' : '❌'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 20, color: feedback ? '#4ade80' : '#f87171', marginTop: 8 }}>
            {feedback ? 'Rätt!' : `Fel! Svaret var: ${sequence.join('')}`}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{correct >= ROUNDS ? '🧠' : correct >= 4 ? '⭐' : '🔢'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{correct}/{ROUNDS}</div>
          <div style={{ fontSize: 14, color: correct >= ROUNDS ? '#4ade80' : '#fbbf24' }}>
            {correct >= ROUNDS ? 'HJÄRNSUPERHJÄLTE! 🧠' : correct >= 4 ? 'Bra minne! ⭐' : 'Träna mer! 💪'}
          </div>
          {correct > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{correct * 25 + (correct >= ROUNDS ? 80 : 0)}🪙 +{correct * 35} XP</div>
          <button className="btn-primary" style={{ padding: '14px 32px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
