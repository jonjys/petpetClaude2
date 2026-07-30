import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const ROUNDS = 10
const SHOW_MS = 1500
const ANSWER_TIME = 7

function makeRound(): { expr: string; answer: number; choices: number[] } {
  const ops = ['+', '-', '×'] as const
  const op = ops[Math.floor(Math.random() * 3)]
  let a: number, b: number, answer: number, expr: string
  if (op === '+') {
    a = 10 + Math.floor(Math.random() * 40); b = 10 + Math.floor(Math.random() * 40)
    answer = a + b; expr = `${a} + ${b}`
  } else if (op === '-') {
    a = 30 + Math.floor(Math.random() * 50); b = 10 + Math.floor(Math.random() * 20)
    answer = a - b; expr = `${a} - ${b}`
  } else {
    a = 2 + Math.floor(Math.random() * 9); b = 2 + Math.floor(Math.random() * 9)
    answer = a * b; expr = `${a} × ${b}`
  }
  const wrongs = new Set<number>()
  while (wrongs.size < 3) {
    const diff = (Math.floor(Math.random() * 8) + 1) * (Math.random() < 0.5 ? 1 : -1)
    const w = answer + diff
    if (w !== answer && w > 0) wrongs.add(w)
  }
  const choices = [answer, ...wrongs].sort(() => Math.random() - 0.5)
  return { expr, answer, choices }
}

export const MathBlindGame = memo(function MathBlindGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [round, setRound] = useState(1)
  const [roundKey, setRoundKey] = useState(0)
  const [showing, setShowing] = useState(true)
  const [expr, setExpr] = useState('')
  const [answer, setAnswer] = useState(0)
  const [choices, setChoices] = useState<number[]>([])
  const [timeLeft, setTimeLeft] = useState(ANSWER_TIME)
  const [score, setScore] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_mbl_best') ?? 0))
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const showRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scoreRef = useRef(0)
  const roundRef = useRef(1)
  const answerRef = useRef(0)

  const loadRound = useCallback((r: number) => {
    const { expr: e, answer: ans, choices: ch } = makeRound()
    setExpr(e); answerRef.current = ans; setAnswer(ans); setChoices(ch)
    setShowing(true); setPicked(null)
    roundRef.current = r; setRound(r); setTimeLeft(ANSWER_TIME)
    setRoundKey(k => k + 1)
    if (showRef.current) clearTimeout(showRef.current)
    showRef.current = setTimeout(() => setShowing(false), SHOW_MS)
  }, [])

  const start = useCallback(() => {
    scoreRef.current = 0; setScore(0); roundRef.current = 1
    loadRound(1)
    setPhase('playing')
  }, [loadRound])

  useEffect(() => {
    if (phase !== 'playing' || showing) return
    timerRef.current = setInterval(() => setTimeLeft(t => {
      if (t <= 1) {
        if (timerRef.current) clearInterval(timerRef.current)
        if (roundRef.current >= ROUNDS) {
          const s = scoreRef.current
          const prev = Number(localStorage.getItem('k0509_mbl_best') ?? 0)
          if (s > prev) localStorage.setItem('k0509_mbl_best', String(s))
          if (s > 0) onWin(Math.round(s / 8), s)
          setPhase('done')
        } else {
          setTimeout(() => loadRound(roundRef.current + 1), 500)
        }
        return 0
      }
      return t - 1
    }), 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase, roundKey, showing, onWin, loadRound])

  const pick = useCallback((val: number) => {
    if (showing || picked !== null) return
    if (timerRef.current) clearInterval(timerRef.current)
    setPicked(val)
    const correct = val === answerRef.current
    if (correct) {
      audio.coin()
      const bonus = Math.max(0, timeLeft - 2) * 10
      scoreRef.current += 50 + bonus; setScore(s => s + 50 + bonus)
    } else {
      audio.tap()
    }
    if (roundRef.current >= ROUNDS) {
      setTimeout(() => {
        const s = scoreRef.current
        const prev = Number(localStorage.getItem('k0509_mbl_best') ?? 0)
        if (s > prev) localStorage.setItem('k0509_mbl_best', String(s))
        if (s > 0) onWin(Math.round(s / 8), s)
        setPhase('done')
      }, 700)
    } else {
      setTimeout(() => loadRound(roundRef.current + 1), 700)
    }
  }, [showing, picked, timeLeft, onWin, loadRound])

  const timerPct = (timeLeft / ANSWER_TIME) * 100

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🧠 Blindmatte</span>
        <span className={styles.scoreDisplay}>{score}p · {round}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🧠</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Blindmatte</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            En matteuppgift visas i {SHOW_MS / 1000}s — sedan försvinner den! Välj rätt svar. 10 runder.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}p</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && (
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {!showing && (
            <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,.08)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${timerPct}%`, background: timerPct <= 30 ? '#f87171' : '#60a5fa', transition: 'width 1s linear' }} />
            </div>
          )}
          <div style={{ minHeight: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', background: showing ? 'rgba(251,191,36,.08)' : 'rgba(255,255,255,.04)', border: `2px solid ${showing ? 'rgba(251,191,36,.3)' : 'rgba(255,255,255,.08)'}`, borderRadius: 16, padding: '20px 16px', transition: 'all .3s' }}>
            {showing ? (
              <div style={{ fontFamily: 'var(--ff-head)', fontSize: 32, fontWeight: 900, color: '#fbbf24', letterSpacing: 2 }}>{expr}</div>
            ) : (
              <div style={{ fontSize: 14, color: 'var(--t3)' }}>Vad var svaret?</div>
            )}
          </div>
          {!showing && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {choices.map((c, i) => {
                const isCorrect = c === answer
                const isPicked = picked === c
                return (
                  <button key={i} onClick={() => pick(c)} disabled={picked !== null} style={{
                    padding: '18px', borderRadius: 14, fontSize: 22, fontWeight: 900,
                    background: picked !== null
                      ? isCorrect ? 'rgba(74,222,128,.2)' : isPicked ? 'rgba(248,113,113,.2)' : 'rgba(255,255,255,.04)'
                      : 'rgba(255,255,255,.07)',
                    border: `2px solid ${picked !== null
                      ? isCorrect ? '#4ade80' : isPicked ? '#f87171' : 'rgba(255,255,255,.08)'
                      : 'rgba(255,255,255,.12)'}`,
                    color: picked !== null ? (isCorrect ? '#4ade80' : isPicked ? '#f87171' : 'var(--t3)') : '#fff',
                    cursor: picked !== null ? 'default' : 'pointer',
                    transition: 'all .15s',
                  }}>{c}</button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <div style={{ fontWeight: 900, color: '#4ade80', fontSize: 20 }}>🧠 {score}p!</div>
          <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
