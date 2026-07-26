import { useGameStore } from '@/stores/gameStore'
import { useUIStore } from '@/stores/uiStore'
import { audio } from '@/services/AudioService'

/** Convenience hook — returns the most commonly used game actions + state. */
export function useGame() {
  const pet = useGameStore(s => s.pet)
  const levelUpPending = useGameStore(s => s.levelUpPending)
  const { gainXP, gainCoins, gainKC, spendCoins, spendKC, tap, clearLevelUp } = useGameStore()

  const { showToast, spawnFloat, triggerConfetti } = useUIStore()

  function tapPet(x: number, y: number) {
    const result = tap()
    audio.tap()
    spawnFloat(`+${result.xp} XP`, x, y - 40)
    if (result.coins > 0) {
      spawnFloat(`+1 🪙`, x + 20, y - 60, '#fbbf24')
      audio.coin()
    }
    if (result.lvlUp) {
      showToast('🎉 LEVEL UP!', 'success')
      audio.levelUp()
      triggerConfetti()
    }
  }

  function awardXP(amount: number, source = '') {
    const lvlUp = gainXP(amount, source)
    if (lvlUp) {
      showToast('🎉 LEVEL UP!', 'success')
      audio.levelUp()
      triggerConfetti()
    }
    return lvlUp
  }

  function awardCoins(amount: number) {
    gainCoins(amount)
    showToast(`+${amount} 🪙`, 'coin')
    audio.coin()
  }

  return {
    pet,
    levelUpPending,
    clearLevelUp,
    tapPet,
    awardXP,
    awardCoins,
    gainKC,
    spendCoins,
    spendKC,
    showToast,
    spawnFloat,
  }
}
