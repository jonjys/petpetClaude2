import { memo } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { useUIStore } from '@/stores/uiStore'
import { formatNumber } from '@/utils/format'
import styles from './Header.module.css'

export const Header = memo(function Header() {
  const coins = useGameStore(s => s.pet.coins)
  const kc    = useGameStore(s => s.pet.kc)
  const streak = useGameStore(s => s.pet.streak)
  const notifCount = useUIStore(s => s.notifCount)
  const openPanelId = useUIStore(s => s.openPanelId)
  const setTab = useUIStore(s => s.setTab)

  return (
    <header className={styles.header}>
      <button className={styles.brand} onClick={() => setTab('pet')}>
        KARMA
      </button>

      <div className={styles.pills}>
        {/* POTT jackpot pill */}
        <div className={styles.pott}>
          <span>💰</span>
          <span className={styles.pottLabel}>POTT</span>
          <span className={styles.pottVal}>{formatNumber(coins)} kr</span>
        </div>

        {streak > 0 && (
          <div className={`${styles.pill} ${styles.streak}`}>
            <span>🔥</span>
            <span>{streak}d</span>
          </div>
        )}

        <div className={`${styles.pill} ${styles.kc}`}>
          <span>💎</span>
          <span>{formatNumber(kc)}</span>
        </div>
      </div>

      {/* Bell */}
      <button className={styles.iconBtn} onClick={() => openPanelId('notifications')}>
        🔔
        {notifCount > 0 && (
          <span className={styles.badge}>{notifCount > 9 ? '9+' : notifCount}</span>
        )}
      </button>
    </header>
  )
})
