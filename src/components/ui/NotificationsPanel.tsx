import { memo } from 'react'
import { useUIStore } from '@/stores/uiStore'

export const NotificationsPanel = memo(function NotificationsPanel() {
  const notifications = useUIStore(s => s.notifications)
  const markNotifsRead = useUIStore(s => s.markNotifsRead)
  const closePanel = useUIStore(s => s.closePanel)

  const handleClose = () => {
    markNotifsRead()
    closePanel()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 889 }} onClick={handleClose}>
      <div className="notif-panel open" style={{ display: 'flex' }} onClick={e => e.stopPropagation()}>
        <div className="notif-header">
          <span className="notif-title">🔔 Notiser</span>
          <button
            style={{ background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, color: 'var(--t1)', fontSize: 16, width: 34, height: 34, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={handleClose}
          >
            ✕
          </button>
        </div>
        <div className="notif-scroll">
          {notifications.length === 0 ? (
            <div className="notif-empty">
              <div className="notif-empty-icon">🔔</div>
              <div className="notif-empty-text">Inga notiser ännu 👋</div>
            </div>
          ) : (
            notifications.map(n => (
              <div key={n.id} className={`notif-item${!n.read ? ' unread' : ''}`}>
                <div className="notif-item-icon">{n.icon}</div>
                <div className="notif-item-body">
                  <div className="notif-item-title">{n.text}</div>
                  <div className="notif-item-time">{formatRelativeTime(n.ts)}</div>
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
