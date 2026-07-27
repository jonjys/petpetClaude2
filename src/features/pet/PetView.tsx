import { memo, useEffect, useRef, useState } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { useUIStore } from '@/stores/uiStore'
import { audio } from '@/services/AudioService'
import { formatNumber, formatAge } from '@/utils/format'
import { ALL_ACHIEVEMENTS } from '@/constants/config'

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

const TAP_BUBBLES = [
  '😊', '🔥', '⚡', '💪', 'YO!', 'GG!', '💎', '🚀', 'NOICE', 'LFG!', '✨', 'EZ', 'POP!',
]

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
  const prestige = useGameStore(s => s.prestige)
  const spawnFloat = useUIStore(s => s.spawnFloat)
  const pushNotif = useUIStore(s => s.pushNotif)
  const showToast = useUIStore(s => s.showToast)

  const petRef = useRef<HTMLDivElement>(null)
  const comboRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const bubbleRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [achieveVisible, setAchieveVisible] = useState(false)
  const [combo, setCombo] = useState(0)
  const [bubble, setBubble] = useState('')
  const [splashVisible, setSplashVisible] = useState(false)

  const newAchievementObj = newAchievement ? ALL_ACHIEVEMENTS.find(a => a.id === newAchievement) ?? null : null

  useEffect(() => { checkStreak() }, [checkStreak])

  useEffect(() => {
    if (!newAchievementObj) return
    setAchieveVisible(true)
    pushNotif('🏆', `Prestation upplåst: ${newAchievementObj.title}`)
    const t = setTimeout(() => {
      setAchieveVisible(false)
      clearNewAchievement()
    }, 3500)
    return () => clearTimeout(t)
  }, [newAchievementObj, clearNewAchievement, pushNotif])

  useEffect(() => {
    if (!levelUpInfo) return
    setSplashVisible(true)
    audio.achievement()
  }, [levelUpInfo])

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
    spawnFloat(`+${result.xp}XP`, clientX, clientY, '#00f0ff')
    if (result.coins > 0) spawnFloat('+1💰', clientX + 20, clientY - 20, '#ffcc00')

    // Combo
    setCombo(c => {
      const next = c + 1
      if (comboRef.current) clearTimeout(comboRef.current)
      comboRef.current = setTimeout(() => setCombo(0), 1800)
      return next
    })

    // Speech bubble
    setBubble(TAP_BUBBLES[Math.floor(Math.random() * TAP_BUBBLES.length)])
    if (bubbleRef.current) clearTimeout(bubbleRef.current)
    bubbleRef.current = setTimeout(() => setBubble(''), 1400)
  }

  const xpPct = Math.min(100, (pet.exp / pet.expNext) * 100)

  // Bond progress to next tier
  const bondCurrent = pet.bondTier < 5 ? BOND_THRESHOLDS[pet.bondTier] : BOND_THRESHOLDS[4]
  const bondNext = pet.bondTier < 5 ? BOND_THRESHOLDS[pet.bondTier + 1] : BOND_THRESHOLDS[5]
  const bondPct = pet.bondTier >= 5 ? 100 : Math.min(100, ((pet.bondPoints - bondCurrent) / (bondNext - bondCurrent)) * 100)

  const dismissSplash = () => {
    setSplashVisible(false)
    clearLevelUpInfo()
  }

  return (
    <>
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
            <div
              ref={petRef}
              className="pet-emoji-big"
              onClick={handleTap}
              onTouchStart={handleTap}
            >
              {pet.petEmoji}
            </div>
          </div>
          <div className="pet-stage-name" id="petStageName">{pet.petName}</div>
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

      {/* Pet info card */}
      <div className="pet-info-card">
        <div className="pet-name-row">
          <div>
            <div className="pet-name-big" id="petNameBig">{pet.petName}</div>
            <div className="pet-evol" id="petEvol">LV{pet.level} · {formatAge(pet.createdAt)} gammal</div>
          </div>
          <div className="lv-ring-wrap">
            <svg className="lv-ring" viewBox="0 0 52 52">
              <circle className="lr-bg" cx="26" cy="26" r="22"/>
              <circle className="lr-fill" cx="26" cy="26" r="22" strokeDasharray="138.2" strokeDashoffset={138.2 * (1 - xpPct / 100)}/>
            </svg>
            <div className="lv-num"><div className="lv-n">{pet.level}</div><div className="lv-l">LV</div></div>
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
        <div className="vital-row">
          <div className="vital-icon">🍖</div>
          <div className="vital-name">HUNGER</div>
          <div className="vital-track"><div className="vital-fill" style={{ width: `${pet.hunger}%`, background: 'var(--orange)' }} /></div>
          <div className="vital-val" style={{ color: 'var(--orange)' }}>{Math.round(pet.hunger)}</div>
        </div>
        <div className="vital-row">
          <div className="vital-icon">⚡</div>
          <div className="vital-name">ENERGY</div>
          <div className="vital-track"><div className="vital-fill" style={{ width: `${pet.energy}%`, background: 'var(--blue)' }} /></div>
          <div className="vital-val" style={{ color: 'var(--blue)' }}>{Math.round(pet.energy)}</div>
        </div>
        <div className="vital-row">
          <div className="vital-icon">💖</div>
          <div className="vital-name">MOOD</div>
          <div className="vital-track"><div className="vital-fill" style={{ width: `${pet.mood}%`, background: 'var(--purple)' }} /></div>
          <div className="vital-val" style={{ color: 'var(--purple)' }}>{Math.round(pet.mood)}</div>
        </div>
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
