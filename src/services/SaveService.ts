import { useGameStore } from '@/stores/gameStore'

let saveTimer: ReturnType<typeof setInterval> | null = null

/** Start auto-save every 30 seconds. */
export function startAutoSave() {
  if (saveTimer) return
  saveTimer = setInterval(() => {
    useGameStore.getState().save()
  }, 30_000)
}

export function stopAutoSave() {
  if (saveTimer) {
    clearInterval(saveTimer)
    saveTimer = null
  }
}

/** Start passive stat decay tick every 60 seconds. */
let decayTimer: ReturnType<typeof setInterval> | null = null

export function startDecayTick() {
  if (decayTimer) return
  decayTimer = setInterval(() => {
    useGameStore.getState().tick()
  }, 60_000)
  // Run once on load to catch up from last session
  useGameStore.getState().tick()
}

export function stopDecayTick() {
  if (decayTimer) {
    clearInterval(decayTimer)
    decayTimer = null
  }
}
