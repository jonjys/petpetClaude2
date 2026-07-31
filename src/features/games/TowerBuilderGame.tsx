import { memo, useState, useCallback, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const ROUNDS = 10
const BLOCK_EMOJIS = ['🟥','🟧','🟨','🟩','🟦','🟪','⬛','⬜']

interface Block {
  id: number
  emoji: string
  width: number
}

function makeBlock(idx: number, prevWidth: number): Block {
  const w = Math.max(30, prevWidth - Math.floor(Math.random() * 20))
  return { id: idx, emoji: BLOCK_EMOJIS[idx % BLOCK_EMOJIS.length], width: w }
}

function isStable(tower: Block[]): boolean {
  for (let i = 1; i < tower.length; i++) {
    if (tower[i].width > tower[i - 1].width + 10) return false
  }
  return true
}

export const TowerBuilderGame = memo(function TowerBuilderGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'build' | 'feedback' | 'done'>('ready')
  const [round, setRound] = useState(0)
  const [tower, setTower] = useState<Block[]>([])
  const [options, setOptions] = useState<Block[]>([])
  const [score, setScore] = useState(0)
  const [wasCorrect, setWasCorrect] = useState(false)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_tbg_best') ?? 0))
  const scoreRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const blockIdRef = useRef(0)

  const makeOptions = (baseWidth: number): Block[] => {
    const opts: Block[] = []
    const goodWidth = Math.max(30, baseWidth - Math.floor(Math.random() * 15))
    opts.push({ id: ++blockIdRef.current, emoji: BLOCK_EMOJIS[Math.floor(Math.random() * BLOCK_EMOJIS.length)], width: goodWidth })
    while (opts.length < 3) {
      const bad = baseWidth + 15 + Math.floor(Math.random() * 20)
      opts.push({ id: ++blockIdRef.current, emoji: BLOCK_EMOJIS[Math.floor(Math.random() * BLOCK_EMOJIS.length)], width: bad })
    }
    return opts.sort(() => Math.random() - 0.5)
  }

  const nextRound = useCallback((r: number) => {
    if (r >= ROUNDS) {
      const s = scoreRef.current
      const prev = Number(localStorage.getItem('k0509_tbg_best') ?? 0)
      if (s > prev) localStorage.setItem('k0509_tbg_best', String(s))
      onWin(s * 18, s * 58)
      setPhase('done')
      audio.achievement()
      return
    }
    const base = 120
    const foundationBlock: Block = { id: ++blockIdRef.current, emoji: '🟫', width: base }
    setTower([foundationBlock])
    setOptions(makeOptions(base))
    setRound(r)
    setPhase('build')
  }, [onWin])

  const start = useCallback(() => {
    scoreRef.current = 0
    setScore(0)
    nextRound(0)
  }, [nextRound])

  const place = useCallback((block: Block) => {
    setTower(prev => {
      const newTower = [block, ...prev]
      const stable = isStable(newTower)
      setWasCorrect(stable)
      setPhase('feedback')
      if (stable) {
        scoreRef.current++
        setScore(scoreRef.current)
        audio.coin()
      } else {
        audio.click()
      }
      timerRef.current = setTimeout(() => nextRound(round + 1), 1000)
      return newTower
    })
  }, [round, nextRound])

  const topWidth = tower.length > 0 ? tower[0].width : 120

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🏗️ Tornbyggaren</span>
        <span className={styles.scoreDisplay}>{score}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🏗️</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Tornbyggaren</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Välj rätt block för att stapla ett stabilt torn! Varje ny block måste vara smalare eller lika bred som den under. 10 ronder.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}/{ROUNDS}</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'build' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 11, color: 'var(--t3)', textAlign: 'center' }}>Välj nästa block ({round + 1}/{ROUNDS})</div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'rgba(255,255,255,.03)', borderRadius: 12, padding: '12px 0', minHeight: 80 }}>
            {tower.slice(0, 4).map((b, i) => (
              <div key={b.id} style={{ height: 24, borderRadius: 4, background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, width: b.width }}>
                {b.emoji}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 10, color: 'var(--t3)', textAlign: 'center' }}>Toppen: {topWidth}px bred — välj något smalare!</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
            {options.map((opt, i) => (
              <button
                key={opt.id}
                onClick={() => place(opt)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,.07)', border: '2px solid rgba(255,255,255,.12)', cursor: 'pointer' }}
              >
                <div style={{ height: 18, width: opt.width * 0.7, borderRadius: 3, background: 'rgba(255,255,255,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>{opt.emoji}</div>
                <span style={{ fontSize: 13, color: '#fff', fontWeight: 700 }}>{Math.round(opt.width * 0.7)} bred</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === 'feedback' && (
        <div style={{ padding: '32px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 52 }}>{wasCorrect ? '✅' : '❌'}</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: wasCorrect ? '#4ade80' : '#f87171' }}>
            {wasCorrect ? 'Stabilt torn!' : 'Tornet föll!'}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{score >= 8 ? '🏆' : score >= 5 ? '⭐' : '🏗️'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{score} / {ROUNDS}</div>
          <div style={{ fontSize: 13, color: score >= 8 ? '#4ade80' : '#fbbf24' }}>
            {score === 10 ? 'PERFEKT TORN! 🏆' : score >= 8 ? 'Utmärkt! ⭐' : score >= 5 ? 'Bra! 👍' : 'Öva mer! 🏗️'}
          </div>
          {score > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{score * 18}🪙 +{score * 58} XP</div>
          <button className="btn-primary" style={{ padding: '14px 32px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
