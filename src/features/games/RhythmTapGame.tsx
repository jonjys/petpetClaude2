import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const PATTERNS = [
  { name: 'Enkel',   bpm: 80,  beats: [1,0,1,0,1,0,1,0, 1,0,1,0,1,0,1,0] },
  { name: 'Medium',  bpm: 100, beats: [1,0,0,1,0,1,0,0, 1,1,0,1,0,0,1,0] },
  { name: 'Svår',    bpm: 130, beats: [1,0,1,1,0,1,0,1, 1,0,0,1,1,0,1,1] },
]

type Rating = 'PERFECT' | 'GOOD' | 'MISS'

export const RhythmTapGame = memo(function RhythmTapGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [patIdx, setPatIdx] = useState(0)
  const [beatIdx, setBeatIdx] = useState(0)
  const [active, setActive] = useState(false)
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [lastRating, setLastRating] = useState<Rating | null>(null)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_rt_best') ?? 0))
  const tapWindowRef = useRef(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const beatRef = useRef(0)
  const doneRef = useRef(false)

  const start = useCallback((pi: number) => {
    setPatIdx(pi); setBeatIdx(0); setScore(0); setCombo(0); setLastRating(null)
    setActive(false); doneRef.current = false; beatRef.current = 0
    setPhase('playing')
  }, [])

  useEffect(() => {
    if (phase !== 'playing') return
    const pat = PATTERNS[patIdx]
    const interval = Math.floor(60000 / pat.bpm)
    intervalRef.current = setInterval(() => {
      const bi = beatRef.current
      if (bi >= pat.beats.length) {
        clearInterval(intervalRef.current!)
        if (!doneRef.current) { doneRef.current = true; setPhase('done') }
        return
      }
      const isBeat = pat.beats[bi] === 1
      setActive(isBeat)
      tapWindowRef.current = isBeat
      beatRef.current = bi + 1
      setBeatIdx(bi + 1)
      setTimeout(() => { setActive(false); tapWindowRef.current = false }, interval * 0.7)
    }, interval)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [phase, patIdx])

  useEffect(() => {
    if (phase === 'done') {
      const prev = Number(localStorage.getItem('k0509_rt_best') ?? 0)
      if (score > prev) localStorage.setItem('k0509_rt_best', String(score))
      onWin(score * 10, score * 12)
      audio.achievement()
    }
  }, [phase, score, onWin])

  const tap = useCallback(() => {
    if (phase !== 'playing') return
    const pat = PATTERNS[patIdx]
    const isBeat = pat.beats[Math.max(0, beatRef.current - 1)] === 1
    if (tapWindowRef.current && isBeat) {
      const nc = combo + 1; setCombo(nc)
      const pts = nc >= 5 ? 3 : nc >= 3 ? 2 : 1
      setScore(s => s + pts)
      setLastRating('PERFECT')
      audio.coin()
    } else if (!isBeat) {
      setCombo(0); setLastRating('MISS'); audio.click()
    } else {
      setLastRating('GOOD'); setCombo(c => c + 1); setScore(s => s + 1); audio.click()
    }
    setTimeout(() => setLastRating(null), 400)
  }, [phase, patIdx, combo])

  const pat = PATTERNS[patIdx]
  const progress = (beatIdx / pat.beats.length) * 100
  const ratingColor = lastRating === 'PERFECT' ? '#4ade80' : lastRating === 'GOOD' ? '#fbbf24' : '#f87171'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🥁 Rhythm Tap</span>
        <span className={styles.scoreDisplay}>{score}p · ×{combo}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🥁</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Rhythm Tap</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Tryck i takt med rytmen!<br />Välj svårighetsgrad:
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore} poäng</div>}
          <div style={{ display: 'flex', gap: 10 }}>
            {PATTERNS.map((p, i) => (
              <button key={i} className="btn-primary" style={{ padding: '10px 16px', fontSize: 13 }} onClick={() => start(i)}>
                {p.name}<br /><span style={{ fontSize: 10, opacity: .7 }}>{p.bpm} BPM</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === 'playing' && (
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center' }}>
          <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,.08)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: '#818cf8', borderRadius: 2, transition: 'width .1s linear' }} />
          </div>
          <div style={{ fontSize: 12, color: 'var(--t3)' }}>{pat.name} · {pat.bpm} BPM</div>
          <div style={{ height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {lastRating && (
              <div style={{ fontFamily: 'var(--ff-head)', fontSize: 20, fontWeight: 900, color: ratingColor }}>{lastRating}</div>
            )}
          </div>
          <button
            onPointerDown={tap}
            style={{
              width: 160, height: 160, borderRadius: '50%', cursor: 'pointer', border: 'none',
              background: active ? 'rgba(129,140,248,.35)' : 'rgba(129,140,248,.08)',
              boxShadow: active ? '0 0 40px rgba(129,140,248,.5)' : 'none',
              transition: 'all .05s', fontSize: 52,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            🥁
          </button>
          <div style={{ fontSize: 12, color: active ? '#818cf8' : 'var(--t3)', fontWeight: active ? 900 : 400, transition: 'color .05s' }}>
            {active ? '◉ TRYCK!' : '○ Vänta...'}
          </div>
          {combo >= 3 && <div style={{ fontSize: 13, color: '#fbbf24' }}>🔥 {combo}x Combo!</div>}
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{score >= 30 ? '🎵' : score >= 15 ? '⭐' : '🥁'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{score} poäng</div>
          <div style={{ fontSize: 14, color: score >= 30 ? '#4ade80' : '#fbbf24' }}>
            {score >= 30 ? 'Rytmgud! 🎵' : score >= 15 ? 'Bra rytm! ⭐' : 'Öva mer! 🥁'}
          </div>
          {score > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{score * 10}🪙 +{score * 12} XP</div>
          <div style={{ display: 'flex', gap: 10 }}>
            {PATTERNS.map((p, i) => (
              <button key={i} className="btn-primary" style={{ padding: '10px 14px', fontSize: 12 }} onClick={() => start(i)}>
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
})
