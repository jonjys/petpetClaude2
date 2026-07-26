import { memo } from 'react'
import { useUIStore } from '@/stores/uiStore'
import type { TabId } from '@/types/game'
import styles from './BottomNav.module.css'

const TABS: Array<{ id: TabId; icon: string; label: string }> = [
  { id: 'pet',     icon: '🐾', label: 'PET' },
  { id: 'flash',   icon: '⚡', label: 'FLASH' },
  { id: 'create',  icon: '＋', label: 'SKAPA' },
  { id: 'games',   icon: '🎮', label: 'GAMES' },
  { id: 'profile', icon: '👤', label: 'PROFIL' },
]

export const BottomNav = memo(function BottomNav() {
  const activeTab = useUIStore(s => s.activeTab)
  const setTab = useUIStore(s => s.setTab)
  const setFabOpen = useUIStore(s => s.setFabOpen)

  function handleTab(id: TabId) {
    if (id === 'create') {
      setFabOpen(true)
    } else {
      setTab(id)
    }
  }

  return (
    <nav className={styles.nav}>
      {TABS.map(tab => (
        <button
          key={tab.id}
          className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''} ${tab.id === 'create' ? styles.create : ''}`}
          onClick={() => handleTab(tab.id)}
          aria-label={tab.label}
        >
          <span className={styles.icon}>{tab.icon}</span>
          <span className={styles.label}>{tab.label}</span>
          {tab.id === 'create' && <div className={styles.fab}>＋</div>}
        </button>
      ))}
    </nav>
  )
})
