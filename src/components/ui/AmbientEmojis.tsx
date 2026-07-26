import { memo, useEffect, useRef } from 'react'

const EMOJIS = ['🐟','☀️','🎱','🦋','⭐','💫','🌸','🎯','💎','🌊','🔥','🌟','🍀','⚡','🦄','🎮','🏆','🎪','🌙','✨']

export const AmbientEmojis = memo(function AmbientEmojis() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    function spawnEmoji() {
      if (!container) return
      const el = document.createElement('div')
      el.className = 'ambient-emoji'
      el.textContent = EMOJIS[Math.floor(Math.random() * EMOJIS.length)]
      const x = 5 + Math.random() * 88
      const dur = 6 + Math.random() * 7
      const delay = Math.random() * 2
      el.style.setProperty('--x', `${x}%`)
      el.style.setProperty('--dur', `${dur}s`)
      el.style.setProperty('--delay', `${delay}s`)
      el.style.fontSize = `${18 + Math.random() * 18}px`
      container.appendChild(el)
      setTimeout(() => el.remove(), (dur + delay + 0.5) * 1000)
    }

    // Initial burst
    for (let i = 0; i < 4; i++) {
      setTimeout(() => spawnEmoji(), i * 800)
    }

    const interval = setInterval(spawnEmoji, 1800)
    return () => {
      clearInterval(interval)
      container.innerHTML = ''
    }
  }, [])

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 1,
        overflow: 'hidden',
      }}
    />
  )
})
