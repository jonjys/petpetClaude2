import type { ShopItem, Achievement, Expedition, FishType } from '@/types/game'

// ── Persist keys ──────────────────────────────────────────────────────────────
export const SAVE_KEY = 'k0509_petState'
export const SETTINGS_KEY = 'k0509_settings'
export const MISSIONS_KEY = 'k0509_missions'
export const SPIN_KEY = 'k0509_lastSpin'
export const LUCKY_KEY = 'k0509_lastLucky'
export const DAILY_KEY = 'k0509_dailyBonus'
export const NOTIFS_KEY = 'k0509_notifs'

// ── XP table ──────────────────────────────────────────────────────────────────
export function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.5))
}

// ── Decay rates (per minute offline) ─────────────────────────────────────────
export const DECAY_RATES = { mood: -0.5, hunger: -0.8, energy: -0.3 } as const

// ── Boundaries ────────────────────────────────────────────────────────────────
export const STAT_MIN = 0
export const STAT_MAX = 100

// ── Tap rewards ───────────────────────────────────────────────────────────────
export const TAP_XP_BASE = 5
export const TAP_COIN_CHANCE = 0.15
export const TAP_MOOD_BOOST = 2
export const TAP_HUNGER_COST = 0.5
export const TAP_ENERGY_COST = 0.3

// ── Audio defaults ────────────────────────────────────────────────────────────
export const AUDIO_ENABLED_DEFAULT = true
export const MUSIC_VOLUME_DEFAULT = 0.4
export const SFX_VOLUME_DEFAULT = 0.7

// ── Shop items ────────────────────────────────────────────────────────────────
export const SHOP_FOOD: ShopItem[] = [
  { id: 'kibble', name: 'Super Kibble', emoji: '🍖', description: '+30 hunger', price: 50, currency: 'coins', category: 'food', stat: { hunger: 30 } },
  { id: 'treat', name: 'Galaxy Treat', emoji: '🍬', description: '+20 mood +10 hunger', price: 80, currency: 'coins', category: 'food', stat: { mood: 20, hunger: 10 } },
  { id: 'drink', name: 'Energy Drink+', emoji: '⚡', description: '+40 energi', price: 100, currency: 'coins', category: 'food', stat: { energy: 40 } },
  { id: 'candy', name: 'Mood Candy', emoji: '🍭', description: '+35 humör', price: 90, currency: 'coins', category: 'food', stat: { mood: 35 } },
  { id: 'feast', name: 'Kunglig Fest', emoji: '🍱', description: '+100 hunger +50 mood', price: 300, currency: 'coins', category: 'food', stat: { hunger: 100, mood: 50 } },
]

export const SHOP_BOOSTS: ShopItem[] = [
  { id: 'maxmood', name: 'Max Humör', emoji: '😊', description: 'Fullt humör', price: 80, currency: 'coins', category: 'boost', stat: { mood: 100 } },
  { id: 'maxenergy', name: 'Max Energi', emoji: '⚡', description: 'Full energi', price: 80, currency: 'coins', category: 'boost', stat: { energy: 100 } },
  { id: 'maxhunger', name: 'Max Mat', emoji: '🍖', description: 'Full mat', price: 80, currency: 'coins', category: 'boost', stat: { hunger: 100 } },
  { id: 'xp500', name: '+500 XP', emoji: '⭐', description: 'XP-boost direkt', price: 200, currency: 'coins', category: 'boost' },
]

export const SHOP_HATS: ShopItem[] = [
  { id: 'hat_party', name: 'Festmössa', emoji: '🎉', description: '+3% XP', price: 100, currency: 'coins', category: 'hat' },
  { id: 'hat_cowboy', name: 'Cowboyhatt', emoji: '🤠', description: 'Cowboy-stil', price: 150, currency: 'coins', category: 'hat' },
  { id: 'hat_crown', name: 'Krona', emoji: '👑', description: '+8% Coins', price: 250, currency: 'coins', category: 'hat' },
  { id: 'hat_witch', name: 'Häxhatt', emoji: '🧙', description: 'Magisk kraft', price: 300, currency: 'coins', category: 'hat' },
  { id: 'hat_grad', name: 'Studentmössa', emoji: '🎓', description: '+10% XP', price: 300, currency: 'coins', category: 'hat' },
]

export const SHOP_ACC: ShopItem[] = [
  { id: 'acc_sun', name: 'Solglasögon', emoji: '😎', description: 'Super cool', price: 80, currency: 'coins', category: 'acc' },
  { id: 'acc_bow', name: 'Rosett', emoji: '🎀', description: '+5% Social', price: 80, currency: 'coins', category: 'acc' },
  { id: 'acc_mask', name: 'Mask', emoji: '🎭', description: '+8% Battle', price: 150, currency: 'coins', category: 'acc' },
  { id: 'acc_ring', name: 'Ring', emoji: '💍', description: 'Lyxigt', price: 200, currency: 'coins', category: 'acc' },
  { id: 'acc_star', name: 'Stjärnbricka', emoji: '⭐', description: '+10% XP', price: 250, currency: 'coins', category: 'acc' },
]

export const SHOP_AURA: ShopItem[] = [
  { id: 'aura_fire', name: 'Eldaura', emoji: '🔥', description: 'Brinnande kraft', price: 120, currency: 'coins', category: 'aura' },
  { id: 'aura_glitter', name: 'Glitteraura', emoji: '✨', description: 'Glittrande lyckliga', price: 120, currency: 'coins', category: 'aura' },
  { id: 'aura_moon', name: 'Månljusaura', emoji: '🌙', description: 'Månsken kraft', price: 200, currency: 'coins', category: 'aura' },
  { id: 'aura_rainbow', name: 'Regnbågsaura', emoji: '🌈', description: '+10% All stats', price: 350, currency: 'coins', category: 'aura' },
  { id: 'aura_star', name: 'Stjärndamm', emoji: '🌟', description: '+8% XP', price: 250, currency: 'coins', category: 'aura' },
]

export const SHOP_SKINS: ShopItem[] = [
  { id: 'skin_fire', name: 'Inferno', emoji: '🔥', description: 'Eldlook', price: 500, currency: 'coins', category: 'skin' },
  { id: 'skin_ice', name: 'Frost', emoji: '❄️', description: 'Islook', price: 500, currency: 'coins', category: 'skin' },
  { id: 'skin_gold', name: 'Guld', emoji: '💛', description: 'Guldlook', price: 1500, currency: 'coins', category: 'skin' },
  { id: 'skin_galaxy', name: 'Galaxy', emoji: '🌌', description: 'Galaxlook', price: 3000, currency: 'coins', category: 'skin' },
  { id: 'skin_ghost', name: 'Ghost', emoji: '👻', description: 'Spöklook', price: 800, currency: 'coins', category: 'skin' },
  { id: 'skin_cyber', name: 'Cyber', emoji: '🤖', description: 'Robotlook', price: 2000, currency: 'coins', category: 'skin' },
]

export const SHOP_KC: ShopItem[] = [
  { id: 'kc_aura', name: 'Kosmisk Aura', emoji: '🌠', description: 'Exklusiv aura', price: 50, currency: 'kc', category: 'aura' },
  { id: 'kc_hat', name: 'Galax-krona', emoji: '🪐', description: 'Sällsynt hatt', price: 30, currency: 'kc', category: 'hat' },
  { id: 'kc_xp', name: 'Mega XP', emoji: '🚀', description: '+1000 XP direkt', price: 20, currency: 'kc', category: 'boost' },
  { id: 'kc_revive', name: 'Full Återhämtning', emoji: '💖', description: 'Alla stats till 100', price: 15, currency: 'kc', category: 'boost', stat: { mood: 100, hunger: 100, energy: 100 } },
]

// ── Achievements ──────────────────────────────────────────────────────────────
export const ALL_ACHIEVEMENTS: Achievement[] = [
  { id: 'lv5', title: 'LV 5 Nybörjare', emoji: '⭐', description: 'Nå nivå 5', rarity: 'common', condition: s => s.level >= 5, reward: { xp: 100, kc: 2 } },
  { id: 'lv10', title: 'LV 10 Legend', emoji: '🌟', description: 'Nå nivå 10', rarity: 'uncommon', condition: s => s.level >= 10, reward: { xp: 300, kc: 5 } },
  { id: 'lv15', title: 'LV 15 Elite', emoji: '💫', description: 'Nå nivå 15', rarity: 'rare', condition: s => s.level >= 15, reward: { xp: 600, kc: 10 } },
  { id: 'lv20', title: 'LV 20 GOAT', emoji: '🔱', description: 'Nå nivå 20', rarity: 'legendary', condition: s => s.level >= 20, reward: { xp: 2000, kc: 30 } },
  { id: 'taps100', title: 'Klapper', emoji: '👆', description: '100 pek', rarity: 'common', condition: s => s.totalTaps >= 100, reward: { xp: 50, kc: 1 } },
  { id: 'taps1000', title: 'Pekmaskin', emoji: '🤜', description: '1 000 pek', rarity: 'uncommon', condition: s => s.totalTaps >= 1000, reward: { xp: 200, kc: 3 } },
  { id: 'taps10000', title: 'Tap God', emoji: '⚡', description: '10 000 pek', rarity: 'epic', condition: s => s.totalTaps >= 10000, reward: { xp: 1000, kc: 15 } },
  { id: 'coins1000', title: 'Tusenaire', emoji: '💰', description: 'Tjäna 1 000 mynt', rarity: 'common', condition: s => s.totalCoinsEarned >= 1000, reward: { xp: 100, kc: 2 } },
  { id: 'coins5000', title: 'Rik', emoji: '💎', description: 'Tjäna 5 000 mynt', rarity: 'uncommon', condition: s => s.totalCoinsEarned >= 5000, reward: { xp: 300, kc: 5 } },
  { id: 'coins50000', title: 'Miljonär', emoji: '🤑', description: 'Tjäna 50 000 mynt', rarity: 'epic', condition: s => s.totalCoinsEarned >= 50000, reward: { xp: 2000, kc: 25 } },
  { id: 'streak7', title: '7 Dagars Streak', emoji: '🔥', description: '7 dagar i rad', rarity: 'uncommon', condition: s => s.streak >= 7, reward: { xp: 200, kc: 5 } },
  { id: 'streak30', title: '30 Dagars Streak', emoji: '🏅', description: '30 dagar i rad', rarity: 'epic', condition: s => s.streak >= 30, reward: { xp: 1000, kc: 20 } },
  { id: 'battle5', title: 'Battle Master', emoji: '⚔️', description: 'Vinn 5 strider', rarity: 'uncommon', condition: s => s.battleWins >= 5, reward: { xp: 150, kc: 3 } },
  { id: 'battle30', title: 'Champion', emoji: '🏆', description: 'Vinn 30 strider', rarity: 'epic', condition: s => s.battleWins >= 30, reward: { xp: 800, kc: 15 } },
  { id: 'fish1', title: 'Första Fisken', emoji: '🎣', description: 'Fånga en fisk', rarity: 'common', condition: s => s.fishCaught >= 1, reward: { xp: 30, kc: 1 } },
  { id: 'fish10', title: 'Fiskare', emoji: '🐟', description: 'Fånga 10 fiskar', rarity: 'uncommon', condition: s => s.fishCaught >= 10, reward: { xp: 200, kc: 4 } },
  { id: 'fish50', title: 'Hajjägare', emoji: '🦈', description: 'Fånga 50 fiskar', rarity: 'rare', condition: s => s.fishCaught >= 50, reward: { xp: 800, kc: 12 } },
  { id: 'runner100', title: 'Sprinter', emoji: '🏃', description: 'Spring 100m', rarity: 'uncommon', condition: s => s.runnerBest >= 100, reward: { xp: 200, kc: 3 } },
  { id: 'runner500', title: 'Speed Demon', emoji: '💨', description: 'Spring 500m', rarity: 'epic', condition: s => s.runnerBest >= 500, reward: { xp: 800, kc: 12 } },
  { id: 'quest10', title: 'Uppdragsjägare', emoji: '📋', description: 'Klara 10 uppdrag', rarity: 'uncommon', condition: s => s.questsCompleted >= 10, reward: { xp: 250, kc: 4 } },
  { id: 'kc50', title: 'KC Samlare', emoji: '✨', description: 'Samla 50 KC', rarity: 'uncommon', condition: s => s.kc >= 50, reward: { xp: 200, kc: 0 } },
  { id: 'kc200', title: 'KC Rik', emoji: '💫', description: 'Samla 200 KC', rarity: 'rare', condition: s => s.kc >= 200, reward: { xp: 600, kc: 0 } },
]

// ── Expeditions ───────────────────────────────────────────────────────────────
export const EXPEDITIONS: Expedition[] = [
  { id: 'forest', name: 'Djupa Skogen', emoji: '🌲', description: 'Sök äventyr i skogen', duration: 5, difficulty: 'easy', reward: { xp: 100, coins: 50, kc: 1 }, unlockLevel: 1 },
  { id: 'cave', name: 'Mörk Grotta', emoji: '🕯️', description: 'Utforska grottan', duration: 15, difficulty: 'easy', reward: { xp: 200, coins: 100, kc: 2 }, unlockLevel: 2 },
  { id: 'ocean', name: 'Djuphav', emoji: '🌊', description: 'Dyk ned i havet', duration: 30, difficulty: 'normal', reward: { xp: 400, coins: 200, kc: 5 }, unlockLevel: 5 },
  { id: 'volcano', name: 'Eldberget', emoji: '🌋', description: 'Bestäm Eldberget', duration: 60, difficulty: 'normal', reward: { xp: 700, coins: 350, kc: 8 }, unlockLevel: 8 },
  { id: 'astral', name: 'Astral Rift', emoji: '🌌', description: 'Resa i dimensioner', duration: 120, difficulty: 'hard', reward: { xp: 1500, coins: 800, kc: 20 }, unlockLevel: 12 },
]

// ── Fish types ────────────────────────────────────────────────────────────────
export const FISH_TYPES: FishType[] = [
  { id: 'bass', name: 'Gädda', emoji: '🐟', rarity: 'common', weight: [0.3, 2.5], coins: 10, xp: 15, chance: 0.35 },
  { id: 'carp', name: 'Karp', emoji: '🫧', rarity: 'common', weight: [0.5, 4.0], coins: 12, xp: 18, chance: 0.25 },
  { id: 'trout', name: 'Öring', emoji: '🍣', rarity: 'uncommon', weight: [0.8, 5.0], coins: 25, xp: 35, chance: 0.15 },
  { id: 'goldfish', name: 'Guldfisk', emoji: '🐠', rarity: 'uncommon', weight: [0.1, 0.5], coins: 30, xp: 45, chance: 0.10 },
  { id: 'moon', name: 'Månfisk', emoji: '🌙', rarity: 'rare', weight: [5.0, 20.0], coins: 80, xp: 100, chance: 0.07 },
  { id: 'crystal', name: 'Kristallfisk', emoji: '💎', rarity: 'rare', weight: [1.0, 8.0], coins: 100, xp: 120, chance: 0.04 },
  { id: 'dragon', name: 'Dragonfisk', emoji: '🐉', rarity: 'epic', weight: [10.0, 50.0], coins: 250, xp: 300, chance: 0.025 },
  { id: 'ghost', name: 'Spöklax', emoji: '👻', rarity: 'legendary', weight: [20.0, 100.0], coins: 1000, xp: 1500, chance: 0.005 },
]

// ── Mission pool (3 picked randomly each day) ─────────────────────────────────
export const MISSION_POOL = [
  { id: 'taps50', emoji: '👆', label: 'Tryck 50 gånger', type: 'taps' as const, target: 50, reward: { coins: 30, xp: 50 } },
  { id: 'battle3', emoji: '⚔️', label: 'Vinn 3 strider', type: 'battle' as const, target: 3, reward: { coins: 80, xp: 100, kc: 2 } },
  { id: 'feed3', emoji: '🍖', label: 'Mata 3 gånger', type: 'feed' as const, target: 3, reward: { coins: 40, xp: 60 } },
  { id: 'fish3', emoji: '🎣', label: 'Fånga 3 fiskar', type: 'fish' as const, target: 3, reward: { coins: 60, xp: 80 } },
  { id: 'runner200', emoji: '🏃', label: 'Spring 200m', type: 'runner' as const, target: 200, reward: { coins: 50, xp: 75 } },
  { id: 'memory1', emoji: '🃏', label: 'Klara memory', type: 'memory' as const, target: 1, reward: { coins: 40, xp: 60 } },
]

// ── Spin wheel ────────────────────────────────────────────────────────────────
export const SPIN_PRIZES = [
  { label: '50 Mynt', emoji: '🪙', coins: 50, xp: 0, kc: 0, weight: 25 },
  { label: '100 Mynt', emoji: '💰', coins: 100, xp: 0, kc: 0, weight: 20 },
  { label: '200 Mynt', emoji: '🤑', coins: 200, xp: 0, kc: 0, weight: 15 },
  { label: '100 XP', emoji: '⭐', coins: 0, xp: 100, kc: 0, weight: 20 },
  { label: '300 XP', emoji: '🌟', coins: 0, xp: 300, kc: 0, weight: 12 },
  { label: '5 KC', emoji: '✨', coins: 0, xp: 0, kc: 5, weight: 5 },
  { label: '10 KC', emoji: '💎', coins: 0, xp: 0, kc: 10, weight: 2 },
  { label: 'Max Humör!', emoji: '😊', coins: 0, xp: 0, kc: 0, weight: 1 },
]

// ── Battle NPCs ───────────────────────────────────────────────────────────────
export const BATTLE_NPCS = [
  { name: 'Katten Whiskers', emoji: '😺', hp: 80, atk: 8, def: 4, reward: { coins: 20, xp: 30 } },
  { name: 'Draken Zorb', emoji: '🐲', hp: 120, atk: 12, def: 6, reward: { coins: 40, xp: 60 } },
  { name: 'Björnen Grump', emoji: '🐻', hp: 200, atk: 18, def: 10, reward: { coins: 80, xp: 120 } },
  { name: 'Tigern Raze', emoji: '🐯', hp: 350, atk: 28, def: 15, reward: { coins: 150, xp: 200 } },
  { name: 'Kosmisk Boss', emoji: '👾', hp: 600, atk: 45, def: 25, reward: { coins: 400, xp: 500, kc: 10 } },
]

// ── Flash feed sample posts ───────────────────────────────────────────────────
export const FLASH_SAMPLE_POSTS = [
  { id: 'f1', username: 'LunaDrake', petEmoji: '🐉', petLevel: 8, caption: 'Min drake nådde nivå 8!! 🔥🔥🔥', likes: 142, xpReward: 15, tag: '#levelup', liked: false },
  { id: 'f2', username: 'StarPaws', petEmoji: '🐱', petLevel: 5, caption: 'Dagens dagliga bonus var EPISK ✨', likes: 87, xpReward: 10, tag: '#daily', liked: false },
  { id: 'f3', username: 'ZenMaster', petEmoji: '🐼', petLevel: 12, caption: 'Klarat 30-dagarsstreaken 🏅 Aldrig missat en dag!', likes: 356, xpReward: 20, tag: '#streak', liked: false },
  { id: 'f4', username: 'VoidHunter', petEmoji: '🐺', petLevel: 15, caption: 'Boss beaten! Kosmisk boss är ned 💪', likes: 221, xpReward: 25, tag: '#battle', liked: false },
  { id: 'f5', username: 'AquaFisher', petEmoji: '🐸', petLevel: 7, caption: 'Fångade Spöklax!! Legendärt! 👻', likes: 512, xpReward: 30, tag: '#fishing', liked: false },
  { id: 'f6', username: 'NeonRacer', petEmoji: '🦊', petLevel: 10, caption: 'Runner highscore: 847m 🏃‍♂️💨', likes: 178, xpReward: 15, tag: '#runner', liked: false },
  { id: 'f7', username: 'MysticKat', petEmoji: '🐯', petLevel: 20, caption: 'Level 20 GOAT achievement unlocked 🔱 Det tog månader!', likes: 899, xpReward: 50, tag: '#achievement', liked: false },
  { id: 'f8', username: 'CosmicPup', petEmoji: '🐶', petLevel: 3, caption: 'Ny i spelet men älskar det! 🐾', likes: 64, xpReward: 8, tag: '#newplayer', liked: false },
]

// ── Feature Hub entries ───────────────────────────────────────────────────────
export const FEATURE_HUB_ITEMS = [
  { id: 'spin', emoji: '🎡', label: 'Daglig Spin', desc: 'Snurra hjulet dagligen' },
  { id: 'lucky', emoji: '📦', label: 'Lucky Box', desc: 'Öppna en belöningslåda' },
  { id: 'shop', emoji: '🛍️', label: 'Shop', desc: 'Köp kosmetika & boosts' },
  { id: 'expedition', emoji: '🗺️', label: 'Expedition', desc: 'Skicka husdjuret på äventyr' },
  { id: 'achievements', emoji: '🏆', label: 'Prestationer', desc: 'Se dina utmärkelser' },
  { id: 'craft', emoji: '⚗️', label: 'Craftshop', desc: 'Skapa föremål' },
  { id: 'fortune', emoji: '🥠', label: 'Lyckobudskap', desc: 'Daglig visdom' },
  { id: 'wardrobe', emoji: '👗', label: 'Garderob', desc: 'Klä din husdjur' },
  { id: 'battlepass', emoji: '🎫', label: 'Battle Pass', desc: 'Säsongsbelöningar' },
  { id: 'leaderboard', emoji: '🏅', label: 'Topplista', desc: 'Se rankningen' },
  { id: 'quests', emoji: '📋', label: 'Dagliga Quests', desc: 'Klara uppdrag' },
  { id: 'records', emoji: '📊', label: 'Rekord', desc: 'Dina personliga rekord' },
]

// ── Fortune cookie messages ────────────────────────────────────────────────────
export const FORTUNE_MESSAGES = [
  'Din kraft växer med varje pek. 🌟',
  'Äventyr väntar den modige. 🗺️',
  'Din husdjur älskar dig mer än du vet. 💖',
  'Lyckan ler mot den som fortsätter. 🍀',
  'Ett leende kostar ingenting men ger allt. 😊',
  'Varje dag är en ny chans att bli starkare. ⚡',
  'Skatter hittas av de som söker. 💎',
  'Din streak är ett bevis på din dedikation. 🔥',
  'De stora bossarna fruktar dig. ⚔️',
  'Stjärnorna lyser för dig ikväll. ✨',
]

// ── Lucky box prizes ───────────────────────────────────────────────────────────
export const LUCKY_PRIZES = [
  { emoji: '💰', label: '500 Mynt', coins: 500, kc: 0, xp: 0 },
  { emoji: '⚡', label: '1000 Mynt', coins: 1000, kc: 0, xp: 0 },
  { emoji: '💎', label: '10 KC', coins: 0, kc: 10, xp: 0 },
  { emoji: '🌟', label: '200 XP', coins: 0, kc: 0, xp: 200 },
  { emoji: '🎁', label: '50 KC', coins: 0, kc: 50, xp: 0 },
  { emoji: '🍀', label: '2000 Mynt', coins: 2000, kc: 0, xp: 0 },
  { emoji: '🏆', label: '100 KC', coins: 0, kc: 100, xp: 0 },
  { emoji: '✨', label: '500 XP', coins: 0, kc: 0, xp: 500 },
]
