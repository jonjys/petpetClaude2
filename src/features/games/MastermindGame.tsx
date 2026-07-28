import { memo, useState, useCallback } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const COLORS = ['🔴','🟠','🟡','🟢','🔵','🟣']
const CODE_LEN = 4
const MAX_GUESSES = 8

function makeCode(): string[] {
  return Array.from({ length: CODE_LEN }, () => COLORS[Math.floor(Math.random() * COLORS.length)])
}

function score(secret: string[], guess: string[]): { black: number; white: number } {
  let black = 0, white = 0
  const sUsed = Array(CODE_LEN).fill(false)
  const gUsed = Array(CODE_LEN).fill(false)
  for (let i = 0; i < CODE_LEN; i++) {
    if (secret[i] === guess[i]) { black++; sUsed[i] = true; gUsed[i] = true }
  }
  for (let i = 0; i < CODE_LEN; i++) {
    if (gUsed[i]) continue
    for (let j = 0; j < CODE_LEN; j++) {
      if (sUsed[j]) continue
      if (guess[i] === secret[j]) { white++; sUsed[j] = true; break }
    }
  }
  return { black, white }
}

export const MastermindGame = memo(function MastermindGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'won' | 'lost'>('ready')
  const [secret, setSecret] = useState<string[]>([])
  const [guesses, setGuesses] = useState<{ guess: string[]; black: number; white: number }[]>([])
  const [current, setCurrent] = useState<string[]>([])
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_mm_best') ?? 0))

  const start = useCallback(() => {
    setSecret(makeCode()); setGuesses([]); setCurrent([]); setPhase('playing')
  }, [])

  const addColor = useCallback((c: string) => {
    if (current.length >= CODE_LEN) return
    setCurrent(prev => [...prev, c])
  }, [current.length])

  const removeColor = useCallback(() => {
    setCurrent(prev => prev.slice(0, -1))
  }, [])

  const submitGuess = useCallback(() => {
    if (current.length !== CODE_LEN) return
    const { black, white } = score(secret, current)
    const newGuesses = [...guesses, { guess: current, black, white }]
    setGuesses(newGuesses)
    setCurrent([])
    if (black === CODE_LEN) {
      const attempts = newGuesses.length
      const pts = Math.max(10, (MAX_GUESSES - attempts + 1) * 50)
      const prev = Number(localStorage.getItem('k0509_mm_best') ?? 0)
      if (pts > prev) localStorage.setItem('k0509_mm_best', String(pts))
      audio.achievement()
      onWin(Math.round(pts / 5), pts)
      setPhase('won')
    } else if (newGuesses.length >= MAX_GUESSES) {
      audio.click(); setPhase('lost')
    } else {
      audio.coin()
    }
  }, [current, secret, guesses, onWin])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🎯 Mastermind</span>
        <span className={styles.scoreDisplay}>{guesses.length}/{MAX_GUESSES}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🎯</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Mastermind</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 280, lineHeight: 1.7 }}>
            Gissa den hemliga 4-färgskoden på {MAX_GUESSES} försök!<br />
            ⚫ = rätt färg & plats · ⚪ = rätt färg fel plats
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}p</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {(phase === 'playing' || phase === 'won' || phase === 'lost') && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Previous guesses */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 240, overflowY: 'auto' }}>
            {guesses.map((g, row) => (
              <div key={row} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  {g.guess.map((c, i) => <span key={i} style={{ fontSize: 22 }}>{c}</span>)}
                </div>
                <div style={{ display: 'flex', gap: 3, marginLeft: 8 }}>
                  {Array(g.black).fill('⚫').map((x, i) => <span key={i} style={{ fontSize: 14 }}>{x}</span>)}
                  {Array(g.white).fill('⚪').map((x, i) => <span key={i} style={{ fontSize: 14 }}>{x}</span>)}
                  {g.black === 0 && g.white === 0 && <span style={{ fontSize: 12, color: 'var(--t3)' }}>Ingen träff</span>}
                </div>
              </div>
            ))}
          </div>

          {/* Current guess row */}
          {phase === 'playing' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  {Array(CODE_LEN).fill(null).map((_, i) => (
                    <div key={i} style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(255,255,255,.06)', border: `2px solid ${i < current.length ? 'rgba(129,140,248,.5)' : 'rgba(255,255,255,.1)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                      {current[i] ?? ''}
                    </div>
                  ))}
                </div>
                <button onClick={removeColor} style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(248,113,113,.15)', border: '1px solid rgba(248,113,113,.2)', color: '#f87171', fontSize: 14 }}>⌫</button>
                <button onClick={submitGuess} disabled={current.length !== CODE_LEN} style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(74,222,128,.15)', border: '1px solid rgba(74,222,128,.2)', color: '#4ade80', fontSize: 14 }}>✓</button>
              </div>
              {/* Color palette */}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                {COLORS.map(c => (
                  <button key={c} onClick={() => addColor(c)} disabled={current.length >= CODE_LEN} style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', fontSize: 22, cursor: 'pointer' }}>{c}</button>
                ))}
              </div>
            </>
          )}

          {phase === 'won' && (
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '12px 0' }}>
              <div style={{ fontSize: 36 }}>🎉</div>
              <div style={{ fontWeight: 900, color: '#4ade80' }}>Du knäckte koden på {guesses.length} försök!</div>
              <div style={{ fontSize: 13, color: '#fbbf24' }}>+{Math.round(Math.max(10, (MAX_GUESSES - guesses.length + 1) * 10))}🪙</div>
              <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Spela igen!</button>
            </div>
          )}

          {phase === 'lost' && (
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '12px 0' }}>
              <div style={{ fontSize: 36 }}>😮</div>
              <div style={{ fontWeight: 900, color: '#f87171' }}>Koden var: {secret.join(' ')}</div>
              <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Försök igen!</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
})
