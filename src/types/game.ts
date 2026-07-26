// ── Core game state ──────────────────────────────────────────────────────────

export interface PetState {
  petName: string
  petEmoji: string
  mood: number        // 0-100
  hunger: number      // 0-100
  energy: number      // 0-100
  level: number
  exp: number
  expNext: number
  coins: number
  kc: number          // karma coins
  totalTaps: number
  createdAt: number   // unix timestamp
  lastSeen: number
  sessionTaps: number
  sessionXP: number
}

export interface InventoryItem {
  id: string
  name: string
  emoji: string
  description: string
  effect?: Partial<PetState>
  quantity: number
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

export interface ShopItem {
  id: string
  name: string
  emoji: string
  description: string
  price: number
  currency: 'coins' | 'kc'
  category: 'food' | 'toy' | 'cosmetic' | 'boost' | 'special'
  effect?: Partial<PetState>
  unlockLevel?: number
}

export interface Quest {
  id: string
  title: string
  description: string
  emoji: string
  type: 'taps' | 'xp' | 'coins' | 'games' | 'expedition' | 'daily'
  target: number
  progress: number
  reward: { xp: number; coins: number; kc?: number }
  completed: boolean
  claimedAt?: number
  resetType: 'daily' | 'weekly' | 'once'
}

export interface Achievement {
  id: string
  title: string
  description: string
  emoji: string
  category: 'taps' | 'level' | 'coins' | 'games' | 'social' | 'special'
  condition: (state: PetState) => boolean
  reward: { xp: number; kc: number }
  unlockedAt?: number
}

export interface Expedition {
  id: string
  name: string
  emoji: string
  description: string
  duration: number    // ms
  difficulty: 'easy' | 'normal' | 'hard'
  reward: { xp: number; coins: number; kc?: number; items?: string[] }
  unlockLevel: number
  startedAt?: number
  completedAt?: number
}

export interface GameRecord {
  id: string
  name: string
  emoji: string
  value: number
  unit: string
  recordAt?: number
}

export type TabId = 'pet' | 'flash' | 'create' | 'games' | 'profile'

export interface ToastMessage {
  id: string
  text: string
  type: 'success' | 'error' | 'info' | 'xp' | 'coin'
  createdAt: number
}

export interface FloatTextItem {
  id: string
  text: string
  x: number
  y: number
  color?: string
}

export interface FeatureRegistration {
  id: string
  emoji: string
  label: string
  description?: string
  action: () => void
  badge?: number
}
