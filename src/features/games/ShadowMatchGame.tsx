import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const ROUNDS = 10
const SETS = [
  { target: '🐶', choices: ['🐱', '🐶', '🐭', '🐹'] },
  { target: '🌺', choices: ['🌸', '🌼', '🌺', '🌻'] },
  { target: '🚀', choices: ['✈️', '🚀', '🛸', '🚁'] },
  { target: '🎸', choices: ['🎷', '🎹', '🎻', '🎸'] },
  { target: '🍕', choices: ['🍔', '🌮', '🍕', '🍣'] },
  { target: '⚡', choices: ['💧', '🔥', '⚡', '🌪️'] },
  { target: '🦋', choices: ['🐛', '🦋', '🐝', '🐞'] },
  { target: '💎', choices: ['💎', '💍', '🔮', '💠'] },
  { target: '🌊', choices: ['🌊', '🌈', '⛅', '❄️'] },
  { target: '🏆', choices: ['🥇', '🏆', '🎖️', '🎗️'] },
  { target: '🦁', choices: ['🐯', '🦁', '🐻', '🐺'] },
  { target: '🍀', choices: ['🌿', '🍃', '🍀', '☘️'] },
]

export const ShadowMatchGame = memo(function ShadowMatchGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [set, setSet] = useState<typeof SETS[0] | null>(null)
  const [timeLeft, setTimeLeft] = useState(4)
  const [selected, setSelected] = useState<string | null>(null)
  const [correct, setCorrect] = useState<boolean | null>(null)
  const [usedSets, setUsedSets] = useState<number[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_sm_best') ?? 0))

  const nextRound = useCallback((r: number, used: number[]) => {
    setSelected(null); setCorrect(null)
    const available = SETS.map((_, i) => i).filter(i => !used.includes(i))
    const pool = available.length > 0 ? available : SETS.map((_, i) => i)
    const idx = pool[Math.floor(Math.random() * pool.length)]
    const s = SETS[idx]
    const shuffled = [...s.choices].sort(() => Math.random() - 0.5)
    setSet({ ...s, choices: shuffled })
    setUsedSets(prev => [...prev, idx])
    setTimeLeft(Math.max(2, 4 - Math.floor(r / 4)))
    setRound(r)
  }, [])

  const start = useCallback(() => {
    setScore(0); setStreak(0); setUsedSets([])
    setPhase('playing'); nextRound(0, [])
  }, [nextRound])

  useEffect(() => {
    if (phase !== 'playing' || selected !== null) return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          setCorrect(false); setSelected('__timeout__')
          setStreak(0); audio.tap()
          setTimeout(() => {
            const nextR = round + 1
            if (nextR >= ROUNDS) {
              const prev = Number(localStorage.getItem('k0509_sm_best') ?? 0)
              if (score > prev) localStorage.setItem('k0509_sm_best', String(score))
              onWin(Math.round(score / 5), score); setPhase('done')
            } else nextRound(nextR, usedSets)
          }, 700)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase, round, selected, score, usedSets, nextRound, onWin])

  const handleChoice = useCallback((choice: string) => {
    if (!set || selected !== null) return
    if (timerRef.current) clearInterval(timerRef.current)
    const isCorrect = choice === set.target
    const newStreak = isCorrect ? streak + 1 : 0
    const pts = isCorrect ? (100 + timeLeft * 15) * Math.min(newStreak, 4) : 0
    const newScore = score + pts
    setSelected(choice); setCorrect(isCorrect)
    setStreak(newStreak); setScore(newScore)
    isCorrect ? audio.coin() : audio.tap()
    setTimeout(() => {
      const nextR = round + 1
      if (nextR >= ROUNDS) {
        const prev = Number(localStorage.getItem('k0509_sm_best') ?? 0)
        if (newScore > prev) localStorage.setItem('k0509_sm_best', String(newScore))
        onWin(Math.round(newScore / 5), newScore); setPhase('done')
      } else nextRound(nextR, usedSets)
    }, 800)
  }, [set, selected, streak, score, timeLeft, round, usedSets, nextRound, onWin])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>👤 Skugg-Match</span>
        <span className={styles.scoreDisplay}>{score}p · {round}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>👤</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Skugg-Match</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            En skugg-emoji visas — välj rätt original!<br />Snabbt + streak = mer poäng. ({ROUNDS} runder)
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}p</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {(phase === 'playing' || phase === 'done') && set && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: 'var(--t3)' }}>Runda {round + 1}/{ROUNDS}</span>
            <div style={{ display: 'flex', gap: 3 }}>{Array.from({ length: timeLeft }, (_, i) => <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: timeLeft <= 1 ? '#f87171' : '#4ade80' }} />)}</div>
            {streak > 1 && <span style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b' }}>🔥×{streak}</span>}
          </div>

          <div style={{ textAlign: 'center', padding: '20px', background: 'rgba(0,0,0,.4)', borderRadius: 16, border: '1px solid rgba(255,255,255,.08)' }}>
            <div style={{ fontSize: 56, filter: 'brightness(0)', WebkitFilter: 'brightness(0)' }}>{set.target}</div>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 8 }}>Vilket är den rätta emojin?</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {set.choices.map(c => {
              const isSelected = selected === c
              const bg = isSelected ? (correct ? 'rgba(74,222,128,.2)' : 'rgba(248,113,113,.2)') : selected !== null && c === set.target ? 'rgba(74,222,128,.2)' : 'rgba(255,255,255,.05)'
              const border = isSelected ? (correct ? '#4ade80' : '#f87171') : selected !== null && c === set.target ? '#4ade80' : 'rgba(255,255,255,.1)'
              return (
                <button key={c} onClick={() => handleChoice(c)} style={{ padding: '20px', borderRadius: 14, border: `2px solid ${border}`, background: bg, fontSize: 36, cursor: selected === null ? 'pointer' : 'default', transition: 'all .12s' }}>
                  {c}
                </button>
              )
            })}
          </div>

          {phase === 'done' && (
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
              <div style={{ fontWeight: 900, color: '#4ade80', fontSize: 16 }}>🎉 {score}p på {ROUNDS} runder!</div>
              <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Spela igen!</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
})
