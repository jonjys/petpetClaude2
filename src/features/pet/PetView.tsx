import { memo, useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { useUIStore } from '@/stores/uiStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { audio } from '@/services/AudioService'
import { formatNumber, formatAge } from '@/utils/format'
import { ALL_ACHIEVEMENTS, SHOP_HATS, SHOP_ACC, SHOP_AURA } from '@/constants/config'

function vibrate(ms: number) {
  if (navigator.vibrate) navigator.vibrate(ms)
}

const BOND_TIERS = ['Okänd', 'Bekant', 'Kompis', 'Vän', 'Bästis', 'Soulmate']
const BOND_THRESHOLDS = [0, 50, 150, 350, 700, 1500]
const BOND_PERKS = [
  'Lär känna ditt husdjur!',
  'Husdjuret litar lite på dig 🤝',
  'Ni är riktiga kompisar! 😊',
  'En äkta vänskap växer 💚',
  'Bästisar för livet! ✨',
  'Soulmates — odelbar förening 💫',
]

const PET_THEMES = [
  { id: 'dark', label: '🌑 Mörk' },
  { id: 'neon', label: '💚 Neon' },
  { id: 'pink', label: '🌸 Rosa' },
  { id: 'gold', label: '✨ Guld' },
]

const TAP_BUBBLES_HAPPY = [
  '😊', '🔥', '⚡', '💪', 'YO!', 'GG!', '💎', '🚀', 'NOICE', 'LFG!', '✨', 'EZ', 'POP!', '🌟', 'LESGO!', '💫', '🎉',
]
const TAP_BUBBLES_NEUTRAL = [
  '👍', 'OK', '🙂', 'Hmm', '...', '🤔', '💤', 'Meh', '😐', 'Sure', '🌀',
]
const TAP_BUBBLES_SAD = [
  '😓', '🥺', 'Hungrig!', 'Trött...', '😔', 'Snälla!', '💔', 'Äta?', 'Vila!', '😩',
]
function getTapBubble(mood: number, hunger: number, energy: number): string {
  if (mood < 20 || hunger < 20 || energy < 20) {
    const pool = [...TAP_BUBBLES_SAD]
    if (hunger < 20) pool.push('🍖 Mat!', 'Hungrig!')
    if (energy < 20) pool.push('💤 Sova...', 'Trött!')
    return pool[Math.floor(Math.random() * pool.length)]
  }
  if (mood < 50 || hunger < 50 || energy < 50) {
    return TAP_BUBBLES_NEUTRAL[Math.floor(Math.random() * TAP_BUBBLES_NEUTRAL.length)]
  }
  return TAP_BUBBLES_HAPPY[Math.floor(Math.random() * TAP_BUBBLES_HAPPY.length)]
}

function wardrobeEmoji(items: typeof SHOP_HATS, id: string): string {
  return items.find(i => i.id === id)?.emoji ?? ''
}

const AURA_GLOW: Record<string, string> = {
  aura_fire:    '0 0 20px rgba(255,100,0,.7)',
  aura_glitter: '0 0 18px rgba(255,200,255,.6)',
  aura_moon:    '0 0 22px rgba(180,180,255,.6)',
  aura_rainbow: '0 0 24px rgba(255,255,100,.5)',
  aura_star:    '0 0 20px rgba(255,255,200,.7)',
  kc_aura:      '0 0 26px rgba(180,100,255,.8)',
}

const SKIN_FILTER: Record<string, string> = {
  skin_fire:   'drop-shadow(0 0 12px #ff4422) saturate(1.5) hue-rotate(-15deg)',
  skin_ice:    'drop-shadow(0 0 12px #44aaff) saturate(0.7) brightness(1.2)',
  skin_gold:   'drop-shadow(0 0 14px #ffcc00) saturate(1.3) brightness(1.1)',
  skin_galaxy: 'drop-shadow(0 0 16px #aa44ff) hue-rotate(20deg) saturate(1.4)',
  skin_ghost:  'drop-shadow(0 0 10px #ffffff55) grayscale(0.7) brightness(1.3)',
  skin_cyber:  'drop-shadow(0 0 12px #00ff88) saturate(1.6) hue-rotate(100deg)',
  kc_dragon:   'drop-shadow(0 0 18px #ff44aa) saturate(1.8) hue-rotate(300deg)',
}

function levelRingColor(level: number): string {
  if (level >= 30) return '#ff3377'
  if (level >= 20) return '#ffcc00'
  if (level >= 15) return '#aa66ff'
  if (level >= 10) return '#4488ff'
  if (level >= 5)  return '#00ff88'
  return '#00f0ff'
}

const EVOLUTION_STAGES = [
  { minLevel: 1,  name: 'Nykling',   emoji: '🥚', nextAt: 5  },
  { minLevel: 5,  name: 'Lärling',   emoji: '🐣', nextAt: 10 },
  { minLevel: 10, name: 'Veteran',   emoji: '⭐', nextAt: 15 },
  { minLevel: 15, name: 'Elite',     emoji: '🌟', nextAt: 20 },
  { minLevel: 20, name: 'Master',    emoji: '💫', nextAt: 30 },
  { minLevel: 30, name: 'Legend',    emoji: '👑', nextAt: null },
]

function getEvolutionStage(level: number) {
  for (let i = EVOLUTION_STAGES.length - 1; i >= 0; i--) {
    if (level >= EVOLUTION_STAGES[i].minLevel) return EVOLUTION_STAGES[i]
  }
  return EVOLUTION_STAGES[0]
}

export const PetView = memo(function PetView() {
  const pet = useGameStore(s => s.pet)
  const tap = useGameStore(s => s.tap)
  const careAction = useGameStore(s => s.careAction)
  const dailyMissions = useGameStore(s => s.dailyMissions)
  const claimMission = useGameStore(s => s.claimMission)
  const newAchievement = useGameStore(s => s.newAchievement)
  const clearNewAchievement = useGameStore(s => s.clearNewAchievement)
  const checkStreak = useGameStore(s => s.checkStreak)
  const levelUpInfo = useGameStore(s => s.levelUpInfo)
  const clearLevelUpInfo = useGameStore(s => s.clearLevelUpInfo)
  const setPetTheme = useGameStore(s => s.setPetTheme)
  const setPetName = useGameStore(s => s.setPetName)
  const setPetEmoji = useGameStore(s => s.setPetEmoji)
  const prestige = useGameStore(s => s.prestige)
  const gainCoins = useGameStore(s => s.gainCoins)
  const hapticEnabled = useSettingsStore(s => s.hapticEnabled)
  const spawnFloat = useUIStore(s => s.spawnFloat)
  const pushNotif = useUIStore(s => s.pushNotif)
  const showToast = useUIStore(s => s.showToast)
  const triggerConfetti = useUIStore(s => s.triggerConfetti)

  const petRef = useRef<HTMLDivElement>(null)
  const comboRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const bubbleRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [achieveVisible, setAchieveVisible] = useState(false)
  const [combo, setCombo] = useState(0)
  const [bubble, setBubble] = useState('')
  const [splashVisible, setSplashVisible] = useState(false)
  const [eventDismissed, setEventDismissed] = useState(() => !!localStorage.getItem('k0509_event_dismissed'))
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false)
  const prevBondTier = useRef(pet.bondTier)
  const prevTapMilestone = useRef(Math.floor(pet.totalTaps / 1000))

  const newAchievementObj = newAchievement ? ALL_ACHIEVEMENTS.find(a => a.id === newAchievement) ?? null : null

  useEffect(() => {
    const result = checkStreak()
    if (result.extended) {
      if (result.shieldUsed) {
        showToast(`🛡️ Streak-sköld aktiverad! Streak ${result.newStreak} skyddad`, 'info')
      } else {
        showToast(`🔥 Streak ${result.newStreak} dag! +${result.coins}💰${result.kc > 0 ? ` +${result.kc}💎` : ''}`, 'success')
      }
      pushNotif('🔥', `Streak dag ${result.newStreak}! +${result.coins} mynt`)
      if (result.kc > 0) audio.achievement()
    }
  }, [checkStreak, showToast, pushNotif])

  useEffect(() => {
    if (!newAchievementObj) return
    setAchieveVisible(true)
    pushNotif('🏆', `Prestation upplåst: ${newAchievementObj.title}`)
    triggerConfetti()
    audio.achievement()
    const t = setTimeout(() => {
      setAchieveVisible(false)
      clearNewAchievement()
    }, 3500)
    return () => clearTimeout(t)
  }, [newAchievementObj, clearNewAchievement, pushNotif, triggerConfetti])

  useEffect(() => {
    if (!levelUpInfo) return
    setSplashVisible(true)
    audio.levelUp()
    triggerConfetti()
  }, [levelUpInfo, triggerConfetti])

  // Tap milestone celebration
  useEffect(() => {
    const milestone = Math.floor(pet.totalTaps / 1000)
    if (milestone > prevTapMilestone.current && pet.totalTaps >= 1000) {
      const taps = milestone * 1000
      showToast(`🎯 ${taps.toLocaleString()} pek uppnådda! +100🪙`, 'success')
      useGameStore.getState().gainCoins(100)
      triggerConfetti()
      audio.levelUp()
    }
    prevTapMilestone.current = milestone
  }, [pet.totalTaps, showToast, triggerConfetti])

  // Bond tier upgrade celebration
  useEffect(() => {
    if (pet.bondTier > prevBondTier.current) {
      const tierName = ['Okänd', 'Bekant', 'Kompis', 'Vän', 'Bästis', 'Soulmate'][pet.bondTier] ?? '???'
      showToast(`💚 Bond ${tierName}! Ditt husdjur älskar dig mer!`, 'success')
      pushNotif('💚', `Bond tier uppgraderad till ${tierName}!`)
      triggerConfetti()
      audio.achievement()
    }
    prevBondTier.current = pet.bondTier
  }, [pet.bondTier, showToast, pushNotif, triggerConfetti])

  // Low-stat notifications (fire once per crossing below threshold)
  const lowNotifRef = useRef<Record<string, boolean>>({})
  useEffect(() => {
    const check = (stat: string, val: number, emoji: string, name: string) => {
      const key = `${stat}_low`
      if (val < 20 && !lowNotifRef.current[key]) {
        lowNotifRef.current[key] = true
        pushNotif(emoji, `${name} är låg (${Math.round(val)})! Ta hand om ditt husdjur.`)
      } else if (val >= 30) {
        lowNotifRef.current[key] = false
      }
    }
    check('hunger', pet.hunger, '🍖', 'Hunger')
    check('energy', pet.energy, '⚡', 'Energi')
    check('mood', pet.mood, '💖', 'Humör')
  }, [pet.hunger, pet.energy, pet.mood, pushNotif])

  const handleTap = (e: React.MouseEvent | React.TouchEvent) => {
    const rect = petRef.current?.getBoundingClientRect()
    if (!rect) return
    const clientX = 'touches' in e ? e.touches[0]?.clientX ?? rect.left + rect.width / 2 : (e as React.MouseEvent).clientX
    const clientY = 'touches' in e ? e.touches[0]?.clientY ?? rect.top + rect.height / 2 : (e as React.MouseEvent).clientY
    const result = tap()
    audio.tap()
    if (hapticEnabled) vibrate(result.lvlUp ? 200 : 20)

    // Combo XP bonus — applied *after* tap, using current combo count
    const comboBonus = combo >= 50 ? 3 : combo >= 20 ? 2 : combo >= 10 ? 1.5 : combo >= 5 ? 1.2 : 1
    const displayXP = Math.round(result.xp * comboBonus)
    if (comboBonus > 1) {
      useGameStore.getState().gainXP(Math.round(result.xp * (comboBonus - 1)), 'combo')
      spawnFloat(`+${displayXP}XP 🔥`, clientX, clientY, '#ff3377')
    } else {
      spawnFloat(`+${result.xp}XP`, clientX, clientY, '#00f0ff')
    }
    if (result.coins > 0) spawnFloat('+1💰', clientX + 20, clientY - 20, '#ffcc00')

    // Lucky tap event (1% chance)
    if (Math.random() < 0.01) {
      const lucky = 10 + Math.floor(Math.random() * 20)
      gainCoins(lucky)
      spawnFloat(`💥 LUCKY +${lucky}💰`, clientX, clientY - 30, '#ffcc00')
      audio.achievement()
    }

    // Combo
    setCombo(c => {
      const next = c + 1
      if (comboRef.current) clearTimeout(comboRef.current)
      comboRef.current = setTimeout(() => setCombo(0), 1800)
      if (next === 5 || next === 10 || next === 20 || next === 50) {
        audio.combo(next)
        spawnFloat(`🔥 ${next}× COMBO!`, clientX, clientY - 50, '#ff3377')
      }
      return next
    })

    // Speech bubble
    setBubble(getTapBubble(pet.mood, pet.hunger, pet.energy))
    if (bubbleRef.current) clearTimeout(bubbleRef.current)
    bubbleRef.current = setTimeout(() => setBubble(''), 1400)
  }

  const xpPct = Math.min(100, (pet.exp / pet.expNext) * 100)
  const evolutionStage = getEvolutionStage(pet.level)
  const x2xpActive = useMemo(() => pet.x2xpExpiry > Date.now(), [pet.x2xpExpiry])
  const x2xpMinsLeft = useMemo(() => Math.max(0, Math.ceil((pet.x2xpExpiry - Date.now()) / 60000)), [pet.x2xpExpiry])

  // Bond progress to next tier
  const bondCurrent = pet.bondTier < 5 ? BOND_THRESHOLDS[pet.bondTier] : BOND_THRESHOLDS[4]
  const bondNext = pet.bondTier < 5 ? BOND_THRESHOLDS[pet.bondTier + 1] : BOND_THRESHOLDS[5]
  const bondPct = pet.bondTier >= 5 ? 100 : Math.min(100, ((pet.bondPoints - bondCurrent) / (bondNext - bondCurrent)) * 100)

  const dismissSplash = () => {
    setSplashVisible(false)
    clearLevelUpInfo()
  }

  const commitName = useCallback(() => {
    const trimmed = nameInput.trim()
    if (trimmed.length >= 2 && trimmed.length <= 20) {
      setPetName(trimmed)
      showToast(`✏️ Namn ändrat till "${trimmed}"!`, 'success')
    }
    setEditingName(false)
    setNameInput('')
  }, [nameInput, setPetName, showToast])

  const PET_EMOJIS = ['🐉', '🦊', '🐺', '🐼', '🐱', '🐶', '🦁', '🐯', '🦄', '🐸', '🐧', '🦅', '🐙', '🦋', '🦖', '🌟', '🔥', '⚡', '🌈', '👾']

  const setTab = useUIStore(s => s.setTab)
  const expId = localStorage.getItem('k0509_activeExp')
  const expEnd = Number(localStorage.getItem('k0509_expEnd') ?? 0)
  const expReady = !!expId && Date.now() >= expEnd && expEnd > 0

  return (
    <>
      {/* Expedition ready banner */}
      {expReady && (
        <div
          style={{
            margin: '0 14px 8px',
            background: 'linear-gradient(135deg, rgba(0,255,136,.15), rgba(68,136,255,.08))',
            border: '1px solid rgba(0,255,136,.4)',
            borderRadius: 16, padding: '10px 14px',
            display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
          }}
          onClick={() => setTab('create')}
        >
          <span style={{ fontSize: 22 }}>🗺️</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--ff-head)', fontSize: 12, fontWeight: 900, color: 'var(--green)', letterSpacing: 1 }}>
              EXPEDITION KLAR!
            </div>
            <div style={{ fontSize: 10, color: 'var(--t2)' }}>Tryck för att hämta belöningen</div>
          </div>
          <div style={{
            background: 'var(--green)', borderRadius: 8, padding: '4px 10px',
            fontSize: 10, fontWeight: 900, color: '#000',
          }}>Hämta!</div>
        </div>
      )}

      {/* Level-up splash */}
      {splashVisible && levelUpInfo && (
        <div className="splash show" onClick={dismissSplash}>
          <div className="lvl-badge">LV{levelUpInfo.level}</div>
          <div className="sp-title">LEVEL UP!</div>
          <div className="sp-sub">
            Nivå {levelUpInfo.level} uppnådd!
            {levelUpInfo.coins > 0 ? ` +${levelUpInfo.coins}💰` : ''}
            {levelUpInfo.kc > 0 ? ` +${levelUpInfo.kc}💎` : ''}
          </div>
          <div className="lvl-stars">
            {[0,1,2,3,4].map(i => <div key={i} className="lvl-star" />)}
          </div>
        </div>
      )}

      {/* Achievement overlay */}
      {achieveVisible && newAchievementObj && (
        <div id="achieveOverlay" className="open" onClick={() => { setAchieveVisible(false); clearNewAchievement() }}>
          <div className="ach-big">{newAchievementObj.emoji}</div>
          <div className="ach-unlocked">✦ Badge Upplåst ✦</div>
          <div className="ach-name">{newAchievementObj.title}</div>
          <div className="ach-desc">{newAchievementObj.description ?? 'Prestation upplåst!'}</div>
          <div className="ach-tap">🔥 AWESOME!</div>
        </div>
      )}

      {/* Seasonal Event Banner */}
      {!eventDismissed && (
        <div style={{
          margin: '0 14px 8px',
          background: 'linear-gradient(135deg, rgba(255,204,0,.15), rgba(255,136,68,.08))',
          border: '1px solid rgba(255,204,0,.35)',
          borderRadius: 16, padding: '10px 14px',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 22 }}>🌅</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--ff-head)', fontSize: 12, fontWeight: 900, color: 'var(--gold)', letterSpacing: 1 }}>
              SOMMERFESTIVALEN 2026
            </div>
            <div style={{ fontSize: 10, color: 'var(--t3)' }}>+25% XP t.o.m. 31 aug</div>
          </div>
          <button
            style={{ background: 'none', border: 'none', color: 'var(--t3)', fontSize: 16, cursor: 'pointer', padding: 4 }}
            onClick={() => { setEventDismissed(true); localStorage.setItem('k0509_event_dismissed', '1') }}
          >✕</button>
        </div>
      )}

      {/* Active boost indicators */}
      {(x2xpActive || pet.streakShields > 0) && (
        <div style={{ display: 'flex', gap: 8, padding: '0 14px 8px' }}>
          {x2xpActive && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'rgba(68,136,255,.15)', border: '1px solid rgba(68,136,255,.4)',
              borderRadius: 10, padding: '4px 10px',
              fontFamily: 'var(--ff-head)', fontSize: 11, fontWeight: 900, color: 'var(--blue)',
            }}>
              ⚡ 2× XP <span style={{ fontSize: 9, fontWeight: 400, color: 'var(--t3)', marginLeft: 2 }}>{x2xpMinsLeft}min kvar</span>
            </div>
          )}
          {pet.streakShields > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'rgba(0,255,136,.1)', border: '1px solid rgba(0,255,136,.3)',
              borderRadius: 10, padding: '4px 10px',
              fontFamily: 'var(--ff-head)', fontSize: 11, fontWeight: 900, color: 'var(--green)',
            }}>
              🛡️ Streak sköld ×{pet.streakShields}
            </div>
          )}
        </div>
      )}

      {/* Big animated pet stage */}
      <div className="pet-stage">
        <div className="pet-stage-bg" />
        <div className="pet-particles" />
        <div className="pet-main-wrap">
          <div className="pet-aura" />
          <div style={{ position: 'relative', display: 'inline-block' }}>
            {/* XP ring SVG */}
            <svg className="pet-stage-xp-ring" viewBox="0 0 140 140">
              <circle className="psr-bg" cx="70" cy="70" r="62" />
              <circle
                className="psr-fill"
                cx="70" cy="70" r="62"
                strokeDasharray="389.6"
                strokeDashoffset={389.6 * (1 - xpPct / 100)}
                stroke={levelRingColor(pet.level)}
              />
            </svg>
            {/* Combo badge */}
            {combo >= 3 && (
              <div className="combo-badge">🔥 ×{combo}</div>
            )}
            {/* Speech bubble */}
            {bubble && (
              <div className="pet-bubble">{bubble}</div>
            )}
            <div style={{ position: 'relative', display: 'inline-block' }}>
              {/* Hat overlay */}
              {pet.wardrobe.hat !== 'none' && wardrobeEmoji(SHOP_HATS, pet.wardrobe.hat) && (
                <div style={{
                  position: 'absolute', top: -28, left: '50%', transform: 'translateX(-50%)',
                  fontSize: 30, lineHeight: 1, zIndex: 2, pointerEvents: 'none',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,.5))',
                }}>
                  {wardrobeEmoji(SHOP_HATS, pet.wardrobe.hat)}
                </div>
              )}
              {/* Acc overlay */}
              {pet.wardrobe.acc !== 'none' && wardrobeEmoji(SHOP_ACC, pet.wardrobe.acc) && (
                <div style={{
                  position: 'absolute', bottom: 8, right: -22,
                  fontSize: 22, lineHeight: 1, zIndex: 2, pointerEvents: 'none',
                  filter: 'drop-shadow(0 1px 3px rgba(0,0,0,.5))',
                }}>
                  {wardrobeEmoji(SHOP_ACC, pet.wardrobe.acc)}
                </div>
              )}
              {/* Aura glow ring */}
              {pet.wardrobe.aura !== 'none' && AURA_GLOW[pet.wardrobe.aura] && (
                <div style={{
                  position: 'absolute', inset: -8, borderRadius: '50%',
                  boxShadow: AURA_GLOW[pet.wardrobe.aura],
                  pointerEvents: 'none', zIndex: 1,
                  animation: 'auraPulse 2s ease-in-out infinite',
                }} />
              )}
              <div
                ref={petRef}
                className="pet-emoji-big"
                onClick={handleTap}
                onTouchStart={handleTap}
                style={SKIN_FILTER[pet.activeSkin] ? { filter: SKIN_FILTER[pet.activeSkin] } : undefined}
              >
                {pet.petEmoji}
              </div>
            </div>
          </div>
          <div className="pet-stage-name" id="petStageName">{pet.petName}</div>
          <div style={{
            fontSize: 11, fontWeight: 900, letterSpacing: 1,
            color: levelRingColor(pet.level),
            textShadow: `0 0 8px ${levelRingColor(pet.level)}`,
            marginTop: 4,
          }}>
            {evolutionStage.emoji} {evolutionStage.name.toUpperCase()}
            {evolutionStage.nextAt ? ` · LV${evolutionStage.nextAt}↑` : ' · MAX'}
          </div>
        </div>
        {/* Vitals overlay */}
        <div className="pet-stage-vitals">
          <div className="psv-item">
            <div className="psv-lbl"><span>🍖</span><span>{Math.round(pet.hunger)}</span></div>
            <div className="psv-bar"><div className="psv-fill" style={{ width: `${pet.hunger}%`, background: 'var(--orange)' }} /></div>
          </div>
          <div className="psv-item">
            <div className="psv-lbl"><span>⚡</span><span>{Math.round(pet.energy)}</span></div>
            <div className="psv-bar"><div className="psv-fill" style={{ width: `${pet.energy}%`, background: 'var(--blue)' }} /></div>
          </div>
          <div className="psv-item">
            <div className="psv-lbl"><span>💖</span><span>{Math.round(pet.mood)}</span></div>
            <div className="psv-bar"><div className="psv-fill" style={{ width: `${pet.mood}%`, background: 'var(--purple)' }} /></div>
          </div>
        </div>
      </div>

      {/* Emoji picker overlay */}
      {emojiPickerOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'flex-end' }}
          onClick={() => setEmojiPickerOpen(false)}
        >
          <div
            style={{ width: '100%', background: 'var(--s2)', borderRadius: '20px 20px 0 0', padding: '20px 16px 40px' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontFamily: 'var(--ff-head)', fontSize: 14, fontWeight: 900, color: '#fff', marginBottom: 14, textAlign: 'center' }}>
              VÄLJ HUSDJURSEMOJI
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
              {PET_EMOJIS.map(e => (
                <button
                  key={e}
                  onClick={() => { setPetEmoji(e); setEmojiPickerOpen(false); showToast(`Husdjur är nu ${e}!`, 'success'); audio.click() }}
                  style={{
                    background: pet.petEmoji === e ? 'rgba(0,255,136,.15)' : 'rgba(255,255,255,.05)',
                    border: pet.petEmoji === e ? '1px solid var(--green)' : '1px solid rgba(255,255,255,.08)',
                    borderRadius: 12, padding: 12, fontSize: 28, cursor: 'pointer',
                  }}
                >{e}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Pet info card */}
      <div className="pet-info-card">
        <div className="pet-name-row">
          <div style={{ flex: 1 }}>
            {editingName ? (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input
                  autoFocus
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value.slice(0, 20))}
                  onKeyDown={e => { if (e.key === 'Enter') commitName(); if (e.key === 'Escape') setEditingName(false) }}
                  style={{
                    flex: 1, background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.2)',
                    borderRadius: 8, padding: '6px 10px', color: '#fff', fontSize: 16, fontFamily: 'var(--ff-head)', fontWeight: 900,
                    outline: 'none',
                  }}
                  placeholder="Nytt namn..."
                  maxLength={20}
                />
                <button onClick={commitName} style={{ background: 'var(--green)', border: 'none', borderRadius: 8, padding: '6px 10px', fontSize: 13, fontWeight: 900, color: '#000', cursor: 'pointer' }}>✓</button>
                <button onClick={() => setEditingName(false)} style={{ background: 'rgba(255,255,255,.08)', border: 'none', borderRadius: 8, padding: '6px 10px', fontSize: 13, color: 'var(--t2)', cursor: 'pointer' }}>✕</button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="pet-name-big" id="petNameBig">{pet.petName}</div>
                <button
                  onClick={() => { setNameInput(pet.petName); setEditingName(true) }}
                  style={{ background: 'none', border: 'none', color: 'var(--t3)', fontSize: 14, cursor: 'pointer', padding: 2 }}
                  title="Byt namn"
                >✏️</button>
                <button
                  onClick={() => setEmojiPickerOpen(true)}
                  style={{ background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', padding: 2 }}
                  title="Byt emoji"
                >{pet.petEmoji}</button>
              </div>
            )}
            <div className="pet-evol" id="petEvol">LV{pet.level} · {formatAge(pet.createdAt)} gammal</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div className="lv-ring-wrap">
              <svg className="lv-ring" viewBox="0 0 52 52">
                <circle className="lr-bg" cx="26" cy="26" r="22"/>
                <circle className="lr-fill" cx="26" cy="26" r="22" strokeDasharray="138.2" strokeDashoffset={138.2 * (1 - xpPct / 100)} stroke={levelRingColor(pet.level)}/>
              </svg>
              <div className="lv-num"><div className="lv-n">{pet.level}</div><div className="lv-l">LV</div></div>
            </div>
            {pet.prestigeLevel > 0 && (
              <div style={{ fontSize: 10, color: 'var(--gold)', letterSpacing: 1, fontWeight: 900 }}>
                {'⭐'.repeat(Math.min(pet.prestigeLevel, 5))}
              </div>
            )}
          </div>
        </div>
        <div className="xp-wrap">
          <div className="xp-labels"><span>XP</span><span>{formatNumber(pet.exp)}/{formatNumber(pet.expNext)}</span></div>
          <div className="xp-track"><div className="xp-fill" style={{ width: `${xpPct}%` }} /></div>
        </div>
        {/* Prestige button (level >= 10) */}
        {pet.level >= 10 && (
          <div
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0 0', borderTop: '1px solid var(--line)', marginTop: 8 }}
          >
            <div>
              <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--gold)', letterSpacing: 1 }}>
                ✦ PRESTIGE {pet.prestigeLevel > 0 ? `×${pet.prestigeLevel}` : 'TILLGÄNGLIG'}
              </div>
              <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 2 }}>Återstall LV1 · +50💎 KC</div>
            </div>
            <button
              className="btn-gold"
              style={{ fontSize: 12, padding: '6px 14px' }}
              onClick={() => {
                const ok = prestige()
                if (ok) { showToast('✦ PRESTIGE! +50 KC', 'success'); audio.achievement() }
              }}
            >
              PRESTIGE
            </button>
          </div>
        )}

        <div className="stats-3">
          <div className="stat-box">
            <div className="stat-val" style={{ color: 'var(--red)' }}>{pet.battleWins}</div>
            <div className="stat-bar"><div className="stat-fill" style={{ width: `${Math.min(100, pet.battleWins)}%`, background: 'var(--red)' }} /></div>
            <div className="stat-lbl">⚔️ Action</div>
          </div>
          <div className="stat-box">
            <div className="stat-val" style={{ color: 'var(--gold)' }}>{formatNumber(pet.coins)}</div>
            <div className="stat-bar"><div className="stat-fill" style={{ width: Math.min(100, (pet.coins / 1000) * 100) + '%', background: 'var(--gold)' }} /></div>
            <div className="stat-lbl">💰 Commerce</div>
          </div>
          <div className="stat-box">
            <div className="stat-val" style={{ color: 'var(--blue)' }}>{pet.streak}</div>
            <div className="stat-bar"><div className="stat-fill" style={{ width: `${Math.min(100, pet.streak * 10)}%`, background: 'var(--blue)' }} /></div>
            <div className="stat-lbl">⭐ Social</div>
          </div>
        </div>
      </div>

      {/* Vitals card */}
      <div className="vitals-card">
        <div className="vitals-title">VITALS</div>
        {([
          { icon: '🍖', name: 'HUNGER', val: pet.hunger, color: 'var(--orange)', decay: 0.8 },
          { icon: '⚡', name: 'ENERGY', val: pet.energy, color: 'var(--blue)',   decay: 0.3 },
          { icon: '💖', name: 'MOOD',   val: pet.mood,   color: 'var(--purple)', decay: 0.5 },
        ] as const).map(s => {
          const minsToLow = s.val > 20 ? Math.round((s.val - 20) / s.decay) : 0
          return (
            <div key={s.name} className="vital-row">
              <div className="vital-icon">{s.icon}</div>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div className="vital-name">{s.name}</div>
                {minsToLow > 0 && minsToLow <= 60 && (
                  <div style={{ fontSize: 8, color: minsToLow <= 15 ? 'var(--red)' : 'var(--t3)', marginTop: 1 }}>
                    ~{minsToLow}m till låg
                  </div>
                )}
              </div>
              <div className="vital-track"><div className="vital-fill" style={{ width: `${s.val}%`, background: s.color }} /></div>
              <div className="vital-val" style={{ color: s.color }}>{Math.round(s.val)}</div>
            </div>
          )
        })}
      </div>

      {/* Care grid */}
      <div className="care-section-hdr">
        <div className="care-section-title">🎮 CARE</div>
        <div style={{ fontSize: 9, color: 'var(--t3)', fontWeight: 700 }}>{formatAge(pet.createdAt)} gammal</div>
      </div>
      <div className="care-grid" id="careGrid">
        <div className="care-btn" data-accent="orange" onClick={() => { careAction('feed'); audio.click() }}>
          <span className="care-ico">🍖</span><span className="care-lbl">MATA</span><span className="care-cost">−10💰</span>
        </div>
        <div className="care-btn" data-accent="red" onClick={() => { careAction('train'); audio.click() }}>
          <span className="care-ico">🏋️</span><span className="care-lbl">TRÄNA</span><span className="care-cost">+15XP</span>
        </div>
        <div className="care-btn" data-accent="blue" onClick={() => { careAction('sleep'); audio.click() }}>
          <span className="care-ico">😴</span><span className="care-lbl">SOVA</span><span className="care-cost">+40⚡</span>
        </div>
        <div className="care-btn" data-accent="purple" onClick={() => { careAction('play'); audio.click() }}>
          <span className="care-ico">🎮</span><span className="care-lbl">LEK</span><span className="care-cost">+5💰</span>
        </div>
      </div>

      {/* 7-day streak calendar */}
      {(() => {
        const days: { label: string; key: string; active: boolean }[] = []
        const LABELS = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön']
        for (let i = 6; i >= 0; i--) {
          const d = new Date(Date.now() - i * 86400000)
          const key = `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`
          days.push({ label: LABELS[d.getDay() === 0 ? 6 : d.getDay() - 1], key, active: !!pet.activityLog[key] })
        }
        const streak = days.filter(d => d.active).length
        return (
          <div style={{
            margin: '0 14px 10px',
            background: 'rgba(255,204,0,.06)', border: '1px solid rgba(255,204,0,.2)',
            borderRadius: 16, padding: '10px 14px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontFamily: 'var(--ff-head)', fontSize: 11, fontWeight: 900, color: 'var(--gold)', letterSpacing: 1 }}>
                🗓️ VECKANS AKTIVITET
              </div>
              <div style={{ fontSize: 10, color: 'var(--t3)' }}>{streak}/7 dagar</div>
            </div>
            <div style={{ display: 'flex', gap: 4, justifyContent: 'space-between' }}>
              {days.map((d, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: d.active ? 'rgba(255,204,0,.25)' : 'rgba(255,255,255,.04)',
                    border: d.active ? '1px solid rgba(255,204,0,.5)' : '1px solid rgba(255,255,255,.07)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14,
                  }}>{d.active ? '⭐' : ''}</div>
                  <div style={{ fontSize: 8, color: d.active ? 'var(--gold)' : 'var(--t3)' }}>{d.label}</div>
                </div>
              ))}
            </div>
          </div>
        )
      })()}

      {/* Bond section */}
      <div className="bond-section">
        <div className="bond-hdr">
          <span className="bond-tier-name">{BOND_TIERS[pet.bondTier]}</span>
          <span className="bond-pts">{pet.bondPoints} bp</span>
        </div>
        <div className="bond-dots">
          {[0,1,2,3,4].map(i => (
            <span key={i} className={`bond-dot${i < pet.bondTier ? ' filled' : ''}`} />
          ))}
        </div>
        <div className="bond-bar-bg">
          <div className="bond-bar-fill" style={{ width: `${bondPct}%` }} />
        </div>
        <div className="bond-perk">{BOND_PERKS[pet.bondTier]}</div>
      </div>

      {/* Theme picker */}
      <div className="theme-row">
        {PET_THEMES.map(t => (
          <span
            key={t.id}
            className={`theme-chip${pet.petTheme === t.id ? ' on' : ''}`}
            onClick={() => { setPetTheme(t.id); audio.click() }}
          >
            {t.label}
          </span>
        ))}
      </div>

      {/* Daily missions */}
      <div className="missions-card" id="missionsCard">
        <div className="missions-hdr">
          <div className="missions-title">📅 Dagliga uppdrag</div>
          <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--gold)' }}>
            {dailyMissions.filter(m => m.done).length}/{dailyMissions.length}
          </div>
        </div>
        <div id="missionsList">
          {dailyMissions.map(m => (
            <div key={m.id} className={`mission-row${m.done ? ' done' : ''}`} data-type={m.type}>
              <div className="m-ico">{m.emoji}</div>
              <div className="m-info">
                <div className="m-name">{m.label}</div>
                <div className="m-prog-wrap"><div className="m-prog" style={{ width: `${Math.min(100, (m.progress / m.target) * 100)}%` }} /></div>
                <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 3 }}>{m.progress}/{m.target}</div>
              </div>
              <div>
                {m.done
                  ? <div className="m-done-chip" onClick={() => { claimMission(m.id); audio.achievement() }}>✓ KLAR</div>
                  : <div className="m-rwd-chip">{m.target} mål</div>
                }
              </div>
            </div>
          ))}
        </div>
        <div className="missions-complete-bar"><div className="missions-complete-fill" style={{ width: `${dailyMissions.length > 0 ? (dailyMissions.filter(m => m.done).length / dailyMissions.length) * 100 : 0}%` }} /></div>
      </div>

      {/* Global game stats */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 14px 6px' }}>
        <div className="sh-t">📊 MINA STATS</div>
      </div>
      <div className="global-stats-grid" id="globalStatsGrid">
        <div className="gstat-box">
          <div className="gstat-ico">🎣</div>
          <div className="gstat-val" style={{ color: 'var(--blue)' }}>{pet.fishCaught}</div>
          <div className="gstat-lbl">Fiskar</div>
        </div>
        <div className="gstat-box">
          <div className="gstat-ico">⚔️</div>
          <div className="gstat-val" style={{ color: 'var(--red)' }}>{pet.battleWins}</div>
          <div className="gstat-lbl">Battles</div>
        </div>
        <div className="gstat-box">
          <div className="gstat-ico">🏃</div>
          <div className="gstat-val" style={{ color: 'var(--green)' }}>{pet.runnerBest}</div>
          <div className="gstat-lbl">Runner</div>
        </div>
        <div className="gstat-box">
          <div className="gstat-ico">💎</div>
          <div className="gstat-val" style={{ color: 'var(--teal)' }}>{formatNumber(pet.kc)}</div>
          <div className="gstat-lbl">KC</div>
        </div>
        <div className="gstat-box">
          <div className="gstat-ico">🔥</div>
          <div className="gstat-val" style={{ color: 'var(--orange)' }}>{pet.streak}</div>
          <div className="gstat-lbl">Streak</div>
        </div>
        <div className="gstat-box">
          <div className="gstat-ico">⭐</div>
          <div className="gstat-val" style={{ color: 'var(--gold)' }}>{pet.level}</div>
          <div className="gstat-lbl">Level</div>
        </div>
      </div>

      <div className="vend" />
    </>
  )
})
