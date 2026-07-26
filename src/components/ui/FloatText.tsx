import { memo } from 'react'
import { useUIStore } from '@/stores/uiStore'

export const FloatText = memo(function FloatText() {
  const floatTexts = useUIStore(s => s.floatTexts)

  return (
    <>
      {floatTexts.map(f => (
        <div
          key={f.id}
          className="float-text"
          style={{
            left: f.x,
            top: f.y,
            color: f.color ?? '#c084fc',
          }}
        >
          {f.text}
        </div>
      ))}
    </>
  )
})
