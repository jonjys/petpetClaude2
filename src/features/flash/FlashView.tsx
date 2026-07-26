import { memo, useState, useCallback } from 'react'
import { useGame } from '@/hooks/useGame'
import { useGameStore } from '@/stores/gameStore'
import { formatNumber } from '@/utils/format'
import { audio } from '@/services/AudioService'
import styles from './FlashView.module.css'

interface FlashItem {
  id: string
  emoji: string
  name: string
  baseCost: number
  baseIncome: number
  owned: number
  multiplier: number
}

const FLASH_ITEMS: Omit<FlashItem, 'owned' | 'multiplier'>[] = [
  { id: 'lemonad', emoji: '🍋', name: 'Lemonadsstånd', baseCost: 10, baseIncome: 1 },
  { id: 'pizza', emoji: '🍕', name: 'Pizzakiosk', baseCost: 75, baseIncome: 8 },
  { id: 'kaffe', emoji: '☕', name: 'Kaffebutik', baseCost: 300, baseIncome: 35 },
  { id: 'tacos', emoji: '🌮', name: 'Tacovagn', baseCost: 800, baseIncome: 100 },
  { id: 'sushi', emoji: '🍣', name: 'Sushirestaurang', baseCost: 2500, baseIncome: 320 },
  { id: 'burger', emoji: '🍔', name: 'Burgerkedja', baseCost: 8000, baseIncome: 1000 },
  { id: 'rocket', emoji: '🚀', name: 'Rymdcafé', baseCost: 25000, baseIncome: 4000 },
  { id: 'diamond', emoji: '💎', name: 'Diamantgalleri', baseCost: 100000, baseIncome: 18000 },
]

const SAVE_KEY = 'k0509_flashState'

function loadFlashState(): FlashItem[] {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return FLASH_ITEMS.map(i => ({ ...i, owned: 0, multiplier: 1 }))
}

function saveFlashState(items: FlashItem[]) {
  localStorage.setItem(SAVE_KEY, JSON.stringify(items))
}

export const FlashView = memo(function FlashView() {
  const [items, setItems] = useState<FlashItem[]>(loadFlashState)
  const [lastEarned, setLastEarned] = useState(0)
  const { awardCoins } = useGame()
  const coins = useGameStore(s => s.pet.coins)

  const getCost = useCallback((item: FlashItem) => {
    return Math.floor(item.baseCost * Math.pow(1.15, item.owned))
  }, [])

  const getIncome = useCallback((item: FlashItem) => {
    return item.baseIncome * item.owned * item.multiplier
  }, [])

  const totalIncome = items.reduce((sum, i) => sum + getIncome(i), 0)

  const collect = useCallback(() => {
    if (totalIncome <= 0) return
    awardCoins(totalIncome)
    setLastEarned(totalIncome)
    audio.coin()
    setTimeout(() => setLastEarned(0), 2000)
  }, [totalIncome, awardCoins])

  const buy = useCallback((id: string) => {
    setItems(prev => {
      const item = prev.find(i => i.id === id)
      if (!item) return prev
      const cost = Math.floor(item.baseCost * Math.pow(1.15, item.owned))
      if (coins < cost) return prev
      const updated = prev.map(i =>
        i.id === id ? { ...i, owned: i.owned + 1 } : i
      )
      saveFlashState(updated)
      return updated
    })
    audio.buy()
  }, [coins])

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.incomeDisplay}>
          <span className={styles.incomeLabel}>Per klick</span>
          <span className={styles.incomeValue}>🪙 {formatNumber(totalIncome)}</span>
        </div>
        <button
          className={`btn-gold ${styles.collectBtn}`}
          onClick={collect}
          disabled={totalIncome <= 0}
        >
          {lastEarned > 0 ? `+${formatNumber(lastEarned)} 🪙` : '💰 Samla in'}
        </button>
      </div>

      <div className={styles.grid}>
        {items.map(item => {
          const cost = getCost(item)
          const income = getIncome(item)
          const canAfford = coins >= cost
          return (
            <div key={item.id} className={`${styles.card} ${!canAfford ? styles.locked : ''}`}>
              <div className={styles.cardEmoji}>{item.emoji}</div>
              <div className={styles.cardInfo}>
                <div className={styles.cardName}>{item.name}</div>
                <div className={styles.cardStats}>
                  {item.owned > 0 && (
                    <span className={styles.owned}>×{item.owned}</span>
                  )}
                  {income > 0 && (
                    <span className={styles.income}>🪙{formatNumber(income)}/klick</span>
                  )}
                </div>
              </div>
              <button
                className={`btn-primary ${styles.buyBtn}`}
                onClick={() => buy(item.id)}
                disabled={!canAfford}
              >
                🪙{formatNumber(cost)}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
})
