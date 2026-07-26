import { memo } from 'react'
import { useUIStore } from '@/stores/uiStore'

export const Toast = memo(function Toast() {
  const toasts = useUIStore(s => s.toasts)

  if (!toasts.length) return null

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {t.text}
        </div>
      ))}
    </div>
  )
})
