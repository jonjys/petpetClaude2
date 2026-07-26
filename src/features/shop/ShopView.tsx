import { memo, useState } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { useUIStore } from '@/stores/uiStore'
import { formatNumber } from '@/utils/format'
import { audio } from '@/services/AudioService'
import { SHOP_FOOD, SHOP_BOOSTS, SHOP_HATS, SHOP_ACC, SHOP_AURA, SHOP_SKINS, SHOP_KC } from '@/constants/config'
import type { ShopItem } from '@/types/game'
import styles from './ShopView.module.css'

type Tab = 'food' | 'boost' | 'hats' | 'acc' | 'aura' | 'skins' | 'kc'

const TABS: { id: Tab; emoji: string; label: string }[] = [
  { id: 'food', emoji: '🍖', label: 'Mat' },
  { id: 'boost', emoji: '⚡', label: 'Boosts' },
  { id: 'hats', emoji: '🎩', label: 'Hattar' },
  { id: 'acc', emoji: '😎', label: 'Accesårer' },
  { id: 'aura', emoji: '✨', label: 'Aura' },
  { id: 'skins', emoji: '🎨', label: 'Skins' },
  { id: 'kc', emoji: '💎', label: 'KC' },
]

const ITEMS_MAP: Record<Tab, ShopItem[]> = {
  food: SHOP_FOOD,
  boost: SHOP_BOOSTS,
  hats: SHOP_HATS,
  acc: SHOP_ACC,
  aura: SHOP_AURA,
  skins: SHOP_SKINS,
  kc: SHOP_KC,
}

export const ShopView = memo(function ShopView() {
  const [activeTab, setActiveTab] = useState<Tab>('food')
  const pet = useGameStore(s => s.pet)
  const buyShopItem = useGameStore(s => s.buyShopItem)
  const showToast = useUIStore(s => s.showToast)
  const pushNotif = useUIStore(s => s.pushNotif)

  const items = ITEMS_MAP[activeTab]

  const handleBuy = (item: ShopItem) => {
    const balance = item.currency === 'coins' ? pet.coins : pet.kc
    if (balance < item.price) {
      showToast(`Inte tillräckligt med ${item.currency === 'coins' ? 'mynt' : 'KC'}!`, 'error')
      audio.error()
      return
    }
    const stat = item.stat ? { mood: item.stat.mood, hunger: item.stat.hunger, energy: item.stat.energy } : undefined
    buyShopItem(item.id, item.price, item.currency, stat)
    showToast(`${item.emoji} ${item.name} köpt!`, 'success')
    pushNotif(item.emoji, `Du köpte ${item.name}!`)
    audio.buy()
  }

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <span className={styles.balance}>⚡ {formatNumber(pet.coins)}</span>
        <span className={styles.balance}>💎 {formatNumber(pet.kc)} KC</span>
      </div>

      <div className={styles.tabs}>
        {TABS.map(t => (
          <button
            key={t.id}
            className={`${styles.tabBtn} ${activeTab === t.id ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            <span>{t.emoji}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      <div className={styles.grid}>
        {items.map(item => {
          const owned = pet.ownedItems.includes(item.id)
          const canAfford = (item.currency === 'coins' ? pet.coins : pet.kc) >= item.price
          return (
            <div key={item.id} className={`${styles.card} ${!canAfford ? styles.locked : ''}`}>
              <div className={styles.cardEmoji}>{item.emoji}</div>
              <div className={styles.cardName}>{item.name}</div>
              <div className={styles.cardDesc}>{item.description}</div>
              <button
                className={owned ? `btn-ghost ${styles.ownedBtn}` : 'btn-primary'}
                style={{ width: '100%', marginTop: 6, fontSize: 13, padding: '7px 8px' }}
                onClick={() => !owned && handleBuy(item)}
                disabled={owned || !canAfford}
              >
                {owned ? '✅ Äger' : `${item.currency === 'kc' ? '💎' : '🪙'}${formatNumber(item.price)}`}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
})
