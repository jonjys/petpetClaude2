import { memo } from 'react'
import { useUIStore } from '@/stores/uiStore'
import styles from './NotificationsPanel.module.css'

export const NotificationsPanel = memo(function NotificationsPanel() {
  const notifications = useUIStore(s => s.notifications)
  const markNotifsRead = useUIStore(s => s.markNotifsRead)
  const closePanel = useUIStore(s => s.closePanel)

  const handleClose = () => {
    markNotifsRead()
    closePanel()
  }

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.panel} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <span className={styles.title}>🔔 Notiser</span>
          <button className={styles.closeBtn} onClick={handleClose}>✕</button>
        </div>
        <div className={styles.list}>
          {notifications.length === 0 ? (
            <div className={styles.empty}>Inga notiser ännu 👋</div>
          ) : (
            notifications.map(n => (
              <div key={n.id} className={`${styles.item} ${!n.read ? styles.unread : ''}`}>
                <span className={styles.icon}>{n.icon}</span>
                <div className={styles.content}>
                  <span className={styles.text}>{n.text}</span>
                  <span className={styles.time}>{formatRelativeTime(n.ts)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
})

function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts
  if (diff < 60000) return 'just nu'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m sedan`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h sedan`
  return `${Math.floor(diff / 86400000)}d sedan`
}
