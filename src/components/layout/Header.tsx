import { memo } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { formatNumber } from '@/utils/format'
import styles from './Header.module.css'

export const Header = memo(function Header() {
  const coins = useGameStore(s => s.pet.coins)
  const kc = useGameStore(s => s.pet.kc)

  return (
    <header className={styles.header}>
      <span className={styles.brand}>KARMA</span>
      <div className={styles.right}>
        <div className={styles.currency}>
          <span className={styles.currencyIcon}>💰</span>
          <span className={styles.currencyVal}>{formatNumber(coins)}</span>
        </div>
        {kc > 0 && (
          <div className={`${styles.currency} ${styles.kc}`}>
            <span className={styles.currencyIcon}>✨</span>
            <span className={styles.currencyVal}>{formatNumber(kc)} KC</span>
          </div>
        )}
      </div>
    </header>
  )
})
