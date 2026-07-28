import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const CATEGORIES = [
  {
    name: 'Djur', emoji: '🐾',
    items: ['🐱','🐶','🐸','🐼','🦊','🐯','🐺','🦁','🐘','🦒','🐬','🦅'],
  },
  {
    name: 'Mat', emoji: '🍽️',
    items: ['🍎','🍕','🍔','🍣','🍰','🍦','🥑','🍇','🍓','🌮','🥦','🍰'],
  },
  {
    name: 'Fordon', emoji: '🚗',
    items: ['🚗','✈️','🚀','🚂','⛵','🚁','🛸','🚢','🏎️','🚲','🛶','🛺'],
  },
]

const GAME_TIME = 30

export const SpeedSortGame = memo(function SpeedSortGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [catA, setCatA] = useState(CATEGORIES[0])
  const [catB, setCatB] = useState(CATEGORIES[1])
  const [items, setItems] = useState<{ emoji: string; catName: string }[]>([])
  const [currentItem, setCurrentItem] = useState(0)
  const [score, setScore] = useState(0)
  const [misses, setMisses] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_TIME)
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [streak, setStreak] = useState(0)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_sort_best') ?? 0))
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const buildItems = useCallback((a: typeof CATEGORIES[0], b: typeof CATEGORIES[0]) => {
    const pool: { emoji: string; catName: string }[] = [
      ...a.items.map(e => ({ emoji: e, catName: a.name })),
      ...b.items.map(e => ({ emoji: e, catName: b.name })),
    ].sort(() => Math.random() - 0.5)
    return pool
  }, [])

  const start = useCallback(() => {
    const idx1 = Math.floor(Math.random() * CATEGORIES.length)
    let idx2 = (idx1 + 1) % CATEGORIES.length
    const a = CATEGORIES[idx1], b = CATEGORIES[idx2]
    setCatA(a); setCatB(b)
    setItems(buildItems(a, b))
    setCurrentItem(0); setScore(0); setMisses(0); setStreak(0); setFeedback(null)
    setTimeLeft(GAME_TIME)
    setPhase('playing')
  }, [buildItems])

  useEffect(() => {
    if (phase !== 'playing') return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current!); setPhase('done'); return 0 }
        return t - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase])

  const pick = useCallback((catName: string) => {
    if (feedback !== null) return
    const item = items[currentItem]
    if (!item) return
    const correct = item.catName === catName
    setFeedback(correct ? 'correct' : 'wrong')
    if (correct) { const ns = streak + 1; setStreak(ns); setScore(s => s + (ns >= 5 ? 2 : 1)); audio.coin() }
    else { setStreak(0); setMisses(m => m + 1); audio.click() }
    setTimeout(() => {
      setFeedback(null)
      setCurrentItem(i => {
        if (i + 1 >= items.length) { setPhase('done'); return i }
        return i + 1
      })
    }, 200)
  }, [feedback, items, currentItem, streak])

  useEffect(() => {
    if (phase === 'done') {
      const prev = Number(localStorage.getItem('k0509_sort_best') ?? 0)
      if (score > prev) localStorage.setItem('k0509_sort_best', String(score))
      onWin(score * 6, score * 8)
      audio.achievement()
    }
  }, [phase, score, onWin])

  const item = items[currentItem]
  const timerColor = timeLeft > 15 ? '#4ade80' : timeLeft > 7 ? '#fbbf24' : '#f87171'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>⚡ Snabbsortera</span>
        <span className={styles.scoreDisplay}>{score} · ✗{misses}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>⚡</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Snabbsortera</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Sortera emojis till rätt kategori så snabbt du kan!<br />30 sekunder · Streak-bonus vid 5+ i rad
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore} poäng</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && item && (
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,.08)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(timeLeft / GAME_TIME) * 100}%`, background: timerColor, borderRadius: 2, transition: 'width 1s linear' }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 900, color: timerColor }}>{timeLeft}s</span>
            {streak >= 5 && <span style={{ fontSize: 11, color: '#fbbf24' }}>🔥{streak}×</span>}
          </div>

          <div style={{
            background: feedback === 'correct' ? 'rgba(74,222,128,.1)' : feedback === 'wrong' ? 'rgba(248,113,113,.1)' : 'rgba(255,255,255,.04)',
            border: `1px solid ${feedback === 'correct' ? 'rgba(74,222,128,.4)' : feedback === 'wrong' ? 'rgba(248,113,113,.4)' : 'rgba(255,255,255,.1)'}`,
            borderRadius: 20, padding: '32px 0', textAlign: 'center', transition: 'all .15s',
          }}>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 8 }}>Var hör den hemma?</div>
            <div style={{ fontSize: 64 }}>{item.emoji}</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[catA, catB].map(c => (
              <button
                key={c.name}
                onClick={() => pick(c.name)}
                disabled={feedback !== null}
                style={{
                  padding: '20px 0', borderRadius: 16, fontSize: 15, fontWeight: 900,
                  background: 'rgba(255,255,255,.05)', border: '2px solid rgba(255,255,255,.1)',
                  cursor: 'pointer', color: '#e8e8f0', transition: 'all .15s',
                }}
              >
                {c.emoji}<br />{c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{score >= 20 ? '⚡' : score >= 10 ? '⭐' : '⚡'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{score} rätt · {misses} fel</div>
          <div style={{ fontSize: 14, color: score >= 20 ? '#4ade80' : '#fbbf24' }}>
            {score >= 20 ? 'Sorteringsexpert! ⚡' : score >= 10 ? 'Bra! ⭐' : 'Öva mer! ⚡'}
          </div>
          {score > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{score * 6}🪙 +{score * 8} XP</div>
          <button className="btn-primary" style={{ padding: '14px 32px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
