import { memo, useState, useCallback, useRef, useEffect } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const GAME_TIME = 60
const ROUNDS = 8

interface Pyramid {
  base: number[]
  ops: ('+' | '-')[]
  target: number
  blanks: number[]
}

function makePyramid(): Pyramid {
  const base = Array.from({ length: 3 }, () => 1 + Math.floor(Math.random() * 8))
  const ops: ('+' | '-')[] = [Math.random() > 0.5 ? '+' : '-', Math.random() > 0.5 ? '+' : '-']
  const row2 = [
    ops[0] === '+' ? base[0] + base[1] : base[0] - base[1],
    ops[1] === '+' ? base[1] + base[2] : base[1] - base[2],
  ]
  const topOp: '+' | '-' = Math.random() > 0.5 ? '+' : '-'
  const top = topOp === '+' ? row2[0] + row2[1] : row2[0] - row2[1]
  const blanks = [Math.floor(Math.random() * 3)]
  return { base, ops: [...ops, topOp], target: top, blanks }
}

export const MathPyramidGame = memo(function MathPyramidGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [round, setRound] = useState(0)
  const [pyramid, setPyramid] = useState<Pyramid | null>(null)
  const [input, setInput] = useState('')
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_TIME)
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_mp2_best') ?? 0))
  const scoreRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const end = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    const s = scoreRef.current
    const prev = Number(localStorage.getItem('k0509_mp2_best') ?? 0)
    if (s > prev) localStorage.setItem('k0509_mp2_best', String(s))
    onWin(s * 15, s * 50)
    setPhase('done')
    audio.achievement()
  }, [onWin])

  const nextRound = useCallback((r: number) => {
    if (r >= ROUNDS) { end(); return }
    setPyramid(makePyramid())
    setRound(r)
    setInput('')
    setFeedback(null)
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [end])

  const start = useCallback(() => {
    scoreRef.current = 0
    setScore(0); setTimeLeft(GAME_TIME); setFeedback(null)
    setPhase('playing')
    nextRound(0)
    timerRef.current = setInterval(() => {
      setTimeLeft(t => { if (t <= 1) { end(); return 0 } return t - 1 })
    }, 1000)
  }, [end, nextRound])

  const submit = useCallback(() => {
    if (!pyramid || feedback !== null) return
    const val = parseInt(input, 10)
    const correct = val === pyramid.base[pyramid.blanks[0]]
    setFeedback(correct ? 'correct' : 'wrong')
    if (correct) {
      scoreRef.current++
      setScore(scoreRef.current)
      audio.coin()
    } else {
      audio.click()
    }
    setTimeout(() => nextRound(round + 1), 700)
  }, [pyramid, input, feedback, round, nextRound])

  const onKey = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') submit()
  }, [submit])

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  const timerColor = timeLeft > 30 ? '#4ade80' : timeLeft > 15 ? '#fbbf24' : '#f87171'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🔺 Mattepyramid</span>
        <span className={styles.scoreDisplay}>{score}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🔺</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Mattepyramid</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Varje cell är summan/differensen av de två under. Fyll i den saknade siffran! 8 pyramider, 60s.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}/{ROUNDS}</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && pyramid && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'rgba(255,255,255,.08)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(timeLeft / GAME_TIME) * 100}%`, background: timerColor, transition: 'width 1s linear' }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 900, color: timerColor }}>{timeLeft}s</span>
          </div>

          <div style={{
            padding: '20px', borderRadius: 18, textAlign: 'center',
            background: feedback === 'correct' ? 'rgba(74,222,128,.1)' : feedback === 'wrong' ? 'rgba(248,113,113,.1)' : 'rgba(255,255,255,.04)',
            border: `1px solid ${feedback === 'correct' ? 'rgba(74,222,128,.4)' : feedback === 'wrong' ? 'rgba(248,113,113,.4)' : 'rgba(255,255,255,.1)'}`,
          }}>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 16 }}>Runda {round + 1}/{ROUNDS}</div>
            {(() => {
              const ops = pyramid.ops
              const base = pyramid.base
              const row2 = [
                ops[0] === '+' ? base[0] + base[1] : base[0] - base[1],
                ops[1] === '+' ? base[1] + base[2] : base[1] - base[2],
              ]
              const top = pyramid.target
              const blankIdx = pyramid.blanks[0]

              const cell = (val: number | string, highlight = false) => (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 50, height: 40, borderRadius: 10, margin: '0 4px',
                  background: highlight ? 'rgba(96,165,250,.2)' : 'rgba(255,255,255,.1)',
                  border: `2px solid ${highlight ? '#60a5fa' : 'rgba(255,255,255,.2)'}`,
                  fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900,
                  color: highlight ? '#60a5fa' : '#fff',
                }}>
                  {val}
                </div>
              )

              return (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <div>{cell(top)}</div>
                  <div style={{ display: 'flex', gap: 0, alignItems: 'center' }}>
                    {cell(row2[0])}<span style={{ color: 'var(--t3)', fontSize: 14, margin: '0 2px' }}>{ops[2]}</span>{cell(row2[1])}
                  </div>
                  <div style={{ display: 'flex', gap: 0, alignItems: 'center' }}>
                    {cell(blankIdx === 0 ? '?' : base[0], blankIdx === 0)}
                    <span style={{ color: 'var(--t3)', fontSize: 14, margin: '0 2px' }}>{ops[0]}</span>
                    {cell(blankIdx === 1 ? '?' : base[1], blankIdx === 1)}
                    <span style={{ color: 'var(--t3)', fontSize: 14, margin: '0 2px' }}>{ops[1]}</span>
                    {cell(blankIdx === 2 ? '?' : base[2], blankIdx === 2)}
                  </div>
                </div>
              )
            })()}
          </div>

          <input
            ref={inputRef}
            type="number"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKey}
            placeholder="Vad är ?"
            style={{ fontSize: 24, fontWeight: 900, textAlign: 'center', padding: '12px', background: 'rgba(255,255,255,.06)', border: '2px solid rgba(255,255,255,.15)', borderRadius: 14, color: '#fff', width: '100%', boxSizing: 'border-box' }}
          />
          <button className="btn-primary" style={{ padding: '14px' }} onClick={submit}>Svara (Enter)</button>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{score >= 6 ? '🏆' : score >= 4 ? '⭐' : '🔺'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{score} / {ROUNDS}</div>
          <div style={{ fontSize: 13, color: score >= 6 ? '#4ade80' : '#fbbf24' }}>
            {score >= 8 ? 'PERFEKT! 🏆' : score >= 6 ? 'Utmärkt! ⭐' : score >= 4 ? 'Bra! 👍' : 'Öva mer! 🔺'}
          </div>
          {score > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{score * 15}🪙 +{score * 50} XP</div>
          <button className="btn-primary" style={{ padding: '14px 32px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
