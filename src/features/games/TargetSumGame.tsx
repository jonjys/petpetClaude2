import { memo, useState, useCallback, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const ROUNDS = 10
const GRID_SIZE = 9

function makeRound() {
  const nums = Array.from({ length: GRID_SIZE }, () => 1 + Math.floor(Math.random() * 9))
  const solutionIndices: number[] = []
  let remaining = 3 + Math.floor(Math.random() * 3)
  const shuffled = [...nums.map((v, i) => ({ v, i }))].sort(() => Math.random() - 0.5)
  for (const { i } of shuffled) {
    if (remaining <= 0) break
    solutionIndices.push(i)
    remaining--
  }
  const target = solutionIndices.reduce((acc, i) => acc + nums[i], 0)
  return { nums, target, solutionIndices: new Set(solutionIndices) }
}

export const TargetSumGame = memo(function TargetSumGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'play' | 'feedback' | 'done'>('ready')
  const [round, setRound] = useState(0)
  const [nums, setNums] = useState<number[]>([])
  const [target, setTarget] = useState(0)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [score, setScore] = useState(0)
  const [wasCorrect, setWasCorrect] = useState(false)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_tsg_best') ?? 0))
  const scoreRef = useRef(0)
  const solutionRef = useRef<Set<number>>(new Set())
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const nextRound = useCallback((r: number) => {
    if (r >= ROUNDS) {
      const s = scoreRef.current
      const prev = Number(localStorage.getItem('k0509_tsg_best') ?? 0)
      if (s > prev) localStorage.setItem('k0509_tsg_best', String(s))
      onWin(s * 22, s * 70)
      setPhase('done')
      audio.achievement()
      return
    }
    const { nums: n, target: t, solutionIndices } = makeRound()
    setNums(n)
    setTarget(t)
    solutionRef.current = solutionIndices
    setSelected(new Set())
    setRound(r)
    setPhase('play')
  }, [onWin])

  const start = useCallback(() => {
    scoreRef.current = 0
    setScore(0)
    nextRound(0)
  }, [nextRound])

  const toggleNum = useCallback((idx: number) => {
    if (phase !== 'play') return
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
    audio.tap()
  }, [phase])

  const submit = useCallback(() => {
    if (phase !== 'play') return
    const selArr = Array.from(selected)
    const total = selArr.reduce((acc, i) => acc + nums[i], 0)
    const correct = total === target && selArr.length > 0
    setWasCorrect(correct)
    if (correct) {
      scoreRef.current++
      setScore(scoreRef.current)
      audio.coin()
    } else {
      audio.click()
    }
    setPhase('feedback')
    timerRef.current = setTimeout(() => nextRound(round + 1), 1100)
  }, [phase, selected, nums, target, round, nextRound])

  const currentSum = Array.from(selected).reduce((acc, i) => acc + nums[i], 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>➕ Målsumman</span>
        <span className={styles.scoreDisplay}>{score}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>➕</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Målsumman</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Välj siffror i rutnätet som tillsammans ger målsumman. Tryck Klar när du är nöjd! 10 ronder.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}/{ROUNDS}</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'play' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--t3)' }}>Rond {round + 1}/{ROUNDS}</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#fff', marginTop: 4 }}>
              Mål: <span style={{ color: '#fbbf24' }}>{target}</span>
            </div>
            <div style={{ fontSize: 13, color: currentSum === target ? '#4ade80' : 'var(--t3)', marginTop: 2 }}>
              Valt: {currentSum}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, padding: '8px 0' }}>
            {nums.map((n, i) => (
              <button
                key={i}
                onClick={() => toggleNum(i)}
                style={{
                  height: 64, borderRadius: 14, fontSize: 22, fontWeight: 900,
                  background: selected.has(i) ? '#fbbf24' : 'rgba(255,255,255,.08)',
                  color: selected.has(i) ? '#1a1a1a' : '#fff',
                  border: selected.has(i) ? '2px solid #f59e0b' : '2px solid rgba(255,255,255,.12)',
                  cursor: 'pointer',
                  transform: selected.has(i) ? 'scale(1.06)' : 'scale(1)',
                  transition: 'all .12s',
                }}
              >{n}</button>
            ))}
          </div>
          <button
            onClick={submit}
            style={{
              padding: '13px 0', borderRadius: 14, fontSize: 15, fontWeight: 900,
              background: currentSum === target ? '#4ade80' : '#60a5fa',
              color: '#1a1a1a', border: 'none', cursor: 'pointer',
            }}
          >Klar!</button>
        </div>
      )}

      {phase === 'feedback' && (
        <div style={{ padding: '32px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 52 }}>{wasCorrect ? '✅' : '❌'}</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: wasCorrect ? '#4ade80' : '#f87171' }}>
            {wasCorrect ? 'Rätt summa!' : `Fel! Summan var ${Array.from(selected).reduce((a, i) => a + nums[i], 0)}, inte ${target}`}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{score >= 8 ? '🏆' : score >= 5 ? '⭐' : '➕'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{score} / {ROUNDS}</div>
          <div style={{ fontSize: 13, color: score >= 8 ? '#4ade80' : '#fbbf24' }}>
            {score === 10 ? 'PERFEKT! 🏆' : score >= 8 ? 'Utmärkt! ⭐' : score >= 5 ? 'Bra! 👍' : 'Öva mer! ➕'}
          </div>
          {score > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{score * 22}🪙 +{score * 70} XP</div>
          <button className="btn-primary" style={{ padding: '14px 32px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
