import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const ROUNDS = 10
const SHOW_TIME = 2500
const CHAIN_SIZES = [3, 3, 4, 4, 4, 5, 5, 5, 6, 6]

export const NumberChainGame = memo(function NumberChainGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'show' | 'input' | 'feedback' | 'done'>('ready')
  const [round, setRound] = useState(0)
  const [chain, setChain] = useState<number[]>([])
  const [userInput, setUserInput] = useState<number[]>([])
  const [score, setScore] = useState(0)
  const [correct, setCorrect] = useState<boolean | null>(null)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_nc2_best') ?? 0))
  const scoreRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const genChain = useCallback((size: number) => {
    const nums: number[] = []
    for (let i = 0; i < size; i++) nums.push(1 + Math.floor(Math.random() * 9))
    return nums
  }, [])

  const startRound = useCallback((r: number) => {
    const size = CHAIN_SIZES[Math.min(r, CHAIN_SIZES.length - 1)]
    const c = genChain(size)
    setChain(c)
    setUserInput([])
    setCorrect(null)
    setPhase('show')
    timerRef.current = setTimeout(() => setPhase('input'), SHOW_TIME)
  }, [genChain])

  const start = useCallback(() => {
    scoreRef.current = 0
    setScore(0); setRound(0)
    startRound(0)
  }, [startRound])

  const tap = useCallback((n: number) => {
    setUserInput(prev => {
      const next = [...prev, n]
      return next
    })
  }, [])

  useEffect(() => {
    if (phase !== 'input' || userInput.length === 0 || chain.length === 0) return
    if (userInput.length < chain.length) return
    const isCorrect = userInput.every((v, i) => v === chain[i])
    setCorrect(isCorrect)
    setPhase('feedback')
    if (isCorrect) {
      scoreRef.current++
      setScore(scoreRef.current)
      audio.coin()
    } else {
      audio.click()
    }
    timerRef.current = setTimeout(() => {
      const nextRound = round + 1
      if (nextRound >= ROUNDS) {
        const s = scoreRef.current
        const prev = Number(localStorage.getItem('k0509_nc2_best') ?? 0)
        if (s > prev) localStorage.setItem('k0509_nc2_best', String(s))
        onWin(s * 18, s * 60)
        setPhase('done')
        audio.achievement()
      } else {
        setRound(nextRound)
        startRound(nextRound)
      }
    }, 900)
  }, [phase, userInput, chain, round, startRound, onWin])

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🔢 Talkedjan</span>
        <span className={styles.scoreDisplay}>{score}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🔢</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Talkedjan</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Memorera siffersekvensen — knappa sedan in dem i rätt ordning! 10 ronder.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}/{ROUNDS}</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'show' && (
        <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--t3)' }}>Memorera! Runda {round + 1}/{ROUNDS}</div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            {chain.map((n, i) => (
              <div key={i} style={{
                width: 50, height: 50, borderRadius: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--ff-head)', fontSize: 24, fontWeight: 900, color: '#60a5fa',
                background: 'rgba(96,165,250,.15)', border: '2px solid rgba(96,165,250,.4)',
              }}>{n}</div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: 'var(--t3)' }}>Försvinner snart...</div>
        </div>
      )}

      {phase === 'input' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--t3)', textAlign: 'center' }}>Knappa in ({userInput.length}/{chain.length})</div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', minHeight: 50 }}>
            {userInput.map((n, i) => (
              <div key={i} style={{ width: 44, height: 44, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--ff-head)', fontSize: 20, fontWeight: 900, color: '#fff', background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)' }}>{n}</div>
            ))}
            {Array.from({ length: chain.length - userInput.length }).map((_, i) => (
              <div key={`e${i}`} style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(255,255,255,.04)', border: '1px dashed rgba(255,255,255,.15)' }} />
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {[1,2,3,4,5,6,7,8,9].map(n => (
              <button key={n} onClick={() => tap(n)} style={{ padding: '16px', borderRadius: 12, fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff', background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)', cursor: 'pointer' }}>{n}</button>
            ))}
          </div>
        </div>
      )}

      {phase === 'feedback' && (
        <div style={{ padding: '32px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{correct ? '✅' : '❌'}</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: correct ? '#4ade80' : '#f87171' }}>
            {correct ? 'Korrekt!' : 'Fel! Rätt svar:'}
          </div>
          {!correct && (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              {chain.map((n, i) => (
                <div key={i} style={{ width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#f87171', background: 'rgba(248,113,113,.15)', border: '1px solid rgba(248,113,113,.4)' }}>{n}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{score >= 8 ? '🏆' : score >= 5 ? '⭐' : '🔢'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{score} / {ROUNDS}</div>
          <div style={{ fontSize: 13, color: score >= 8 ? '#4ade80' : '#fbbf24' }}>
            {score >= 10 ? 'GENI! 🧠' : score >= 8 ? 'Utmärkt! ⭐' : score >= 5 ? 'Bra! 👍' : 'Öva mer! 🔢'}
          </div>
          {score > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{score * 18}🪙 +{score * 60} XP</div>
          <button className="btn-primary" style={{ padding: '14px 32px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
