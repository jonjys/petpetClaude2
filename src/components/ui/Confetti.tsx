import { memo, useMemo } from 'react'
import { useUIStore } from '@/stores/uiStore'

const COLORS = ['#a855f7', '#ec4899', '#fbbf24', '#4ade80', '#60a5fa', '#f87171']

export const Confetti = memo(function Confetti() {
  const active = useUIStore(s => s.confettiActive)

  const pieces = useMemo(() => (
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      color: COLORS[i % COLORS.length],
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 0.8}s`,
      dur: `${1.5 + Math.random() * 1.5}s`,
    }))
  ), [active]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!active) return null

  return (
    <>
      {pieces.map(p => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: p.left,
            top: '-10px',
            background: p.color,
            animationDuration: p.dur,
            animationDelay: p.delay,
          }}
        />
      ))}
    </>
  )
})
