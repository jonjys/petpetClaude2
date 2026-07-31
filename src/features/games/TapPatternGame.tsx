import { memo, useState, useCallback, useRef, useEffect } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const ROUNDS = 10
const GRID = 4
const FLASH_MS = 350
const PAUSE_MS = 150

function makePattern(round: number): number[] {
  const len = 3 + round
  const cells = GRID * GRID
  const pattern: number[] = []
  while (pattern.length < Math.min(len, cells)) {
    const c = Math.floor(Math.random() * cells)
    if (!pattern.includes(c)) pattern.push(c)
  }
  return pattern
}

export const TapPatternGame = memo(function TapPatternGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'show' | 'input' | 'feedback' | 'done'>('ready')
  const [round, setRound] = useState(0)
  const [pattern, setPattern] = useState<number[]>([])
  const [lit, setLit] = useState<number | null>(null)
  const [tapped, setTapped] = useState<number[]>([])
  const [inputIdx, setInputIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [wasCorrect, setWasCorrect] = useState(false)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_tpg_best') ?? 0))
  const scoreRef = useRef(0)
  const patternRef = useRef<number[]>([])
  const inputIdxRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const flashPattern = useCallback((pat: number[], onDone: () => void) => {
    let i = 0
    const step = () => {
      if (i >= pat.length) { onDone(); return }
      setLit(pat[i])
      audio.tap()
      timerRef.current = setTimeout(() => {
        setLit(null)
        timerRef.current = setTimeout(() => { i++; step() }, PAUSE_MS)
      }, FLASH_MS)
    }
    step()
  }, [])

  const nextRound = useCallback((r: number) => {
    if (r >= ROUNDS) {
      const s = scoreRef.current
      const prev = Number(localStorage.getItem('k0509_tpg_best') ?? 0)
      if (s > prev) localStorage.setItem('k0509_tpg_best', String(s))
      onWin(s * 20, s * 62)
      setPhase('done')
      audio.achievement()
      return
    }
    const pat = makePattern(r)
    setPattern(pat)
    patternRef.current = pat
    setTapped([])
    setInputIdx(0)
    inputIdxRef.current = 0
    setRound(r)
    setPhase('show')
    timerRef.current = setTimeout(() => {
      flashPattern(pat, () => setPhase('input'))
    }, 500)
  }, [onWin, flashPattern])

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const start = useCallback(() => {
    scoreRef.current = 0
    setScore(0)
    nextRound(0)
  }, [nextRound])

  const tapCell = useCallback((cellIdx: number) => {
    if (phase !== 'input') return
    const pat = patternRef.current
    const idx = inputIdxRef.current
    if (cellIdx !== pat[idx]) {
      setWasCorrect(false)
      setPhase('feedback')
      audio.click()
      timerRef.current = setTimeout(() => nextRound(round + 1), 1000)
      return
    }
    const newTapped = [...tapped, cellIdx]
    setTapped(newTapped)
    setLit(cellIdx)
    audio.tap()
    timerRef.current = setTimeout(() => setLit(null), 150)
    const newIdx = idx + 1
    inputIdxRef.current = newIdx
    setInputIdx(newIdx)
    if (newIdx === pat.length) {
      scoreRef.current++
      setScore(scoreRef.current)
      setWasCorrect(true)
      setPhase('feedback')
      audio.achievement()
      timerRef.current = setTimeout(() => nextRound(round + 1), 900)
    }
  }, [phase, tapped, round, nextRound])

  const COLORS = ['#f87171', '#60a5fa', '#4ade80', '#fbbf24', '#c084fc', '#fb923c', '#34d399', '#f472b6']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🔲 Mönstermemory</span>
        <span className={styles.scoreDisplay}>{score}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🔲</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Mönstermemory</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Rutor blinkar i en sekvens — tryck dem i samma ordning! Börjar med 3 rutor, växer till 12. 10 ronder.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}/{ROUNDS}</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {(phase === 'show' || phase === 'input') && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 11, color: 'var(--t3)', textAlign: 'center' }}>
            {phase === 'show' ? `Titta! (${round + 1}/${ROUNDS})` : `Tryck rätt! ${inputIdx}/${pattern.length} (${round + 1}/${ROUNDS})`}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${GRID}, 1fr)`, gap: 8 }}>
            {Array.from({ length: GRID * GRID }, (_, i) => {
              const inPattern = pattern.includes(i)
              const patIdx = pattern.indexOf(i)
              const isLit = lit === i
              const isTapped = tapped.includes(i)
              return (
                <button
                  key={i}
                  onClick={() => tapCell(i)}
                  disabled={phase === 'show'}
                  style={{
                    height: 62, borderRadius: 12,
                    background: isLit
                      ? COLORS[patIdx % COLORS.length]
                      : isTapped
                        ? 'rgba(74,222,128,.25)'
                        : inPattern && phase === 'input'
                          ? 'rgba(255,255,255,.06)'
                          : 'rgba(255,255,255,.06)',
                    border: isLit
                      ? `2px solid ${COLORS[patIdx % COLORS.length]}`
                      : isTapped
                        ? '2px solid rgba(74,222,128,.4)'
                        : '1px solid rgba(255,255,255,.1)',
                    cursor: phase === 'input' ? 'pointer' : 'default',
                    transition: 'all .1s',
                    transform: isLit ? 'scale(1.06)' : 'scale(1)',
                  }}
                />
              )
            })}
          </div>
        </div>
      )}

      {phase === 'feedback' && (
        <div style={{ padding: '32px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 52 }}>{wasCorrect ? '✅' : '❌'}</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: wasCorrect ? '#4ade80' : '#f87171' }}>
            {wasCorrect ? 'Perfekt mönster!' : `Fel på steg ${inputIdx + 1}!`}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{score >= 8 ? '🏆' : score >= 5 ? '⭐' : '🔲'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{score} / {ROUNDS}</div>
          <div style={{ fontSize: 13, color: score >= 8 ? '#4ade80' : '#fbbf24' }}>
            {score === 10 ? 'PERFEKT! 🏆' : score >= 8 ? 'Utmärkt! ⭐' : score >= 5 ? 'Bra! 👍' : 'Öva mer! 🔲'}
          </div>
          {score > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{score * 20}🪙 +{score * 62} XP</div>
          <button className="btn-primary" style={{ padding: '14px 32px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
