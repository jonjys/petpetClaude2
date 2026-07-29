import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const ROUNDS = 10
const FLASH_COUNT = 5

function genNums(round: number): number[] {
  const maxVal = Math.min(20, 5 + round * 2)
  return Array.from({ length: FLASH_COUNT }, () => 1 + Math.floor(Math.random() * maxVal))
}

export const SumFlashGame = memo(function SumFlashGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'flashing' | 'input' | 'done'>('ready')
  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)
  const [nums, setNums] = useState<number[]>([])
  const [flashIdx, setFlashIdx] = useState(-1)
  const [input, setInput] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_sf_best') ?? 0))
  const inputRef = useRef<HTMLInputElement>(null)

  const runRound = useCallback((r: number) => {
    const n = genNums(r)
    setNums(n); setRound(r); setInput(''); setFeedback(null); setFlashIdx(0); setPhase('flashing')
  }, [])

  const start = useCallback(() => { setScore(0); runRound(0) }, [runRound])

  // Flash each number
  useEffect(() => {
    if (phase !== 'flashing' || flashIdx < 0) return
    if (flashIdx >= FLASH_COUNT) { setFlashIdx(-1); setPhase('input'); setTimeout(() => inputRef.current?.focus(), 50); return }
    const delay = Math.max(300, 700 - round * 30)
    const t = setTimeout(() => setFlashIdx(i => i + 1), delay)
    return () => clearTimeout(t)
  }, [phase, flashIdx, round])

  const submit = useCallback(() => {
    const answer = parseInt(input.trim(), 10)
    const correct = nums.reduce((a, b) => a + b, 0)
    const isRight = answer === correct
    const pts = isRight ? Math.max(30, 100 - round * 5) : 0
    const newScore = score + pts
    setFeedback(isRight ? `✅ Rätt! Summa: ${correct} +${pts}p` : `❌ Fel! Rätt svar: ${correct}`)
    audio[isRight ? 'coin' : 'tap']()
    setTimeout(() => {
      const nr = round + 1
      if (nr >= ROUNDS) {
        const prev = Number(localStorage.getItem('k0509_sf_best') ?? 0)
        if (newScore > prev) localStorage.setItem('k0509_sf_best', String(newScore))
        if (newScore > 0) onWin(Math.round(newScore / 8), newScore)
        setScore(newScore); setPhase('done')
      } else {
        setScore(newScore); runRound(nr)
      }
    }, 1200)
  }, [input, nums, score, round, runRound, onWin])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🔢 Summaflash</span>
        <span className={styles.scoreDisplay}>{score}p · {round}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🔢</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Summaflash</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            {FLASH_COUNT} siffror blinkar — addera dem i huvudet! Skriv summan snabbt. Siffrorna ökar varje runda.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}p</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'flashing' && (
        <div style={{ padding: '0 14px' }}>
          <div style={{ textAlign: 'center', marginBottom: 8, fontSize: 11, color: 'var(--t3)' }}>
            {flashIdx < FLASH_COUNT ? `Siffra ${flashIdx + 1}/${FLASH_COUNT}` : '...'}
          </div>
          <div style={{
            height: 240,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,.4)', border: '2px solid rgba(255,255,255,.1)', borderRadius: 20,
          }}>
            {flashIdx < FLASH_COUNT && (
              <div style={{ fontFamily: 'var(--ff-head)', fontSize: 88, fontWeight: 900, color: '#60a5fa', animation: 'popIn .15s ease-out' }}>
                {nums[flashIdx]}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 12 }}>
            {Array.from({ length: FLASH_COUNT }, (_, i) => (
              <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: i < flashIdx ? '#4ade80' : i === flashIdx ? '#60a5fa' : 'rgba(255,255,255,.15)' }} />
            ))}
          </div>
        </div>
      )}

      {phase === 'input' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--t3)' }}>Vad var summan av alla {FLASH_COUNT} siffror?</div>
          {feedback
            ? <div style={{ textAlign: 'center', fontSize: 14, fontWeight: 700, color: feedback.startsWith('✅') ? '#4ade80' : '#f87171' }}>{feedback}</div>
            : (
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  ref={inputRef}
                  type="number"
                  inputMode="numeric"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && input.trim() && submit()}
                  placeholder="Skriv summan..."
                  style={{ flex: 1, padding: '14px', borderRadius: 12, fontSize: 20, background: 'rgba(255,255,255,.06)', border: '2px solid rgba(255,255,255,.15)', color: '#e8e8f0', outline: 'none', textAlign: 'center' }}
                />
                <button className="btn-primary" style={{ padding: '14px 18px' }} onClick={submit} disabled={!input.trim()}>✓</button>
              </div>
            )
          }
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <div style={{ fontWeight: 900, color: '#4ade80', fontSize: 20 }}>🧮 {score}p!</div>
          <div style={{ fontSize: 12, color: 'var(--t3)' }}>{score}/{ROUNDS * 100} möjliga poäng</div>
          <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
