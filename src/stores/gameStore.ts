import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { PetState, InventoryItem } from '@/types/game'
import { SAVE_KEY, xpForLevel, TAP_XP_BASE, TAP_COIN_CHANCE, TAP_MOOD_BOOST, TAP_HUNGER_COST, TAP_ENERGY_COST, STAT_MIN, STAT_MAX, DECAY_RATES } from '@/constants/config'
import { storageGet, storageSet } from '@/utils/storage'
import { clamp } from '@/utils/format'

// ── Default pet state ─────────────────────────────────────────────────────────
const DEFAULT_STATE: PetState = {
  petName: 'Karma',
  petEmoji: '🐉',
  mood: 80,
  hunger: 70,
  energy: 90,
  level: 1,
  exp: 0,
  expNext: xpForLevel(2),
  coins: 100,
  kc: 0,
  totalTaps: 0,
  createdAt: Date.now(),
  lastSeen: Date.now(),
  sessionTaps: 0,
  sessionXP: 0,
}

// ── Migrate legacy G-object from old app (k0509_save or similar keys) ────────
function loadOrMigrate(): PetState {
  // Try new key first
  const saved = storageGet<Partial<PetState>>(SAVE_KEY, {})
  if (Object.keys(saved).length > 0) {
    return { ...DEFAULT_STATE, ...saved }
  }

  // Try legacy key from old single-file app
  const legacy = storageGet<Record<string, unknown>>('k0509_save', {})
  if (legacy && typeof legacy === 'object' && 'level' in legacy) {
    return {
      ...DEFAULT_STATE,
      petName: (legacy.petName as string) ?? DEFAULT_STATE.petName,
      petEmoji: (legacy.petEmoji as string) ?? DEFAULT_STATE.petEmoji,
      mood: Number(legacy.mood ?? DEFAULT_STATE.mood),
      hunger: Number(legacy.hunger ?? DEFAULT_STATE.hunger),
      energy: Number(legacy.energy ?? DEFAULT_STATE.energy),
      level: Number(legacy.level ?? DEFAULT_STATE.level),
      exp: Number(legacy.exp ?? DEFAULT_STATE.exp),
      expNext: Number(legacy.expNext ?? xpForLevel(Number(legacy.level ?? 1) + 1)),
      coins: Number(legacy.coins ?? DEFAULT_STATE.coins),
      kc: Number(legacy.kc ?? DEFAULT_STATE.kc),
      totalTaps: Number(legacy.totalTaps ?? DEFAULT_STATE.totalTaps),
      createdAt: Number(legacy.createdAt ?? DEFAULT_STATE.createdAt),
      lastSeen: Date.now(),
      sessionTaps: 0,
      sessionXP: 0,
    }
  }

  return DEFAULT_STATE
}

// ── Store interface ───────────────────────────────────────────────────────────
interface GameStore {
  pet: PetState
  inventory: InventoryItem[]
  levelUpPending: boolean

  // Actions
  tap: () => { xp: number; coins: number; lvlUp: boolean }
  gainXP: (amount: number, source?: string) => boolean   // returns true if lvlUp
  gainCoins: (amount: number) => void
  gainKC: (amount: number) => void
  spendCoins: (amount: number) => boolean
  spendKC: (amount: number) => boolean
  setStat: (stat: 'mood' | 'hunger' | 'energy', value: number) => void
  addInventoryItem: (item: InventoryItem) => void
  useInventoryItem: (itemId: string) => boolean
  setPetName: (name: string) => void
  setPetEmoji: (emoji: string) => void
  tick: () => void       // decay tick, call every ~60s
  clearLevelUp: () => void
  save: () => void
  reset: () => void
}

// ── Store ─────────────────────────────────────────────────────────────────────
export const useGameStore = create<GameStore>()(
  subscribeWithSelector((set, get) => ({
    pet: loadOrMigrate(),
    inventory: storageGet('k0509_inventory', []),
    levelUpPending: false,

    tap() {
      const state = get()
      const xp = TAP_XP_BASE + Math.floor(state.pet.level * 0.5)
      const coinGain = Math.random() < TAP_COIN_CHANCE ? 1 : 0
      const lvlUp = state.gainXP(xp, 'tap')

      set(s => ({
        pet: {
          ...s.pet,
          mood: clamp(s.pet.mood + TAP_MOOD_BOOST, STAT_MIN, STAT_MAX),
          hunger: clamp(s.pet.hunger - TAP_HUNGER_COST, STAT_MIN, STAT_MAX),
          energy: clamp(s.pet.energy - TAP_ENERGY_COST, STAT_MIN, STAT_MAX),
          coins: s.pet.coins + coinGain,
          totalTaps: s.pet.totalTaps + 1,
          sessionTaps: s.pet.sessionTaps + 1,
        },
      }))

      get().save()
      return { xp, coins: coinGain, lvlUp }
    },

    gainXP(amount, _source) {
      let lvlUp = false
      set(s => {
        let { level, exp, expNext, sessionXP } = s.pet
        exp += amount
        sessionXP += amount

        while (exp >= expNext) {
          exp -= expNext
          level += 1
          expNext = xpForLevel(level + 1)
          lvlUp = true
        }

        return {
          pet: { ...s.pet, level, exp, expNext, sessionXP },
          levelUpPending: lvlUp || s.levelUpPending,
        }
      })
      get().save()
      return lvlUp
    },

    gainCoins(amount) {
      set(s => ({ pet: { ...s.pet, coins: s.pet.coins + amount } }))
      get().save()
    },

    gainKC(amount) {
      set(s => ({ pet: { ...s.pet, kc: s.pet.kc + amount } }))
      get().save()
    },

    spendCoins(amount) {
      if (get().pet.coins < amount) return false
      set(s => ({ pet: { ...s.pet, coins: s.pet.coins - amount } }))
      get().save()
      return true
    },

    spendKC(amount) {
      if (get().pet.kc < amount) return false
      set(s => ({ pet: { ...s.pet, kc: s.pet.kc - amount } }))
      get().save()
      return true
    },

    setStat(stat, value) {
      set(s => ({ pet: { ...s.pet, [stat]: clamp(value, STAT_MIN, STAT_MAX) } }))
    },

    addInventoryItem(item) {
      set(s => {
        const existing = s.inventory.find(i => i.id === item.id)
        if (existing) {
          return { inventory: s.inventory.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i) }
        }
        return { inventory: [...s.inventory, { ...item, quantity: 1 }] }
      })
      storageSet('k0509_inventory', get().inventory)
    },

    useInventoryItem(itemId) {
      const item = get().inventory.find(i => i.id === itemId)
      if (!item || item.quantity <= 0) return false

      if (item.effect) {
        set(s => {
          const pet = { ...s.pet }
          const effect = item.effect!
          if (effect.mood !== undefined) pet.mood = clamp(pet.mood + effect.mood, STAT_MIN, STAT_MAX)
          if (effect.hunger !== undefined) pet.hunger = clamp(pet.hunger + effect.hunger, STAT_MIN, STAT_MAX)
          if (effect.energy !== undefined) pet.energy = clamp(pet.energy + effect.energy, STAT_MIN, STAT_MAX)
          if (effect.exp !== undefined) pet.exp += effect.exp
          return { pet }
        })
      }

      set(s => ({
        inventory: s.inventory.map(i =>
          i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i
        ).filter(i => i.quantity > 0),
      }))
      storageSet('k0509_inventory', get().inventory)
      get().save()
      return true
    },

    setPetName(name) {
      set(s => ({ pet: { ...s.pet, petName: name } }))
      get().save()
    },

    setPetEmoji(emoji) {
      set(s => ({ pet: { ...s.pet, petEmoji: emoji } }))
      get().save()
    },

    tick() {
      const now = Date.now()
      set(s => {
        const elapsed = (now - s.pet.lastSeen) / 60000  // minutes
        if (elapsed < 0.1) return {}
        return {
          pet: {
            ...s.pet,
            mood: clamp(s.pet.mood + DECAY_RATES.mood * elapsed, STAT_MIN, STAT_MAX),
            hunger: clamp(s.pet.hunger + DECAY_RATES.hunger * elapsed, STAT_MIN, STAT_MAX),
            energy: clamp(s.pet.energy + DECAY_RATES.energy * elapsed, STAT_MIN, STAT_MAX),
            lastSeen: now,
          },
        }
      })
    },

    clearLevelUp() {
      set({ levelUpPending: false })
    },

    save() {
      const { pet } = get()
      storageSet(SAVE_KEY, { ...pet, lastSeen: Date.now() })
    },

    reset() {
      set({ pet: DEFAULT_STATE, inventory: [], levelUpPending: false })
      get().save()
    },
  }))
)
