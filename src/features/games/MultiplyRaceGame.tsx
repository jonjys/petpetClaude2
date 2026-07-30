import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const GAME_TIME = 45
const TABLES = [2, 3, 4, 5, 6, 7, 8, 9]

export const MultiplyRaceGame = memo(function MultiplyRaceGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [table, setTable] = useState(2)
  const [step, setStep] = useState(1)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_TIME)
  const [choices, setChoices] = useState<number[]>([])
  const [feedback, setFeedback] = useState<'ok' | 'err' | null>(null)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_mr_best') ?? 0))
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const scoreRef = useRef(0)
  const fbRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tableRef = useRef(2)
  const stepRef = useRef(1)

  function makeChoices(t: number, s: number): number[] {
    const correct = t * s
    const set = new Set<number>([correct])
    while (set.size < 4) {
      const diff = (Math.floor(Math.random() * 5) + 1) * (Math.random() < 0.5 ? 1 : -1)
      const w = correct + diff
      if (w > 0) set.add(w)
    }
    return [...set].sort(() => Math.random() - 0.5)
  }

  const nextStep = useCallback((t: number, s: number) => {
    tableRef.current = t; stepRef.current = s
    setTable(t); setStep(s)
    setChoices(makeChoices(t, s))
  }, [])

  const start = useCallback(() => {
    scoreRef.current = 0; setScore(0); setTimeLeft(GAME_TIME)
    setFeedback(null)
    const t = TABLES[Math.floor(Math.random() * TABLES.length)]
    nextStep(t, 1)
    setPhase('playing')
  }, [nextStep])

  useEffect(() => {
    if (phase !== 'playing') return
    timerRef.current = setInterval(() => setTimeLeft(t => {
      if (t <= 1) {
        if (timerRef.current) clearInterval(timerRef.current)
        const s = scoreRef.current
        const prev = Number(localStorage.getItem('k0509_mr_best') ?? 0)
        if (s > prev) localStorage.setItem('k0509_mr_best', String(s))
        if (s > 0) onWin(Math.round(s / 7), s)
        setPhase('done'); return 0
      }
      return t - 1
    }), 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase, onWin])

  const pick = useCallback((val: number) => {
    if (phase !== 'playing' || feedback) return
    const correct = tableRef.current * stepRef.current
    if (val === correct) {
      audio.tap()
      scoreRef.current += 25; setScore(s => s + 25)
      setFeedback('ok')
      if (fbRef.current) clearTimeout(fbRef.current)
      fbRef.current = setTimeout(() => {
        setFeedback(null)
        const ns = stepRef.current >= 10 ? 1 : stepRef.current + 1
        const nt = ns === 1 ? TABLES[Math.floor(Math.random() * TABLES.length)] : tableRef.current
        nextStep(nt, ns)
      }, 300)
    } else {
      audio.tap()
      scoreRef.current = Math.max(0, scoreRef.current - 10); setScore(s => Math.max(0, s - 10))
      setFeedback('err')
      if (fbRef.current) clearTimeout(fbRef.current)
      fbRef.current = setTimeout(() => setFeedback(null), 400)
    }
  }, [phase, feedback, nextStep])

  const timerPct = (timeLeft / GAME_TIME) * 100

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>✖️ Tabellrace</span>
        <span className={styles.scoreDisplay}>{score}p · {timeLeft}s</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>✖️</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Tabellrace</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Svara rätt på multiplikationstabellerna i ordning (×1→×10)! +25p rätt, -10p fel. 45 sekunder.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}p</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && (
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,.08)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${timerPct}%`, background: timerPct <= 25 ? '#f87171' : '#60a5fa', transition: 'width 1s linear' }} />
          </div>
          <div style={{ textAlign: 'center', padding: '14px', background: 'rgba(255,255,255,.05)', borderRadius: 16, border: `2px solid ${feedback === 'ok' ? '#4ade80' : feedback === 'err' ? '#f87171' : 'rgba(255,255,255,.1)'}`, transition: 'border .2s' }}>
            <div style={{ fontSize: 13, color: 'var(--t3)', marginBottom: 4 }}>Tabell {table} · steg {step}/10</div>
            <div style={{ fontFamily: 'var(--ff-head)', fontSize: 36, fontWeight: 900, color: '#fff' }}>
              {table} × {step} = ?
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {choices.map((c, i) => (
              <button key={i} onClick={() => pick(c)} style={{
                padding: '18px', borderRadius: 14, fontSize: 22, fontWeight: 900,
                background: 'rgba(255,255,255,.07)',
                border: '2px solid rgba(255,255,255,.12)',
                color: '#fff', cursor: 'pointer',
              }}>{c}</button>
            ))}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <div style={{ fontWeight: 900, color: '#4ade80', fontSize: 20 }}>✖️ {score}p!</div>
          <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
