import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const SENTENCES = [
  'Katten sover i solen',
  'Hunden springer snabbt',
  'Fisken simmar djupt',
  'Björnen äter honung',
  'Fågeln sjunger vackert',
  'Stjärnorna lyser klart',
  'Regnet faller ner',
  'Vinden blåser hårt',
  'Elden brinner varmt',
  'Isen är kall och hal',
  'Draken flyger högt',
  'Hjälten slåss tappert',
  'Skatten glimmar guldigt',
  'Havet är djupt och blått',
  'Månen lyser om natten',
  'Solen värmer om dagen',
  'Blomman doftar sött',
  'Trädet växer långsamt',
  'Molnet driver förbi',
  'Floden flödar friskt',
]

const ROUNDS = 4
const TIME_PER_SENTENCE = 20

export const TypeRacerGame = memo(function TypeRacerGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [sentences, setSentences] = useState<string[]>([])
  const [idx, setIdx] = useState(0)
  const [typed, setTyped] = useState('')
  const [score, setScore] = useState(0)
  const [wpm, setWpm] = useState(0)
  const [timeLeft, setTimeLeft] = useState(TIME_PER_SENTENCE)
  const [feedback, setFeedback] = useState<'correct' | 'timeout' | null>(null)
  const [bestWpm] = useState(() => Number(localStorage.getItem('k0509_typer_best') ?? 0))
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const startTimeRef = useRef<number>(0)

  const nextSentence = useCallback((wasCorrect: boolean, elapsedMs?: number) => {
    if (wasCorrect && elapsedMs) {
      const words = sentences[idx]?.split(' ').length ?? 1
      const minutes = elapsedMs / 60000
      const roundWpm = Math.round(words / minutes)
      setWpm(w => Math.round((w + roundWpm) / (idx === 0 ? 1 : 2)))
      setScore(s => s + 1)
      audio.coin()
    } else {
      audio.click()
    }
    setFeedback(wasCorrect ? 'correct' : 'timeout')
    setTimeout(() => {
      setFeedback(null)
      setTyped('')
      if (idx + 1 >= ROUNDS) {
        setPhase('done')
      } else {
        setIdx(i => i + 1)
        setTimeLeft(TIME_PER_SENTENCE)
        startTimeRef.current = Date.now()
        setTimeout(() => inputRef.current?.focus(), 50)
      }
    }, 800)
  }, [idx, sentences])

  useEffect(() => {
    if (phase !== 'playing') return
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!)
          nextSentence(false)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase, idx, nextSentence])

  const start = useCallback(() => {
    const pool = [...SENTENCES].sort(() => Math.random() - 0.5).slice(0, ROUNDS)
    setSentences(pool)
    setIdx(0); setScore(0); setWpm(0); setTyped(''); setFeedback(null)
    setTimeLeft(TIME_PER_SENTENCE)
    startTimeRef.current = Date.now()
    setPhase('playing')
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [])

  const handleChange = useCallback((val: string) => {
    setTyped(val)
    const target = sentences[idx] ?? ''
    if (val === target) {
      if (timerRef.current) clearInterval(timerRef.current)
      nextSentence(true, Date.now() - startTimeRef.current)
    }
  }, [sentences, idx, nextSentence])

  useEffect(() => {
    if (phase === 'done') {
      const prev = Number(localStorage.getItem('k0509_typer_best') ?? 0)
      if (wpm > prev) localStorage.setItem('k0509_typer_best', String(wpm))
      onWin(score * 20 + (score >= ROUNDS ? 50 : 0), score * 30)
      audio.achievement()
    }
  }, [phase, score, wpm, onWin])

  const sentence = sentences[idx] ?? ''
  const timerColor = timeLeft > 12 ? '#4ade80' : timeLeft > 6 ? '#fbbf24' : '#f87171'

  const renderColored = () => {
    return sentence.split('').map((ch, i) => {
      let color = 'rgba(255,255,255,0.3)'
      if (i < typed.length) color = typed[i] === ch ? '#4ade80' : '#f87171'
      return <span key={i} style={{ color }}>{ch}</span>
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>⌨️ Skrivrace</span>
        <span className={styles.scoreDisplay}>{score}/{idx}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>⌨️</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Skrivrace</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Skriv meningarna exakt rätt så snabbt du kan!<br />{ROUNDS} meningar · {TIME_PER_SENTENCE}s per mening
          </div>
          {bestWpm > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestWpm} WPM</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && (
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,.08)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(timeLeft / TIME_PER_SENTENCE) * 100}%`, background: timerColor, borderRadius: 2, transition: 'width 1s linear' }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 900, color: timerColor }}>{timeLeft}s</span>
            <span style={{ fontSize: 11, color: 'var(--t3)' }}>{idx + 1}/{ROUNDS}</span>
          </div>

          <div style={{
            background: feedback === 'correct' ? 'rgba(74,222,128,.12)' : feedback === 'timeout' ? 'rgba(248,113,113,.12)' : 'rgba(255,255,255,.05)',
            border: `1px solid ${feedback === 'correct' ? 'rgba(74,222,128,.4)' : feedback === 'timeout' ? 'rgba(248,113,113,.4)' : 'rgba(255,255,255,.1)'}`,
            borderRadius: 16, padding: '20px 16px', textAlign: 'center', transition: 'all .2s',
          }}>
            <div style={{ fontFamily: 'monospace', fontSize: 20, fontWeight: 700, letterSpacing: 1, lineHeight: 1.6 }}>
              {renderColored()}
            </div>
          </div>

          {!feedback && (
            <input
              ref={inputRef}
              value={typed}
              onChange={e => handleChange(e.target.value)}
              placeholder="Börja skriva här..."
              style={{
                padding: '12px 14px', borderRadius: 12,
                background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.15)',
                color: '#fff', fontSize: 15, outline: 'none',
              }}
            />
          )}
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{score >= ROUNDS ? '🏆' : score >= 2 ? '⭐' : '⌨️'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{score}/{ROUNDS} rätt</div>
          {wpm > 0 && <div style={{ fontSize: 16, color: '#4ade80', fontWeight: 900 }}>{wpm} WPM</div>}
          {wpm > bestWpm && wpm > 0 && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{score * 20 + (score >= ROUNDS ? 50 : 0)}🪙 +{score * 30} XP</div>
          <button className="btn-primary" style={{ padding: '14px 32px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
