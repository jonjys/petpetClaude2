import { memo } from 'react'
import { useUIStore } from '@/stores/uiStore'
import type { TabId } from '@/types/game'
import styles from './BottomNav.module.css'

const TAB_CLASSES: Record<string, string> = {
  pet:     styles.tabPet,
  flash:   styles.tabFlash,
  games:   styles.tabGames,
  profile: styles.tabProfile,
}

export const BottomNav = memo(function BottomNav() {
  const activeTab = useUIStore(s => s.activeTab)
  const setTab = useUIStore(s => s.setTab)

  return (
    <nav className={styles.nav}>
      <button
        className={`${styles.tab} ${styles.tabPet} ${activeTab === 'pet' ? styles.active : ''}`}
        onClick={() => setTab('pet')}
      >
        <span className={styles.icon}>🐾</span>
        <span className={styles.label}>PET</span>
      </button>

      <button
        className={`${styles.tab} ${styles.tabFlash} ${activeTab === 'flash' ? styles.active : ''}`}
        onClick={() => setTab('flash')}
      >
        <span className={styles.icon}>⚡</span>
        <span className={styles.label}>FLASH</span>
      </button>

      {/* Center SKAPA */}
      <button
        className={styles.create}
        onClick={() => setTab('create')}
      >
        <div className={styles.fab}>＋</div>
        <span className={styles.createLabel}>SKAPA</span>
      </button>

      <button
        className={`${styles.tab} ${styles.tabGames} ${activeTab === 'games' ? styles.active : ''}`}
        onClick={() => setTab('games')}
      >
        <span className={styles.icon}>🎮</span>
        <span className={styles.label}>GAMES</span>
      </button>

      <button
        className={`${styles.tab} ${styles.tabProfile} ${activeTab === 'profile' ? styles.active : ''}`}
        onClick={() => setTab('profile')}
      >
        <span className={styles.icon}>👤</span>
        <span className={styles.label}>PROFIL</span>
      </button>
    </nav>
  )
})
