// ── Persist keys (same as legacy — preserves user progress) ─────────────────
export const SAVE_KEY = 'k0509_petState'
export const SETTINGS_KEY = 'k0509_settings'

// ── XP table — level N requires XP[N] total ──────────────────────────────────
export function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.5))
}

// ── Pet decay rates (per minute of inactivity) ────────────────────────────────
export const DECAY_RATES = {
  mood: -0.5,
  hunger: -0.8,
  energy: -0.3,
} as const

// ── Stat boundaries ───────────────────────────────────────────────────────────
export const STAT_MIN = 0
export const STAT_MAX = 100

// ── Tap rewards ───────────────────────────────────────────────────────────────
export const TAP_XP_BASE = 5
export const TAP_COIN_CHANCE = 0.15   // 15% chance of +1 coin per tap
export const TAP_MOOD_BOOST = 2
export const TAP_HUNGER_COST = 0.5
export const TAP_ENERGY_COST = 0.3

// ── Feature hub ───────────────────────────────────────────────────────────────
export const FAB_FEATURES_PER_PAGE = 8

// ── Audio ─────────────────────────────────────────────────────────────────────
export const AUDIO_ENABLED_DEFAULT = true
export const MUSIC_VOLUME_DEFAULT = 0.4
export const SFX_VOLUME_DEFAULT = 0.7

// ── Shop categories ───────────────────────────────────────────────────────────
export const SHOP_CATEGORIES = ['food', 'toy', 'cosmetic', 'boost', 'special'] as const

// ── Game IDs ──────────────────────────────────────────────────────────────────
export const GAME_IDS = {
  SNAKE: 'snake',
  PUZZLE_2048: '2048',
  MEMORY: 'memory',
  SPEED_TAP: 'speedtap',
  COLOR_MATCH: 'colormatch',
  HIGHER_LOWER: 'higherlower',
  BUBBLE_POP: 'bubblepop',
  TRIVIA: 'trivia',
} as const
