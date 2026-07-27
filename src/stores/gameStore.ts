import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { PetState, InventoryItem, DailyMission } from '@/types/game'
import {
  SAVE_KEY, MISSIONS_KEY, xpForLevel,
  TAP_XP_BASE, TAP_COIN_CHANCE, TAP_MOOD_BOOST, TAP_HUNGER_COST, TAP_ENERGY_COST,
  STAT_MIN, STAT_MAX, DECAY_RATES, MISSION_POOL, ALL_ACHIEVEMENTS,
} from '@/constants/config'
import { storageGet, storageSet } from '@/utils/storage'
import { clamp, todayKey } from '@/utils/format'

const DEFAULT_PET: PetState = {
  petName: 'Karma',
  petEmoji: '🐉',
  mood: 80, hunger: 70, energy: 90,
  level: 1, exp: 0, expNext: xpForLevel(2),
  coins: 100, kc: 0,
  totalTaps: 0,
  createdAt: Date.now(), lastSeen: Date.now(), lastLoginDate: '',
  sessionTaps: 0, sessionXP: 0,
  streak: 0, battleWins: 0, fishCaught: 0,
  expeditionsDone: 0, bountiesDone: 0, postCount: 0,
  runnerBest: 0, questsCompleted: 0, totalCoinsEarned: 100,
  activeTheme: 'default', activeSkin: 'default', activeFrame: 'none',
  wardrobe: { hat: 'none', acc: 'none', aura: 'none', bg: 'default' },
  ownedItems: [], prestigeLevel: 0, bpassXP: 0,
  bondPoints: 0, bondTier: 0,
  activityLog: {},
  petTheme: 'dark',
}

function loadOrMigrate(): PetState {
  const saved = storageGet<Partial<PetState>>(SAVE_KEY, {})
  if (Object.keys(saved).length > 0) return { ...DEFAULT_PET, ...saved }
  const legacy = storageGet<Record<string, unknown>>('k0509_save', {})
  if (legacy && 'level' in legacy) {
    return {
      ...DEFAULT_PET,
      petName: (legacy.petName as string) ?? DEFAULT_PET.petName,
      petEmoji: (legacy.petEmoji as string) ?? DEFAULT_PET.petEmoji,
      mood: Number(legacy.mood ?? DEFAULT_PET.mood),
      hunger: Number(legacy.hunger ?? DEFAULT_PET.hunger),
      energy: Number(legacy.energy ?? DEFAULT_PET.energy),
      level: Number(legacy.level ?? DEFAULT_PET.level),
      exp: Number(legacy.exp ?? DEFAULT_PET.exp),
      expNext: Number(legacy.expNext ?? xpForLevel(Number(legacy.level ?? 1) + 1)),
      coins: Number(legacy.coins ?? DEFAULT_PET.coins),
      kc: Number(legacy.kc ?? DEFAULT_PET.kc),
      totalTaps: Number(legacy.totalTaps ?? DEFAULT_PET.totalTaps),
      createdAt: Number(legacy.createdAt ?? DEFAULT_PET.createdAt),
      lastSeen: Date.now(),
    }
  }
  return DEFAULT_PET
}

function loadMissions(): DailyMission[] {
  const today = todayKey()
  const saved = storageGet<{ date: string; missions: DailyMission[] }>(MISSIONS_KEY, { date: '', missions: [] })
  if (saved.date === today && saved.missions.length === 3) return saved.missions
  const shuffled = [...MISSION_POOL].sort(() => Math.random() - 0.5).slice(0, 3)
  const missions: DailyMission[] = shuffled.map(m => ({ ...m, progress: 0, done: false }))
  storageSet(MISSIONS_KEY, { date: today, missions })
  return missions
}

function saveMissions(missions: DailyMission[]) {
  storageSet(MISSIONS_KEY, { date: todayKey(), missions })
}

interface GameStore {
  pet: PetState
  inventory: InventoryItem[]
  levelUpPending: boolean
  levelUpInfo: { level: number; coins: number; kc: number } | null
  dailyMissions: DailyMission[]
  unlockedAchievements: string[]
  newAchievement: string | null

  tap: () => { xp: number; coins: number; lvlUp: boolean }
  gainXP: (amount: number, source?: string) => boolean
  gainCoins: (amount: number) => void
  gainKC: (amount: number) => void
  spendCoins: (amount: number) => boolean
  spendKC: (amount: number) => boolean
  setStat: (stat: 'mood' | 'hunger' | 'energy', value: number) => void
  setStats: (stats: Partial<Pick<PetState, 'mood' | 'hunger' | 'energy'>>) => void
  careAction: (type: 'feed' | 'train' | 'sleep' | 'play') => void
  buyShopItem: (itemId: string, cost: number, currency: 'coins' | 'kc', stat?: { mood?: number; hunger?: number; energy?: number }) => boolean
  equipItem: (slot: 'hat' | 'acc' | 'aura' | 'bg', itemId: string) => void
  recordBattleWin: () => void
  recordFishCaught: () => void
  recordRunnerScore: (score: number) => void
  recordMissionProgress: (type: DailyMission['type'], amount?: number) => void
  claimMission: (id: string) => void
  checkAchievements: () => string[]
  clearNewAchievement: () => void
  checkStreak: () => void
  addInventoryItem: (item: InventoryItem) => void
  useInventoryItem: (itemId: string) => boolean
  setPetName: (name: string) => void
  setPetEmoji: (emoji: string) => void
  tick: () => void
  clearLevelUp: () => void
  clearLevelUpInfo: () => void
  gainBond: (amount: number) => void
  setPetTheme: (theme: string) => void
  logActivity: () => void
  prestige: () => boolean
  save: () => void
  reset: () => void
}

export const useGameStore = create<GameStore>()(
  subscribeWithSelector((set, get) => ({
    pet: loadOrMigrate(),
    inventory: storageGet('k0509_inventory', []),
    levelUpPending: false,
    levelUpInfo: null,
    dailyMissions: loadMissions(),
    unlockedAchievements: storageGet<string[]>('k0509_achievements', []),
    newAchievement: null,

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
          totalCoinsEarned: s.pet.totalCoinsEarned + coinGain,
        },
      }))
      get().recordMissionProgress('taps')
      get().gainBond(1)
      get().logActivity()
      get().checkAchievements()
      get().save()
      return { xp, coins: coinGain, lvlUp }
    },

    gainXP(amount, _source) {
      let lvlUp = false
      set(s => {
        let { level, exp, expNext, sessionXP, bpassXP, coins, kc, totalCoinsEarned } = s.pet
        exp += amount
        sessionXP += amount
        bpassXP += Math.floor(amount * 0.1)
        let bonusCoins = 0, bonusKC = 0
        while (exp >= expNext) {
          exp -= expNext
          level += 1
          expNext = xpForLevel(level + 1)
          lvlUp = true
          bonusCoins += level * 10 + 20
          bonusKC += 1
        }
        if (bonusCoins > 0) { coins += bonusCoins; totalCoinsEarned += bonusCoins }
        if (bonusKC > 0) kc += bonusKC
        return {
          pet: { ...s.pet, level, exp, expNext, sessionXP, bpassXP, coins, kc, totalCoinsEarned },
          levelUpPending: lvlUp || s.levelUpPending,
          ...(lvlUp ? { levelUpInfo: { level, coins: bonusCoins, kc: bonusKC } } : {}),
        }
      })
      get().save()
      return lvlUp
    },

    gainCoins(amount) {
      set(s => ({ pet: { ...s.pet, coins: s.pet.coins + amount, totalCoinsEarned: s.pet.totalCoinsEarned + amount } }))
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

    setStats(stats) {
      set(s => ({
        pet: {
          ...s.pet,
          mood: stats.mood !== undefined ? clamp(s.pet.mood + stats.mood, STAT_MIN, STAT_MAX) : s.pet.mood,
          hunger: stats.hunger !== undefined ? clamp(s.pet.hunger + stats.hunger, STAT_MIN, STAT_MAX) : s.pet.hunger,
          energy: stats.energy !== undefined ? clamp(s.pet.energy + stats.energy, STAT_MIN, STAT_MAX) : s.pet.energy,
        },
      }))
      get().save()
    },

    careAction(type) {
      const cost = { feed: 10, train: 5, sleep: 0, play: 8 }[type]
      if (cost > 0 && !get().spendCoins(cost)) return
      const effects = {
        feed: { hunger: 30, energy: 0, mood: 0, xp: 10, coins: 0 },
        train: { hunger: 0, energy: -15, mood: 0, xp: 25, coins: 5 },
        sleep: { hunger: 0, energy: 40, mood: 10, xp: 5, coins: 0 },
        play: { hunger: 0, energy: -10, mood: 25, xp: 15, coins: 0 },
      }[type]
      set(s => ({
        pet: {
          ...s.pet,
          hunger: clamp(s.pet.hunger + effects.hunger, STAT_MIN, STAT_MAX),
          energy: clamp(s.pet.energy + effects.energy, STAT_MIN, STAT_MAX),
          mood: clamp(s.pet.mood + effects.mood, STAT_MIN, STAT_MAX),
          coins: s.pet.coins + effects.coins,
          totalCoinsEarned: s.pet.totalCoinsEarned + effects.coins,
        },
      }))
      get().gainXP(effects.xp, type)
      if (type === 'feed') get().recordMissionProgress('feed')
      get().save()
    },

    buyShopItem(itemId, cost, currency, stat) {
      const ok = currency === 'coins' ? get().spendCoins(cost) : get().spendKC(cost)
      if (!ok) return false
      set(s => ({ pet: { ...s.pet, ownedItems: [...new Set([...s.pet.ownedItems, itemId])] } }))
      if (stat) {
        set(s => ({
          pet: {
            ...s.pet,
            mood: stat.mood !== undefined ? (stat.mood >= 100 ? 100 : clamp(s.pet.mood + stat.mood, STAT_MIN, STAT_MAX)) : s.pet.mood,
            hunger: stat.hunger !== undefined ? (stat.hunger >= 100 ? 100 : clamp(s.pet.hunger + stat.hunger, STAT_MIN, STAT_MAX)) : s.pet.hunger,
            energy: stat.energy !== undefined ? (stat.energy >= 100 ? 100 : clamp(s.pet.energy + stat.energy, STAT_MIN, STAT_MAX)) : s.pet.energy,
          },
        }))
      }
      if (itemId === 'kc_xp') get().gainXP(1000, 'shop')
      if (itemId === 'xp500') get().gainXP(500, 'shop')
      get().save()
      return true
    },

    equipItem(slot, itemId) {
      set(s => ({ pet: { ...s.pet, wardrobe: { ...s.pet.wardrobe, [slot]: itemId } } }))
      get().save()
    },

    recordBattleWin() {
      set(s => ({ pet: { ...s.pet, battleWins: s.pet.battleWins + 1 } }))
      get().recordMissionProgress('battle')
      get().checkAchievements()
      get().save()
    },

    recordFishCaught() {
      set(s => ({ pet: { ...s.pet, fishCaught: s.pet.fishCaught + 1 } }))
      get().recordMissionProgress('fish')
      get().checkAchievements()
      get().save()
    },

    recordRunnerScore(score) {
      set(s => ({ pet: { ...s.pet, runnerBest: Math.max(s.pet.runnerBest, score) } }))
      get().recordMissionProgress('runner', score)
      get().checkAchievements()
      get().save()
    },

    recordMissionProgress(type, amount = 1) {
      set(s => {
        const updated = s.dailyMissions.map(m => {
          if (m.done || m.type !== type) return m
          return { ...m, progress: Math.min(m.target, m.progress + amount) }
        })
        saveMissions(updated)
        return { dailyMissions: updated }
      })
    },

    claimMission(id) {
      const m = get().dailyMissions.find(m => m.id === id)
      if (!m || m.done || m.progress < m.target) return
      get().gainCoins(m.reward.coins)
      get().gainXP(m.reward.xp, 'mission')
      if (m.reward.kc) get().gainKC(m.reward.kc)
      set(s => {
        const updated = s.dailyMissions.map(x => x.id === id ? { ...x, done: true } : x)
        saveMissions(updated)
        return { dailyMissions: updated, pet: { ...s.pet, questsCompleted: s.pet.questsCompleted + 1 } }
      })
    },

    checkAchievements() {
      const { pet, unlockedAchievements } = get()
      const newOnes = ALL_ACHIEVEMENTS.filter(a => !unlockedAchievements.includes(a.id) && a.condition(pet))
      if (!newOnes.length) return []
      const updated = [...unlockedAchievements, ...newOnes.map(a => a.id)]
      storageSet('k0509_achievements', updated)
      set({ unlockedAchievements: updated, newAchievement: newOnes[0].id })
      const first = newOnes[0]
      get().gainXP(first.reward.xp, 'achievement')
      if (first.reward.kc > 0) get().gainKC(first.reward.kc)
      return newOnes.map(a => a.id)
    },

    clearNewAchievement() { set({ newAchievement: null }) },

    checkStreak() {
      const today = todayKey()
      const pet = get().pet
      if (pet.lastLoginDate === today) return
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yKey = yesterday.toISOString().slice(0, 10)
      const newStreak = pet.lastLoginDate === yKey ? pet.streak + 1 : 1
      set(s => ({ pet: { ...s.pet, streak: newStreak, lastLoginDate: today } }))
      get().save()
    },

    addInventoryItem(item) {
      set(s => {
        const existing = s.inventory.find(i => i.id === item.id)
        if (existing) return { inventory: s.inventory.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i) }
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
          const e = item.effect!
          if (e.mood !== undefined) pet.mood = clamp(pet.mood + e.mood, STAT_MIN, STAT_MAX)
          if (e.hunger !== undefined) pet.hunger = clamp(pet.hunger + e.hunger, STAT_MIN, STAT_MAX)
          if (e.energy !== undefined) pet.energy = clamp(pet.energy + e.energy, STAT_MIN, STAT_MAX)
          if (e.exp !== undefined) pet.exp += e.exp
          return { pet }
        })
      }
      set(s => ({ inventory: s.inventory.map(i => i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i).filter(i => i.quantity > 0) }))
      storageSet('k0509_inventory', get().inventory)
      get().save()
      return true
    },

    setPetName(name) { set(s => ({ pet: { ...s.pet, petName: name } })); get().save() },
    setPetEmoji(emoji) { set(s => ({ pet: { ...s.pet, petEmoji: emoji } })); get().save() },

    tick() {
      const now = Date.now()
      set(s => {
        const elapsed = (now - s.pet.lastSeen) / 60000
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

    clearLevelUp() { set({ levelUpPending: false }) },
    clearLevelUpInfo() { set({ levelUpInfo: null }) },

    gainBond(amount) {
      const THRESHOLDS = [0, 50, 150, 350, 700, 1500]
      set(s => {
        const pts = s.pet.bondPoints + amount
        let tier = s.pet.bondTier
        while (tier < 5 && pts >= THRESHOLDS[tier + 1]) tier++
        return { pet: { ...s.pet, bondPoints: pts, bondTier: tier } }
      })
    },

    setPetTheme(theme) {
      set(s => ({ pet: { ...s.pet, petTheme: theme } }))
      get().save()
    },

    logActivity() {
      const today = todayKey()
      set(s => {
        const log = { ...s.pet.activityLog }
        log[today] = (log[today] ?? 0) + 1
        const keys = Object.keys(log).sort()
        if (keys.length > 30) delete log[keys[0]]
        return { pet: { ...s.pet, activityLog: log } }
      })
    },

    prestige() {
      const { pet } = get()
      if (pet.level < 10) return false
      set(s => ({
        pet: {
          ...s.pet,
          level: 1,
          exp: 0,
          expNext: xpForLevel(2),
          prestigeLevel: s.pet.prestigeLevel + 1,
          kc: s.pet.kc + 50,
        },
      }))
      get().save()
      return true
    },

    save() { storageSet(SAVE_KEY, { ...get().pet, lastSeen: Date.now() }) },
    reset() { set({ pet: DEFAULT_PET, inventory: [], levelUpPending: false, dailyMissions: loadMissions() }); get().save() },
  }))
)
