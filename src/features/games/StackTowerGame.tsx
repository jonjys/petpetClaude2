import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

interface Block {
  id: number
  width: number
  offset: number
}

const BASE_WIDTH = 200
const BLOCK_HEIGHT = 28
const MAX_VISIBLE = 10

export const StackTowerGame = memo(function StackTowerGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [blocks, setBlocks] = useState<Block[]>([])
  const [sliderX, setSliderX] = useState(0)
  const [sliderDir, setSliderDir] = useState(1)
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_st_best') ?? 0))
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const speedRef = useRef(2)

  const start = useCallback(() => {
    const base: Block = { id: 0, width: BASE_WIDTH, offset: 0 }
    setBlocks([base]); setScore(0); setCombo(0)
    setSliderX(-BASE_WIDTH / 2); setSliderDir(1)
    speedRef.current = 2; setPhase('playing')
  }, [])

  useEffect(() => {
    if (phase !== 'playing') return
    animRef.current = setInterval(() => {
      setSliderX(x => {
        const next = x + sliderDir * speedRef.current
        if (next > BASE_WIDTH / 2 || next < -BASE_WIDTH / 2) {
          setSliderDir(d => -d)
          return x - sliderDir * speedRef.current
        }
        return next
      })
    }, 16)
    return () => { if (animRef.current) clearInterval(animRef.current) }
  }, [phase, sliderDir])

  const drop = useCallback(() => {
    if (phase !== 'playing') return
    setBlocks(prev => {
      if (prev.length === 0) return prev
      const top = prev[prev.length - 1]
      const newOffset = sliderX
      const overlap = (top.width / 2) - Math.abs(newOffset - top.offset)
      if (overlap <= 0) {
        if (animRef.current) clearInterval(animRef.current)
        const sc = prev.length - 1
        const prev2 = Number(localStorage.getItem('k0509_st_best') ?? 0)
        if (sc > prev2) localStorage.setItem('k0509_st_best', String(sc))
        const reward = sc * 60
        if (reward > 0) onWin(Math.round(reward / 5), reward)
        setTimeout(() => setPhase('done'), 50)
        return prev
      }
      const newWidth = Math.min(top.width, overlap)
      const newOff = (newOffset + top.offset) / 2
      const nb: Block = { id: prev.length, width: newWidth, offset: newOff }
      const isPerfect = Math.abs(newOffset - top.offset) < 4
      if (isPerfect) { audio.achievement(); setCombo(c => c + 1) } else { audio.coin(); setCombo(0) }
      setScore(s => s + (isPerfect ? 200 : 100) + combo * 50)
      speedRef.current = Math.min(6, 2 + prev.length * 0.2)
      return [...prev, nb]
    })
  }, [phase, sliderX, combo, onWin])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.code === 'Space') drop() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [drop])

  const visibleBlocks = blocks.slice(-MAX_VISIBLE)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🏗️ Stapla Torn</span>
        <span className={styles.scoreDisplay}>{score}p · {blocks.length - 1} block</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🏗️</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Stapla Torn</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Tryck i rätt ögonblick för att stapla block!<br />Perfekt placering ger bonuspoäng 🎯
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore} block</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {(phase === 'playing' || phase === 'done') && (
        <div style={{ padding: '0 14px' }} onClick={phase === 'playing' ? drop : undefined}>
          {combo > 1 && <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#fbbf24', marginBottom: 4 }}>🔥 PERFEKT ×{combo}!</div>}

          <div style={{ position: 'relative', height: MAX_VISIBLE * (BLOCK_HEIGHT + 4), background: 'rgba(0,10,20,.7)', borderRadius: 12, overflow: 'hidden', border: '2px solid rgba(255,255,255,.08)' }}>
            {visibleBlocks.map((block, idx) => {
              const stackIdx = visibleBlocks.length - 1 - idx
              const hue = (block.id * 25) % 360
              return (
                <div
                  key={block.id}
                  style={{
                    position: 'absolute',
                    bottom: stackIdx * (BLOCK_HEIGHT + 4),
                    left: '50%',
                    width: block.width,
                    height: BLOCK_HEIGHT,
                    transform: `translateX(calc(-50% + ${block.offset}px))`,
                    background: `hsl(${hue}, 70%, 55%)`,
                    borderRadius: 4,
                    boxShadow: `0 2px 8px hsl(${hue}, 70%, 40%)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, color: '#fff',
                  }}
                >
                  {block.id === 0 ? '🏠' : ''}
                </div>
              )
            })}

            {phase === 'playing' && blocks.length > 0 && (
              <div style={{
                position: 'absolute',
                bottom: visibleBlocks.length * (BLOCK_HEIGHT + 4),
                left: '50%',
                width: blocks[blocks.length - 1].width,
                height: BLOCK_HEIGHT,
                transform: `translateX(calc(-50% + ${sliderX}px))`,
                background: `hsl(${(blocks.length * 25) % 360}, 70%, 65%)`,
                borderRadius: 4,
                border: '2px dashed rgba(255,255,255,.5)',
                boxShadow: '0 0 12px rgba(255,255,255,.3)',
              }} />
            )}
          </div>

          {phase === 'playing' && (
            <div style={{ textAlign: 'center', marginTop: 12, fontSize: 13, color: 'var(--t3)' }}>
              Tryck/klicka för att droppa! (eller mellanslag)
            </div>
          )}

          {phase === 'done' && (
            <div style={{ textAlign: 'center', marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
              <div style={{ fontWeight: 900, color: '#4ade80', fontSize: 16 }}>🏗️ {blocks.length - 1} block staplade!</div>
              <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Spela igen!</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
})
