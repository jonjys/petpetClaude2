import { memo, useState } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { useUIStore } from '@/stores/uiStore'
import { formatNumber } from '@/utils/format'
import { audio } from '@/services/AudioService'
import styles from './CreateView.module.css'

interface Craft {
  id: string
  emoji: string
  name: string
  desc: string
  costCoins: number
  costKC: number
  reward: string
  action: () => void
}

export const CreateView = memo(function CreateView() {
  const pet = useGameStore(s => s.pet)
  const spendCoins = useGameStore(s => s.spendCoins)
  const spendKC = useGameStore(s => s.spendKC)
  const gainXP = useGameStore(s => s.gainXP)
  const gainKC = useGameStore(s => s.gainKC)
  const showToast = useUIStore(s => s.showToast)
  const triggerConfetti = useUIStore(s => s.triggerConfetti)

  const [cooldowns, setCooldowns] = useState<Record<string, number>>({})

  const now = Date.now()

  const setCooldown = (id: string, ms: number) => {
    setCooldowns(prev => ({ ...prev, [id]: now + ms }))
  }

  const crafts: Craft[] = [
    {
      id: 'potion',
      emoji: '🧪',
      name: 'Kraft-potion',
      desc: 'Återställer all energi och humör',
      costCoins: 50,
      costKC: 0,
      reward: '+100 energi & humör',
      action: () => {
        if (!spendCoins(50)) { showToast('Inte tillräckligt med mynt!', 'error'); return }
        useGameStore.setState(s => ({
          pet: { ...s.pet, energy: 100, mood: 100 }
        }))
        showToast('⚡ Kraft-potion använd!', 'success')
        audio.achievement()
        setCooldown('potion', 10000)
      }
    },
    {
      id: 'feast',
      emoji: '🍖',
      name: 'Stor fest',
      desc: 'Matar husdjuret till max',
      costCoins: 30,
      costKC: 0,
      reward: '+100 hunger',
      action: () => {
        if (!spendCoins(30)) { showToast('Inte tillräckligt med mynt!', 'error'); return }
        useGameStore.setState(s => ({
          pet: { ...s.pet, hunger: 100 }
        }))
        showToast('🍖 Husdjuret är mätt!', 'success')
        audio.coin()
        setCooldown('feast', 8000)
      }
    },
    {
      id: 'xpboost',
      emoji: '⭐',
      name: 'XP-boost',
      desc: 'Ger direkt 500 XP',
      costCoins: 200,
      costKC: 0,
      reward: '+500 XP',
      action: () => {
        if (!spendCoins(200)) { showToast('Inte tillräckligt med mynt!', 'error'); return }
        gainXP(500)
        showToast('⭐ +500 XP!', 'success')
        audio.levelUp()
        setCooldown('xpboost', 30000)
      }
    },
    {
      id: 'kccraft',
      emoji: '✨',
      name: 'KC-syntes',
      desc: 'Konvertera 500 mynt till 50 KC',
      costCoins: 500,
      costKC: 0,
      reward: '+50 KC',
      action: () => {
        if (!spendCoins(500)) { showToast('Inte tillräckligt med mynt!', 'error'); return }
        gainKC(50)
        showToast('✨ +50 KC syntetiserat!', 'success')
        audio.achievement()
        setCooldown('kccraft', 60000)
      }
    },
    {
      id: 'celebration',
      emoji: '🎉',
      name: 'Fest!',
      desc: 'Trigga konfetti & maxad humör',
      costCoins: 100,
      costKC: 5,
      reward: 'Konfetti + max humör',
      action: () => {
        if (!spendCoins(100) || !spendKC(5)) {
          showToast('Inte tillräckligt med resurser!', 'error'); return
        }
        useGameStore.setState(s => ({
          pet: { ...s.pet, mood: 100 }
        }))
        triggerConfetti()
        showToast('🎉 Fest!', 'success')
        audio.achievement()
        setCooldown('celebration', 120000)
      }
    },
    {
      id: 'superreset',
      emoji: '🔄',
      name: 'Full återhämtning',
      desc: 'Alla stats till 100',
      costCoins: 0,
      costKC: 20,
      reward: 'Alla stats 100%',
      action: () => {
        if (!spendKC(20)) { showToast('Inte tillräckligt med KC!', 'error'); return }
        useGameStore.setState(s => ({
          pet: { ...s.pet, mood: 100, hunger: 100, energy: 100 }
        }))
        showToast('🔄 Full återhämtning!', 'success')
        audio.levelUp()
        setCooldown('superreset', 300000)
      }
    },
  ]

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.balance}>
          <span>🪙 {formatNumber(pet.coins)}</span>
          <span>✨ {formatNumber(pet.kc)} KC</span>
        </div>
      </div>

      <div className={styles.grid}>
        {crafts.map(c => {
          const onCooldown = (cooldowns[c.id] ?? 0) > now
          const remainSec = onCooldown ? Math.ceil(((cooldowns[c.id] ?? 0) - now) / 1000) : 0
          const canAfford = pet.coins >= c.costCoins && pet.kc >= c.costKC

          return (
            <div key={c.id} className={`${styles.craftCard} ${!canAfford || onCooldown ? styles.disabled : ''}`}>
              <div className={styles.craftEmoji}>{c.emoji}</div>
              <div className={styles.craftName}>{c.name}</div>
              <div className={styles.craftDesc}>{c.desc}</div>
              <div className={styles.craftReward}>{c.reward}</div>
              <div className={styles.craftCost}>
                {c.costCoins > 0 && <span>🪙{formatNumber(c.costCoins)}</span>}
                {c.costKC > 0 && <span>✨{c.costKC} KC</span>}
              </div>
              <button
                className="btn-primary"
                style={{ width: '100%', marginTop: 4 }}
                disabled={!canAfford || onCooldown}
                onClick={() => { if (!onCooldown && canAfford) c.action() }}
              >
                {onCooldown ? `⏳ ${remainSec}s` : 'Använd'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
})
