// ── Core game state ──────────────────────────────────────────────────────────

export interface Wardrobe {
  hat: string
  acc: string
  aura: string
  bg: string
}

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
  lastLoginDate: string
  sessionTaps: number
  sessionXP: number
  // Progress stats
  streak: number
  battleWins: number
  fishCaught: number
  expeditionsDone: number
  bountiesDone: number
  postCount: number
  runnerBest: number
  questsCompleted: number
  totalCoinsEarned: number
  // Cosmetics
  activeTheme: string
  activeSkin: string
  activeFrame: string
  wardrobe: Wardrobe
  ownedItems: string[]
  // Prestige
  prestigeLevel: number
  // Battle pass
  bpassXP: number
}

export interface DailyMission {
  id: string
  emoji: string
  label: string
  type: 'taps' | 'battle' | 'feed' | 'fish' | 'quest' | 'runner' | 'memory'
  target: number
  progress: number
  reward: { coins: number; xp: number; kc?: number }
  done: boolean
}

export interface Notification {
  id: string
  icon: string
  text: string
  ts: number
  read: boolean
}

export interface InventoryItem {
  id: string
  name: string
  emoji: string
  description: string
  effect?: { mood?: number; hunger?: number; energy?: number; exp?: number }
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
  category: 'food' | 'toy' | 'cosmetic' | 'boost' | 'hat' | 'acc' | 'aura' | 'bg' | 'skin' | 'frame' | 'theme'
  stat?: { mood?: number; hunger?: number; energy?: number; xpMult?: number }
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
  emoji: string
  description: string
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  condition: (s: PetState) => boolean
  reward: { xp: number; kc: number }
  unlockedAt?: number
}

export interface Expedition {
  id: string
  name: string
  emoji: string
  description: string
  duration: number    // minutes
  difficulty: 'easy' | 'normal' | 'hard'
  reward: { xp: number; coins: number; kc?: number }
  unlockLevel: number
}

export interface FlashPost {
  id: string
  username: string
  petEmoji: string
  petLevel: number
  caption: string
  likes: number
  xpReward: number
  tag: string
  liked: boolean
}

export interface FishType {
  id: string
  name: string
  emoji: string
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  weight: [number, number] // kg min/max
  coins: number
  xp: number
  chance: number // 0-1
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
