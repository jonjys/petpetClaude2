import { memo, useState, useMemo } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { useUIStore } from '@/stores/uiStore'
import { formatNumber } from '@/utils/format'
import { audio } from '@/services/AudioService'
import { SHOP_FOOD, SHOP_BOOSTS, SHOP_HATS, SHOP_ACC, SHOP_AURA, SHOP_SKINS, SHOP_KC } from '@/constants/config'
import type { ShopItem } from '@/types/game'
import styles from './ShopView.module.css'

type Tab = 'featured' | 'food' | 'boost' | 'hats' | 'acc' | 'aura' | 'skins' | 'kc'

const TABS: { id: Tab; emoji: string; label: string }[] = [
  { id: 'featured', emoji: '🔥', label: 'Deals' },
  { id: 'food', emoji: '🍖', label: 'Mat' },
  { id: 'boost', emoji: '⚡', label: 'Boosts' },
  { id: 'hats', emoji: '🎩', label: 'Hattar' },
  { id: 'acc', emoji: '😎', label: 'Acc.' },
  { id: 'aura', emoji: '✨', label: 'Aura' },
  { id: 'skins', emoji: '🎨', label: 'Skins' },
  { id: 'kc', emoji: '💎', label: 'KC' },
]

const ITEMS_MAP: Record<Exclude<Tab, 'featured'>, ShopItem[]> = {
  food: SHOP_FOOD,
  boost: SHOP_BOOSTS,
  hats: SHOP_HATS,
  acc: SHOP_ACC,
  aura: SHOP_AURA,
  skins: SHOP_SKINS,
  kc: SHOP_KC,
}

const FEATURED_DEALS: (ShopItem & { originalPrice: number; discount: number })[] = [
  { ...SHOP_FOOD[4],   originalPrice: 300, price: 180, discount: 40 },
  { ...SHOP_SKINS[1],  originalPrice: 500, price: 350, discount: 30 },
  { ...SHOP_HATS[2],   originalPrice: 250, price: 150, discount: 40 },
  { ...SHOP_AURA[3],   originalPrice: 350, price: 210, discount: 40 },
  { ...SHOP_KC[2],     originalPrice: 20,  price: 15,  discount: 25 },
]

const EQUIP_SLOT: Partial<Record<Tab, 'hat' | 'acc' | 'aura'>> = {
  hats: 'hat', acc: 'acc', aura: 'aura',
}

const NEW_ITEM_IDS = new Set(['kc_phoenix', 'kc_mega_xp', 'kc_coinx2'])

export const ShopView = memo(function ShopView() {
  const [activeTab, setActiveTab] = useState<Tab>('featured')
  const pet = useGameStore(s => s.pet)
  const buyShopItem = useGameStore(s => s.buyShopItem)
  const equipItem = useGameStore(s => s.equipItem)
  const showToast = useUIStore(s => s.showToast)
  const pushNotif = useUIStore(s => s.pushNotif)

  const handleEquip = (item: ShopItem) => {
    const slot = EQUIP_SLOT[activeTab as Tab]
    if (slot) {
      equipItem(slot, item.id)
      showToast(`${item.emoji} ${item.name} utrustad!`, 'success')
      audio.click()
      return
    }
    if (activeTab === 'skins') {
      useGameStore.setState(s => ({ pet: { ...s.pet, activeSkin: item.id } }))
      useGameStore.getState().save()
      showToast(`${item.emoji} ${item.name} aktiverad!`, 'success')
      audio.click()
    }
  }

  const timeLeft = useMemo(() => {
    const now = Date.now()
    const msPerDay = 86400000
    const nextReset = Math.ceil(now / msPerDay) * msPerDay
    const diff = nextReset - now
    const h = Math.floor(diff / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    return `${h}t ${m}m`
  }, [])

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
        <span className={styles.balance}>🪙 {formatNumber(pet.coins)}</span>
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

      {activeTab === 'featured' ? (
        <div>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '4px 2px 12px',
          }}>
            <div style={{ fontFamily: 'var(--ff-head)', fontSize: 13, fontWeight: 900, color: '#fff' }}>
              🔥 DAGLIGA ERBJUDANDEN
            </div>
            <div style={{ fontSize: 10, color: 'var(--orange)', fontWeight: 700 }}>
              ⏱ {timeLeft} kvar
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {FEATURED_DEALS.map(deal => {
              const owned = pet.ownedItems.includes(deal.id)
              const canAfford = (deal.currency === 'coins' ? pet.coins : pet.kc) >= deal.price
              return (
                <div
                  key={deal.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    background: 'rgba(255,136,68,.07)',
                    border: '1px solid rgba(255,136,68,.2)',
                    borderRadius: 14,
                    padding: '12px 14px',
                    opacity: !canAfford && !owned ? 0.6 : 1,
                  }}
                >
                  <div style={{ fontSize: 36 }}>{deal.emoji}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'var(--ff-head)', fontSize: 13, fontWeight: 700, color: '#fff' }}>{deal.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 1 }}>{deal.description}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <span style={{ fontFamily: 'var(--ff-head)', fontSize: 15, fontWeight: 900, color: 'var(--green)' }}>
                        {deal.currency === 'kc' ? '💎' : '🪙'}{formatNumber(deal.price)}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--t3)', textDecoration: 'line-through' }}>
                        {formatNumber(deal.originalPrice)}
                      </span>
                      <span style={{
                        background: 'rgba(255,68,85,.2)', border: '1px solid rgba(255,68,85,.4)',
                        borderRadius: 6, padding: '1px 5px', fontSize: 9, fontWeight: 900, color: 'var(--red)',
                      }}>
                        -{deal.discount}%
                      </span>
                    </div>
                  </div>
                  <button
                    className={owned ? 'btn-ghost' : 'btn-primary'}
                    style={{ fontSize: 12, padding: '8px 12px', minWidth: 60, flexShrink: 0 }}
                    onClick={() => !owned && handleBuy(deal)}
                    disabled={owned || !canAfford}
                  >
                    {owned ? '✅' : 'Köp'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className={styles.grid}>
          {ITEMS_MAP[activeTab as Exclude<Tab, 'featured'>].map(item => {
            const owned = pet.ownedItems.includes(item.id)
            const canAfford = (item.currency === 'coins' ? pet.coins : pet.kc) >= item.price
            const slot = EQUIP_SLOT[activeTab as Tab]
            const equipped = slot
              ? pet.wardrobe[slot] === item.id
              : activeTab === 'skins' ? pet.activeSkin === item.id : false
            const isEquippable = owned && (slot !== undefined || activeTab === 'skins')
            return (
              <div
                key={item.id}
                className={`${styles.card} ${!canAfford && !owned ? styles.locked : ''} ${equipped ? styles.equipped ?? '' : ''}`}
                style={{ position: 'relative', ...(equipped ? { border: '1px solid var(--green)', background: 'rgba(0,255,136,.07)' } : {}) }}
              >
                {NEW_ITEM_IDS.has(item.id) && !owned && (
                  <span style={{
                    position: 'absolute', top: 4, right: 4,
                    background: 'rgba(255,51,119,.2)', border: '1px solid rgba(255,51,119,.5)',
                    borderRadius: 5, fontSize: 7, fontWeight: 900, color: 'var(--pink)',
                    padding: '1px 4px', letterSpacing: .5, lineHeight: 1.4,
                  }}>NY</span>
                )}
                <div className={styles.cardEmoji}>{item.emoji}</div>
                <div className={styles.cardName}>{item.name}</div>
                <div className={styles.cardDesc}>{item.description}</div>
                {equipped && <div style={{ fontSize: 8, color: 'var(--green)', fontWeight: 900, letterSpacing: 1, marginTop: 2 }}>✓ UTRUSTAD</div>}
                {isEquippable ? (
                  <button
                    className={equipped ? `btn-ghost ${styles.ownedBtn}` : 'btn-primary'}
                    style={{ width: '100%', marginTop: 6, fontSize: 12, padding: '7px 8px' }}
                    onClick={() => handleEquip(item)}
                    disabled={equipped}
                  >
                    {equipped ? '✅ Aktivt' : '👕 Utrusta'}
                  </button>
                ) : (
                  <button
                    className={owned ? `btn-ghost ${styles.ownedBtn}` : 'btn-primary'}
                    style={{ width: '100%', marginTop: 6, fontSize: 13, padding: '7px 8px' }}
                    onClick={() => !owned && handleBuy(item)}
                    disabled={owned || !canAfford}
                  >
                    {owned ? '✅ Äger' : `${item.currency === 'kc' ? '💎' : '🪙'}${formatNumber(item.price)}`}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
})
