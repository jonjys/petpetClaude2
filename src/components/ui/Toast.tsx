import { memo } from 'react'
import { useUIStore } from '@/stores/uiStore'

const TYPE_CLASS: Record<string, string> = {
  success: 'g',
  error: 'r',
  xp: 'p',
  coin: 'y',
  info: '',
}

export const Toast = memo(function Toast() {
  const toasts = useUIStore(s => s.toasts)

  if (!toasts.length) return null

  return (
    <>
      {toasts.map(t => (
        <div key={t.id} className={`toast show${TYPE_CLASS[t.type] ? ` ${TYPE_CLASS[t.type]}` : ''}`}>
          {t.text}
        </div>
      ))}
    </>
  )
})
