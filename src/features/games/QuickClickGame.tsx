import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const GAME_TIME = 20
const ICONS = ['⭐', '💎', '🌟', '🔥', '💫', '✨', '🎯', '🏆']
const TARGET = '⭐'

interface Icon {
  id: number
  emoji: string
  x: number
  y: number
}

export const QuickClickGame = memo(function QuickClickGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [icons, setIcons] = useState<Icon[]>([])
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_TIME)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_qck_best') ?? 0))
  const idRef = useRef(0)
  const scoreRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const spawnRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopAll = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (spawnRef.current) clearInterval(spawnRef.current)
  }, [])

  const end = useCallback(() => {
    stopAll()
    const s = scoreRef.current
    const prev = Number(localStorage.getItem('k0509_qck_best') ?? 0)
    if (s > prev) localStorage.setItem('k0509_qck_best', String(s))
    onWin(s * 7, s * 25)
    setPhase('done')
    audio.achievement()
  }, [stopAll, onWin])

  const start = useCallback(() => {
    scoreRef.current = 0
    setScore(0); setIcons([]); setTimeLeft(GAME_TIME)
    setPhase('playing')

    timerRef.current = setInterval(() => {
      setTimeLeft(t => { if (t <= 1) { end(); return 0 } return t - 1 })
    }, 1000)

    spawnRef.current = setInterval(() => {
      const isTarget = Math.random() < 0.35
      const emoji = isTarget ? TARGET : ICONS.filter(i => i !== TARGET)[Math.floor(Math.random() * (ICONS.length - 1))]
      setIcons(prev => {
        const filtered = prev.filter(i => i.emoji !== TARGET || prev.indexOf(i) < 4)
        return [...filtered.slice(-10), {
          id: idRef.current++,
          emoji,
          x: 4 + Math.random() * 82,
          y: 4 + Math.random() * 82,
        }]
      })
    }, 450)
  }, [end])

  const click = useCallback((id: number, emoji: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (emoji === TARGET) {
      scoreRef.current++
      setScore(scoreRef.current)
      audio.coin()
      setIcons(prev => prev.filter(i => i.id !== id))
    } else {
      audio.click()
      setScore(s => Math.max(0, s - 1))
      scoreRef.current = Math.max(0, scoreRef.current - 1)
    }
  }, [])

  useEffect(() => () => stopAll(), [stopAll])

  const timerColor = timeLeft > 10 ? '#4ade80' : timeLeft > 5 ? '#fbbf24' : '#f87171'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>⭐ Quick Click</span>
        <span className={styles.scoreDisplay}>{score}p</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>⭐</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Quick Click</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Klicka bara på <strong style={{ color: '#fbbf24' }}>⭐ stjärnorna</strong>! Andra ikoner ger -1p. 20 sekunder.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}p</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'rgba(255,255,255,.08)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(timeLeft / GAME_TIME) * 100}%`, background: timerColor, transition: 'width 1s linear' }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 900, color: timerColor }}>{timeLeft}s</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--t3)', textAlign: 'center' }}>Klicka bara ⭐ — andra ger -1p!</div>
          <div style={{ position: 'relative', height: 230, background: 'rgba(255,255,255,.04)', borderRadius: 14, border: '1px solid rgba(255,255,255,.08)', overflow: 'hidden' }}>
            {icons.map(ic => (
              <button
                key={ic.id}
                onClick={e => click(ic.id, ic.emoji, e)}
                style={{
                  position: 'absolute', left: `${ic.x}%`, top: `${ic.y}%`,
                  transform: 'translate(-50%,-50%)',
                  width: 42, height: 42, borderRadius: 10,
                  fontSize: 22,
                  background: ic.emoji === TARGET ? 'rgba(251,191,36,.2)' : 'rgba(255,255,255,.08)',
                  border: `2px solid ${ic.emoji === TARGET ? '#fbbf2466' : 'rgba(255,255,255,.15)'}`,
                  cursor: 'pointer',
                  boxShadow: ic.emoji === TARGET ? '0 0 12px #fbbf2444' : 'none',
                }}
              >
                {ic.emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{score >= 18 ? '🏆' : score >= 12 ? '⭐' : '⚡'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{score} poäng</div>
          <div style={{ fontSize: 13, color: score >= 18 ? '#4ade80' : '#fbbf24' }}>
            {score >= 22 ? 'SNABB! 🏆' : score >= 18 ? 'Utmärkt! ⭐' : score >= 12 ? 'Bra! 👍' : 'Öva mer! ⭐'}
          </div>
          {score > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{score * 7}🪙 +{score * 25} XP</div>
          <button className="btn-primary" style={{ padding: '14px 32px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
