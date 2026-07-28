import { memo, useState, useCallback } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

function makeNumbers(): number[] {
  const large = [25, 50, 75, 100]
  const small = Array.from({ length: 10 }, (_, i) => i + 1)
  const nums: number[] = []
  const usedLarge: number[] = []
  const usedSmall: number[] = []
  const largePick = Math.floor(Math.random() * 3)
  for (let i = 0; i < largePick; i++) {
    const idx = Math.floor(Math.random() * large.length)
    usedLarge.push(large[idx])
  }
  for (let i = 0; i < 6 - largePick; i++) {
    const idx = Math.floor(Math.random() * small.length)
    usedSmall.push(small[idx])
  }
  return [...usedLarge, ...usedSmall].sort(() => Math.random() - 0.5)
}

function makeTarget(): number {
  return Math.floor(Math.random() * 899) + 100
}

function solve(nums: number[], target: number): { expr: string; result: number } | null {
  const ops = ['+', '-', '*', '/'] as const
  function* perms(arr: number[]): Generator<number[]> {
    if (arr.length <= 1) { yield arr; return }
    for (let i = 0; i < arr.length; i++) {
      const rest = arr.filter((_, j) => j !== i)
      for (const p of perms(rest)) yield [arr[i], ...p]
    }
  }
  for (let len = 2; len <= Math.min(nums.length, 5); len++) {
    for (const perm of perms(nums.slice(0, len))) {
      const subset = perm.slice(0, len)
      const results: Array<{ expr: string; val: number }> = [{ expr: String(subset[0]), val: subset[0] }]
      for (let i = 1; i < len; i++) {
        const newRes: Array<{ expr: string; val: number }> = []
        for (const r of results) {
          for (const op of ops) {
            const b = subset[i]
            let val: number
            if (op === '+') val = r.val + b
            else if (op === '-') val = r.val - b
            else if (op === '*') val = r.val * b
            else { if (b === 0 || r.val % b !== 0) continue; val = r.val / b }
            if (val <= 0) continue
            newRes.push({ expr: `${r.expr} ${op} ${b}`, val })
            if (val === target) return { expr: `${r.expr} ${op} ${b}`, result: val }
          }
        }
        results.push(...newRes)
      }
    }
  }
  return null
}

export const CountdownGame = memo(function CountdownGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [nums, setNums] = useState<number[]>([])
  const [target, setTarget] = useState(0)
  const [input, setInput] = useState('')
  const [solution, setSolution] = useState<string | null>(null)
  const [attempts, setAttempts] = useState(0)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_cd_best') ?? 0))

  const start = useCallback(() => {
    const n = makeNumbers()
    const t = makeTarget()
    setNums(n); setTarget(t); setInput(''); setSolution(null); setAttempts(0); setFeedback(null)
    setPhase('playing')
  }, [])

  const check = useCallback(() => {
    if (!input.trim()) return
    const expr = input.replace(/[^0-9+\-*/() ]/g, '')
    let result: number
    try {
      result = Function(`"use strict"; return (${expr})`)() as number
    } catch {
      setFeedback('❌ Ogiltigt uttryck'); return
    }
    if (!Number.isInteger(result) || result <= 0) { setFeedback('❌ Måste vara ett positivt heltal'); return }
    const diff = Math.abs(result - target)
    const newAttempts = attempts + 1
    setAttempts(newAttempts)
    if (diff === 0) {
      const score = Math.max(0, 10 - newAttempts + 1) * 50
      const prev = Number(localStorage.getItem('k0509_cd_best') ?? 0)
      if (score > prev) localStorage.setItem('k0509_cd_best', String(score))
      audio.achievement(); onWin(Math.round(score / 5), score)
      setFeedback(`🎉 Exakt! ${result} = ${target}`); setPhase('done')
    } else if (diff <= 5) {
      setFeedback(`⭐ Nästan! ${result} är ${diff} ${result < target ? 'under' : 'över'} målet`)
      const score = 100
      audio.coin(); onWin(Math.round(score / 5), score); setPhase('done')
    } else if (diff <= 10) {
      setFeedback(`👍 Nära! Skillnad: ${diff}. Försök igen!`)
      audio.click()
    } else {
      setFeedback(`❌ ${result} — skillnad ${diff}. Försök igen!`)
      audio.click()
    }
  }, [input, target, attempts, onWin])

  const hint = useCallback(() => {
    const sol = solve(nums, target)
    setSolution(sol ? `${sol.expr} = ${sol.result}` : 'Ingen lösning hittades med dessa siffror.')
  }, [nums, target])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🔢 Countdown</span>
        <span className={styles.scoreDisplay}>{attempts} försök</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🔢</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Countdown</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 280, lineHeight: 1.7 }}>
            Nå målvärdet med de givna siffrorna!<br />Använd +, -, ×, ÷ — varje siffra max en gång.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}p</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {(phase === 'playing' || phase === 'done') && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(251,191,36,.08)', border: '1px solid rgba(251,191,36,.2)', borderRadius: 14 }}>
            <div style={{ fontSize: 11, color: 'var(--t3)' }}>Mål</div>
            <div style={{ fontFamily: 'var(--ff-head)', fontSize: 48, fontWeight: 900, color: '#fbbf24' }}>{target}</div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
            {nums.map((n, i) => (
              <button key={i} onClick={() => setInput(prev => prev + n)} style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(129,140,248,.15)', border: '1px solid rgba(129,140,248,.2)', fontFamily: 'var(--ff-head)', fontSize: 16, fontWeight: 900, color: '#818cf8', cursor: 'pointer' }}>{n}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
            {['+', '-', '*', '/', '(', ')'].map(op => (
              <button key={op} onClick={() => setInput(prev => prev + op)} style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: '#e8e8f0', cursor: 'pointer', fontFamily: 'var(--ff-head)', fontSize: 14 }}>{op}</button>
            ))}
            <button onClick={() => setInput('')} style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(248,113,113,.1)', border: '1px solid rgba(248,113,113,.2)', color: '#f87171', cursor: 'pointer', fontSize: 12 }}>Rensa</button>
          </div>
          <input value={input} onChange={e => setInput(e.target.value)} style={{ padding: '12px 14px', borderRadius: 12, fontSize: 18, background: 'rgba(255,255,255,.06)', border: '2px solid rgba(255,255,255,.15)', color: '#e8e8f0', outline: 'none', fontFamily: 'var(--ff-head)', fontWeight: 700, letterSpacing: 2 }} placeholder="Skriv uttryck..." />
          {feedback && <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: feedback.startsWith('🎉') || feedback.startsWith('⭐') ? '#4ade80' : feedback.startsWith('👍') ? '#fbbf24' : '#f87171' }}>{feedback}</div>}
          {solution && <div style={{ textAlign: 'center', fontSize: 12, color: '#818cf8', padding: '8px', background: 'rgba(129,140,248,.08)', borderRadius: 8 }}>💡 {solution}</div>}
          {phase === 'playing' && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-primary" style={{ flex: 1, padding: '12px' }} onClick={check}>Kontrollera!</button>
              <button onClick={hint} style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: 'var(--t3)', cursor: 'pointer', fontSize: 12 }}>💡 Tips</button>
            </div>
          )}
          {phase === 'done' && <button className="btn-primary" style={{ padding: '12px 28px' }} onClick={start}>Nytt spel</button>}
        </div>
      )}
    </div>
  )
})
