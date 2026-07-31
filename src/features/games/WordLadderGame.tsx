import { memo, useState, useCallback, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const ROUNDS = 8

const CHAINS: { start: string; end: string; steps: string[] }[] = [
  { start: 'KAT', end: 'HUN', steps: ['KAT', 'KAN', 'HAN', 'HUN'] },
  { start: 'BOK', end: 'DAG', steps: ['BOK', 'DOK', 'DAK', 'DAG'] },
  { start: 'STO', end: 'FÅR', steps: ['STO', 'STA', 'FTA', 'FÅR'] },
  { start: 'BIL', end: 'VÄG', steps: ['BIL', 'VIL', 'VÄL', 'VÄG'] },
  { start: 'FIS', end: 'HÅV', steps: ['FIS', 'FIS', 'HIS', 'HÅV'] },
  { start: 'SOL', end: 'MÅN', steps: ['SOL', 'MOL', 'MON', 'MÅN'] },
  { start: 'ELD', end: 'VIN', steps: ['ELD', 'OLD', 'OND', 'VIN'] },
  { start: 'HAV', end: 'LUF', steps: ['HAV', 'LAV', 'LAF', 'LUF'] },
]

function getOptions(correct: string, all: string[]): string[] {
  const others = all.filter(w => w !== correct)
  const distractors = others.sort(() => Math.random() - 0.5).slice(0, 3)
  return [correct, ...distractors].sort(() => Math.random() - 0.5)
}

export const WordLadderGame = memo(function WordLadderGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'play' | 'feedback' | 'done'>('ready')
  const [round, setRound] = useState(0)
  const [stepIdx, setStepIdx] = useState(0)
  const [chain, setChain] = useState(CHAINS[0])
  const [options, setOptions] = useState<string[]>([])
  const [picked, setPicked] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [wasCorrect, setWasCorrect] = useState(false)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_wlg_best') ?? 0))
  const scoreRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const usedRounds = useRef(new Set<number>())

  const startStep = useCallback((r: number, si: number, ch: typeof CHAINS[0]) => {
    const correct = ch.steps[si + 1]
    const opts = getOptions(correct, ch.steps.concat(CHAINS.map(c => c.start)).filter(w => w !== correct))
    setOptions(opts)
    setPicked(null)
  }, [])

  const nextRound = useCallback((r: number) => {
    if (r >= ROUNDS) {
      const s = scoreRef.current
      const prev = Number(localStorage.getItem('k0509_wlg_best') ?? 0)
      if (s > prev) localStorage.setItem('k0509_wlg_best', String(s))
      onWin(s * 20, s * 65)
      setPhase('done')
      audio.achievement()
      return
    }
    let chainIdx = r % CHAINS.length
    while (usedRounds.current.has(chainIdx) && usedRounds.current.size < CHAINS.length) {
      chainIdx = (chainIdx + 1) % CHAINS.length
    }
    usedRounds.current.add(chainIdx)
    const ch = CHAINS[chainIdx]
    setChain(ch)
    setStepIdx(0)
    setRound(r)
    setPhase('play')
    startStep(r, 0, ch)
  }, [onWin, startStep])

  const start = useCallback(() => {
    scoreRef.current = 0
    setScore(0)
    usedRounds.current.clear()
    nextRound(0)
  }, [nextRound])

  const pick = useCallback((opt: string) => {
    if (picked !== null) return
    setPicked(opt)
    const correct = chain.steps[stepIdx + 1]
    const isCorrect = opt === correct
    setWasCorrect(isCorrect)
    setPhase('feedback')
    if (isCorrect) {
      scoreRef.current++
      setScore(scoreRef.current)
      audio.coin()
    } else {
      audio.click()
    }
    timerRef.current = setTimeout(() => nextRound(round + 1), 1000)
  }, [picked, chain, stepIdx, round, nextRound])

  const progress = chain.steps.slice(0, stepIdx + 1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🪜 Ordstege</span>
        <span className={styles.scoreDisplay}>{score}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🪜</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Ordstege</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Välj nästa ord i stegen — ett steg i taget från startord till slutord! 8 ronder.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}/{ROUNDS}</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'play' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--t3)', textAlign: 'center' }}>
            {chain.start} → {chain.end} ({round + 1}/{ROUNDS})
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
            {progress.map((w, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ padding: '8px 14px', borderRadius: 10, background: i === progress.length - 1 ? 'rgba(96,165,250,.25)' : 'rgba(74,222,128,.15)', border: `2px solid ${i === progress.length - 1 ? '#60a5fa' : '#4ade80'}`, fontFamily: 'var(--ff-head)', fontSize: 16, fontWeight: 900, color: '#fff' }}>
                  {w}
                </div>
                <span style={{ color: 'var(--t3)', fontSize: 14 }}>→</span>
              </div>
            ))}
            <div style={{ padding: '8px 14px', borderRadius: 10, background: 'rgba(255,255,255,.04)', border: '2px dashed rgba(255,255,255,.2)', fontFamily: 'var(--ff-head)', fontSize: 16, fontWeight: 900, color: 'var(--t3)' }}>?</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
            {options.map((opt, i) => (
              <button
                key={i}
                onClick={() => pick(opt)}
                style={{ padding: '16px', borderRadius: 14, fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff', background: 'rgba(255,255,255,.08)', border: '2px solid rgba(255,255,255,.15)', cursor: 'pointer' }}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === 'feedback' && (
        <div style={{ padding: '32px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 52 }}>{wasCorrect ? '✅' : '❌'}</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: wasCorrect ? '#4ade80' : '#f87171' }}>
            {wasCorrect ? 'Rätt steg!' : `Fel! Rätt: ${chain.steps[stepIdx + 1]}`}
          </div>
          <div style={{ fontSize: 12, color: 'var(--t3)' }}>{chain.steps.join(' → ')}</div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{score >= 7 ? '🏆' : score >= 5 ? '⭐' : '🪜'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{score} / {ROUNDS}</div>
          <div style={{ fontSize: 13, color: score >= 7 ? '#4ade80' : '#fbbf24' }}>
            {score === 8 ? 'PERFEKT! 🏆' : score >= 7 ? 'Utmärkt! ⭐' : score >= 5 ? 'Bra! 👍' : 'Öva mer! 🪜'}
          </div>
          {score > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{score * 20}🪙 +{score * 65} XP</div>
          <button className="btn-primary" style={{ padding: '14px 32px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
