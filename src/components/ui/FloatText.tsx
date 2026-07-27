import { memo } from 'react'
import { useUIStore } from '@/stores/uiStore'

export const FloatText = memo(function FloatText() {
  const floatTexts = useUIStore(s => s.floatTexts)

  return (
    <>
      {floatTexts.map(f => (
        <div
          key={f.id}
          className="fltxt"
          style={{
            left: f.x,
            top: f.y,
            color: f.color ?? '#00ff88',
            textShadow: `0 0 14px ${f.color ?? '#00ff88'}`,
          }}
        >
          {f.text}
        </div>
      ))}
    </>
  )
})
