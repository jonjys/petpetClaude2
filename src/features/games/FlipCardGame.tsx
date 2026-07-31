import { memo, useState, useCallback, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const ROUNDS = 8
const SHOW_MS = 2200

const SYMBOLS = ['🌟','🎯','🔥','💎','🌈','⚡','🎪','🎭','🎨','🏆','🎲','🎸','🎺','🎻','🥁','🎹']

function getRound(r: number): { cards: string[]; grid: string[] } {
  const pairCount = 4 + r
  const pool = SYMBOLS.slice(0, pairCount)
  const pairs = [...pool, ...pool]
  return {
    cards: pairs.sort(() => Math.random() - 0.5),
    grid: pairs.sort(() => Math.random() - 0.5),
  }
}

export const FlipCardGame = memo(function FlipCardGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'show' | 'play' | 'done'>('ready')
  const [round, setRound] = useState(0)
  const [cards, setCards] = useState<string[]>([])
  const [flipped, setFlipped] = useState<Set<number>>(new Set())
  const [matched, setMatched] = useState<Set<number>>(new Set())
  const [tries, setTries] = useState(0)
  const [score, setScore] = useState(0)
  const [firstFlip, setFirstFlip] = useState<number | null>(null)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_flc_best') ?? 0))
  const scoreRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lockRef = useRef(false)

  const nextRound = useCallback((r: number) => {
    if (r >= ROUNDS) {
      const s = scoreRef.current
      const prev = Number(localStorage.getItem('k0509_flc_best') ?? 0)
      if (s > prev) localStorage.setItem('k0509_flc_best', String(s))
      onWin(s * 20, s * 65)
      setPhase('done')
      audio.achievement()
      return
    }
    const { grid } = getRound(r)
    setCards(grid)
    setFlipped(new Set())
    setMatched(new Set())
    setFirstFlip(null)
    setTries(0)
    setRound(r)
    lockRef.current = false
    setPhase('show')
    timerRef.current = setTimeout(() => setPhase('play'), SHOW_MS)
  }, [onWin])

  const start = useCallback(() => {
    scoreRef.current = 0
    setScore(0)
    nextRound(0)
  }, [nextRound])

  const flip = useCallback((idx: number) => {
    if (lockRef.current) return
    if (matched.has(idx) || flipped.has(idx)) return

    if (firstFlip === null) {
      setFlipped(new Set([idx]))
      setFirstFlip(idx)
      return
    }

    const second = idx
    setFlipped(new Set([firstFlip, second]))
    setTries(t => t + 1)
    lockRef.current = true

    if (cards[firstFlip] === cards[second] && firstFlip !== second) {
      const newMatched = new Set([...matched, firstFlip, second])
      setMatched(newMatched)
      setFirstFlip(null)
      lockRef.current = false
      audio.coin()
      if (newMatched.size === cards.length) {
        const pts = Math.max(1, cards.length - tries)
        scoreRef.current += pts
        setScore(scoreRef.current)
        timerRef.current = setTimeout(() => nextRound(round + 1), 600)
      }
    } else {
      audio.tap()
      timerRef.current = setTimeout(() => {
        setFlipped(new Set())
        setFirstFlip(null)
        lockRef.current = false
      }, 700)
    }
  }, [firstFlip, flipped, matched, cards, tries, round, nextRound])

  const cols = Math.ceil(Math.sqrt(cards.length))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🃏 Kortmemory</span>
        <span className={styles.scoreDisplay}>{score} pt</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🃏</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Kortmemory</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Korten visas kort — kom ihåg var de sitter! Hitta alla par. 8 ronder med fler par varje gång.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore} pt</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {(phase === 'show' || phase === 'play') && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 11, color: 'var(--t3)', textAlign: 'center' }}>
            {phase === 'show' ? `Memorera! (${round + 1}/${ROUNDS})` : `Hitta paren! (${round + 1}/${ROUNDS}) · ${tries} försök`}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 6 }}>
            {cards.map((c, i) => {
              const show = phase === 'show' || flipped.has(i) || matched.has(i)
              const isMatch = matched.has(i)
              return (
                <button
                  key={i}
                  onClick={() => phase === 'play' && flip(i)}
                  style={{
                    aspectRatio: '1', borderRadius: 10, fontSize: 22,
                    background: isMatch ? 'rgba(74,222,128,.2)' : show ? 'rgba(255,255,255,.12)' : 'rgba(96,165,250,.15)',
                    border: isMatch ? '2px solid #4ade80' : show ? '2px solid rgba(255,255,255,.2)' : '2px solid rgba(96,165,250,.3)',
                    cursor: phase === 'play' && !matched.has(i) ? 'pointer' : 'default',
                    transition: 'all .15s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {show ? c : '?'}
                </button>
              )
            })}
          </div>
          <div style={{ fontSize: 11, color: 'var(--t3)', textAlign: 'center' }}>
            Par: {matched.size / 2}/{cards.length / 2}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{score >= 40 ? '🏆' : score >= 25 ? '⭐' : '🃏'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{score} poäng</div>
          <div style={{ fontSize: 13, color: score >= 40 ? '#4ade80' : '#fbbf24' }}>
            {score >= 55 ? 'PERFEKT MINNE! 🏆' : score >= 40 ? 'Utmärkt! ⭐' : score >= 25 ? 'Bra! 👍' : 'Öva mer! 🃏'}
          </div>
          {score > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{score * 20}🪙 +{score * 65} XP</div>
          <button className="btn-primary" style={{ padding: '14px 32px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
