import { memo, useState, useCallback } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { useUIStore } from '@/stores/uiStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { formatNumber, formatAge } from '@/utils/format'
import { audio } from '@/services/AudioService'
import { ALL_ACHIEVEMENTS } from '@/constants/config'

const PET_EMOJIS = ['🐱', '🐶', '🦊', '🐻', '🐼', '🐨', '🦁', '🐯', '🐸', '🐙', '🦄', '🐲']

export const ProfileView = memo(function ProfileView() {
  const pet = useGameStore(s => s.pet)
  const gainXP = useGameStore(s => s.gainXP)
  const inventory = useGameStore(s => s.inventory)
  const useInventoryItem = useGameStore(s => s.useInventoryItem)
  const unlockedAchievements = useGameStore(s => s.unlockedAchievements)
  const showToast = useUIStore(s => s.showToast)
  const settings = useSettingsStore()

  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState(pet.petName)
  const [pinnedAchievements, setPinnedAchievements] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('k0509_pinned_ach') || '[]') } catch { return [] }
  })

  const togglePin = useCallback((id: string) => {
    setPinnedAchievements(prev => {
      let next: string[]
      if (prev.includes(id)) {
        next = prev.filter(x => x !== id)
      } else if (prev.length < 3) {
        next = [...prev, id]
      } else {
        next = [...prev.slice(1), id]
      }
      localStorage.setItem('k0509_pinned_ach', JSON.stringify(next))
      audio.click()
      return next
    })
  }, [])

  const saveName = () => {
    if (nameInput.trim()) {
      useGameStore.setState(s => ({ pet: { ...s.pet, petName: nameInput.trim() } }))
      useGameStore.getState().save()
    }
    setEditingName(false)
  }

  const setPetEmoji = (emoji: string) => {
    useGameStore.setState(s => ({ pet: { ...s.pet, petEmoji: emoji } }))
    useGameStore.getState().save()
    audio.click()
  }

  return (
    <>
      {/* Profile cover */}
      <div className="prof-cover">
        <div className="prof-cover-pat" />
        <div className="prof-cover-glow" />
      </div>

      {/* Avatar */}
      <div className="prof-ava-wr">
        <div className="prof-ava">
          <span>{pet.petEmoji}</span>
          <div className="prof-trust">LV{pet.level}</div>
        </div>
      </div>

      <div className="prof-content">
        {/* Name */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
          <div>
            {editingName ? (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  style={{ background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.15)', borderRadius: 10, padding: '6px 12px', color: '#fff', fontSize: 16, fontFamily: 'var(--ff-head)', fontWeight: 900, outline: 'none' }}
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveName() }}
                  autoFocus
                  maxLength={20}
                />
                <button className="btn btn-sm" onClick={saveName}>Spara</button>
              </div>
            ) : (
              <div className="prof-name" onClick={() => setEditingName(true)} style={{ cursor: 'pointer' }}>
                {pet.petName} <span style={{ fontSize: 14, opacity: 0.5 }}>✏️</span>
              </div>
            )}
            <div className="prof-handle">@{pet.petName.toLowerCase().replace(/\s/g, '_')}</div>
          </div>
        </div>

        <div className="prof-bio">Ålder: {formatAge(pet.createdAt)} · LV{pet.level}</div>

        {/* Follow stats */}
        <div className="follow-row">
          <div className="follow-stat">
            <div className="follow-stat-n">{formatNumber(pet.totalTaps)}</div>
            <div className="follow-stat-l">Pek</div>
          </div>
          <div className="follow-stat">
            <div className="follow-stat-n">{formatNumber(pet.coins)}</div>
            <div className="follow-stat-l">Mynt</div>
          </div>
          <div className="follow-stat">
            <div className="follow-stat-n">{pet.streak}</div>
            <div className="follow-stat-l">Streak</div>
          </div>
        </div>

        {/* Pinned achievements */}
        <PinnedAchievementsSection pinnedIds={pinnedAchievements} unlocked={unlockedAchievements} />

        {/* Activity heatmap */}
        <ActivityHeatmap activityLog={pet.activityLog} />

        {/* Stats grid */}
        <div className="prof-stats">
          <div className="ps"><div className="ps-ico">⚡</div><div className="ps-v">{formatNumber(pet.exp)}</div><div className="ps-l">XP</div></div>
          <div className="ps"><div className="ps-ico">🎯</div><div className="ps-v">{pet.questsCompleted}</div><div className="ps-l">QUEST</div></div>
          <div className="ps"><div className="ps-ico">💰</div><div className="ps-v">{formatNumber(pet.coins)}</div><div className="ps-l">MYNT</div></div>
          <div className="ps"><div className="ps-ico">⭐</div><div className="ps-v">{pet.level}</div><div className="ps-l">LEVEL</div></div>
          <div className="ps"><div className="ps-ico">⚔️</div><div className="ps-v">{pet.battleWins}</div><div className="ps-l">BATTLE</div></div>
          <div className="ps"><div className="ps-ico">🎣</div><div className="ps-v">{pet.fishCaught}</div><div className="ps-l">FISK</div></div>
          <div className="ps"><div className="ps-ico">💎</div><div className="ps-v">{formatNumber(pet.kc)}</div><div className="ps-l">KC</div></div>
          <div className="ps"><div className="ps-ico">🔥</div><div className="ps-v">{pet.streak}</div><div className="ps-l">STREAK</div></div>
        </div>
      </div>

      {/* Battle Pass */}
      <BattlePassSection bpassXP={pet.bpassXP} />

      {/* Inventory */}
      {inventory.length > 0 && (
        <InventorySection
          inventory={inventory}
          onUse={(id, name) => {
            useInventoryItem(id)
            showToast(`✅ Använde ${name}!`, 'success')
            audio.coin()
          }}
        />
      )}

      {/* Achievements gallery */}
      <AchievementsGallery unlocked={unlockedAchievements} pinned={pinnedAchievements} onTogglePin={togglePin} />

      {/* Pet avatar picker */}
      <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="card" style={{ padding: 16 }}>
          <div className="sh-t" style={{ marginBottom: 12 }}>VÄLJ HUSDJUR</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
            {PET_EMOJIS.map(e => (
              <button
                key={e}
                style={{
                  background: pet.petEmoji === e ? 'rgba(0,255,136,.15)' : 'rgba(255,255,255,.04)',
                  border: `1px solid ${pet.petEmoji === e ? 'rgba(0,255,136,.5)' : 'rgba(255,255,255,.08)'}`,
                  borderRadius: 12,
                  fontSize: 24,
                  padding: 8,
                  cursor: 'pointer',
                  transition: 'all .15s',
                }}
                onClick={() => setPetEmoji(e)}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Settings */}
        <div className="card" style={{ padding: '0 0 8px' }}>
          <div style={{ padding: '12px 14px 7px', borderBottom: '1px solid var(--line)' }}>
            <div className="sh-t">⚙️ INSTÄLLNINGAR</div>
          </div>
          <SettingToggle label="Ljud" emoji="🔊" value={settings.audioEnabled} onChange={v => { settings.setAudioEnabled(v); audio.click() }} />
          <SettingToggle label="Vibration" emoji="📳" value={settings.hapticEnabled} onChange={settings.setHapticEnabled} />
          <SettingToggle label="Reducerad rörelse" emoji="♿" value={settings.reducedMotion} onChange={settings.setReducedMotion} />
          <div style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 16 }}>🎵</span>
            <span style={{ flex: 1, fontSize: 13, color: 'var(--t2)' }}>Musik</span>
            <input type="range" min={0} max={1} step={0.05} value={settings.musicVolume} style={{ flex: 2 }} onChange={e => settings.setMusicVolume(+e.target.value)} />
            <span style={{ fontSize: 11, color: 'var(--t3)', width: 30, textAlign: 'right' }}>{Math.round(settings.musicVolume * 100)}%</span>
          </div>
          <div style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 16 }}>🔔</span>
            <span style={{ flex: 1, fontSize: 13, color: 'var(--t2)' }}>Ljud</span>
            <input type="range" min={0} max={1} step={0.05} value={settings.sfxVolume} style={{ flex: 2 }} onChange={e => settings.setSfxVolume(+e.target.value)} />
            <span style={{ fontSize: 11, color: 'var(--t3)', width: 30, textAlign: 'right' }}>{Math.round(settings.sfxVolume * 100)}%</span>
          </div>
        </div>

        {/* Share card */}
        <div className="card" style={{ padding: 14 }}>
          <div className="sh-t" style={{ marginBottom: 10 }}>🔗 DELA & EXPORTERA</div>
          <button
            className="btn btn-sm"
            style={{ width: '100%', marginBottom: 8 }}
            onClick={() => {
              const text = `🐾 Kolla mitt husdjur ${pet.petEmoji} ${pet.petName}!\n` +
                `📊 LV${pet.level} · ${pet.streak}🔥 Streak · ${pet.totalTaps} pek\n` +
                `⚔️ ${pet.battleWins} segrar · 🎣 ${pet.fishCaught} fiskar\n` +
                `Spela PetPet 2026 → ladda ner appen!`
              if (navigator.share) {
                navigator.share({ title: `${pet.petName} på PetPet`, text })
              } else {
                navigator.clipboard.writeText(text).then(() => showToast('📋 Kopierat!', 'success'))
              }
            }}
          >
            🔗 Dela profil
          </button>
        </div>

        {/* Dev card */}
        <div className="card" style={{ padding: 14 }}>
          <div className="sh-t" style={{ marginBottom: 12 }}>🧪 DEV</div>
          <button className="btn btn-sm" style={{ width: '100%' }} onClick={() => { gainXP(500); audio.achievement() }}>
            +500 XP (test)
          </button>
        </div>
      </div>

      <div className="vend" />
    </>
  )
})

import type { InventoryItem } from '@/types/game'

const InventorySection = memo(function InventorySection({
  inventory, onUse,
}: { inventory: InventoryItem[]; onUse: (id: string, name: string) => void }) {
  const RARITY_CLR: Record<string, string> = { common: '#aaa', rare: '#4488ff', epic: '#aa66ff', legendary: '#ffcc00' }
  return (
    <div style={{ margin: '10px 0 4px' }}>
      <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--t3)', letterSpacing: 1, marginBottom: 7 }}>🎒 RYGGSÄCK ({inventory.length})</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {inventory.map(item => (
          <button
            key={item.id}
            style={{
              background: 'rgba(255,255,255,.04)',
              border: `1px solid ${RARITY_CLR[item.rarity]}44`,
              borderRadius: 12,
              padding: '10px 8px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              transition: 'all .15s',
            }}
            onClick={() => onUse(item.id, item.name)}
          >
            <div style={{ fontSize: 24 }}>{item.emoji}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: RARITY_CLR[item.rarity] }}>{item.name}</div>
            <div style={{ fontSize: 9, color: 'var(--t3)' }}>×{item.quantity}</div>
          </button>
        ))}
      </div>
    </div>
  )
})

const RARITY_COLORS: Record<string, string> = {
  common: 'rgba(255,255,255,.08)',
  uncommon: 'rgba(0,255,136,.12)',
  rare: 'rgba(68,136,255,.15)',
  epic: 'rgba(170,102,255,.2)',
  legendary: 'rgba(255,204,0,.2)',
}
const RARITY_BORDER: Record<string, string> = {
  common: 'rgba(255,255,255,.1)',
  uncommon: 'rgba(0,255,136,.3)',
  rare: 'rgba(68,136,255,.35)',
  epic: 'rgba(170,102,255,.4)',
  legendary: 'rgba(255,204,0,.5)',
}

const RARITY_LABEL: Record<string, string> = {
  common: 'Vanlig', uncommon: 'Ovanlig', rare: 'Sällsynt', epic: 'Episk', legendary: 'LEGENDARY'
}
const RARITY_GLOW: Record<string, string> = {
  common: 'none',
  uncommon: '0 0 12px rgba(0,255,136,.3)',
  rare: '0 0 14px rgba(68,136,255,.4)',
  epic: '0 0 16px rgba(170,102,255,.5)',
  legendary: '0 0 20px rgba(255,204,0,.6)',
}

const PinnedAchievementsSection = memo(function PinnedAchievementsSection({
  pinnedIds, unlocked,
}: { pinnedIds: string[]; unlocked: string[] }) {
  const pinned = pinnedIds.map(id => ALL_ACHIEVEMENTS.find(a => a.id === id)).filter(Boolean) as typeof ALL_ACHIEVEMENTS

  return (
    <div style={{ margin: '10px 0 4px' }}>
      <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--t3)', letterSpacing: 1, marginBottom: 7 }}>
        📌 UTVALDA PRESTATIONER
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {Array.from({ length: 3 }).map((_, i) => {
          const a = pinned[i]
          const isUnlocked = a ? unlocked.includes(a.id) : false
          if (!a) {
            return (
              <div
                key={i}
                style={{
                  background: 'rgba(255,255,255,.02)',
                  border: '1px dashed rgba(255,255,255,.1)',
                  borderRadius: 14,
                  padding: '12px 8px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  minHeight: 80,
                  justifyContent: 'center',
                }}
              >
                <div style={{ fontSize: 20, opacity: 0.2 }}>📌</div>
                <div style={{ fontSize: 9, color: 'var(--t3)' }}>Tom slot</div>
              </div>
            )
          }
          return (
            <div
              key={a.id}
              style={{
                background: isUnlocked ? RARITY_COLORS[a.rarity] : 'rgba(255,255,255,.03)',
                border: `1px solid ${isUnlocked ? RARITY_BORDER[a.rarity] : 'rgba(255,255,255,.06)'}`,
                boxShadow: isUnlocked ? RARITY_GLOW[a.rarity] : 'none',
                borderRadius: 14,
                padding: '12px 8px',
                textAlign: 'center',
                opacity: isUnlocked ? 1 : 0.4,
                filter: isUnlocked ? 'none' : 'grayscale(1)',
                transition: 'all .2s',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
              }}
            >
              <div style={{ fontSize: 26, lineHeight: 1 }}>{a.emoji}</div>
              <div style={{ fontSize: 9, fontWeight: 900, color: isUnlocked ? '#fff' : 'var(--t2)', lineHeight: 1.2 }}>{a.title}</div>
              <div style={{ fontSize: 8, color: RARITY_BORDER[a.rarity], fontWeight: 700 }}>{RARITY_LABEL[a.rarity]}</div>
            </div>
          )
        })}
      </div>
      {pinned.length === 0 && (
        <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 6, textAlign: 'center' }}>
          Tryck 📌 på en prestation nedan för att visa den här
        </div>
      )}
    </div>
  )
})

const AchievementsGallery = memo(function AchievementsGallery({
  unlocked, pinned, onTogglePin,
}: { unlocked: string[]; pinned: string[]; onTogglePin: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false)
  const displayed = expanded ? ALL_ACHIEVEMENTS : ALL_ACHIEVEMENTS.slice(0, 8)

  return (
    <div style={{ margin: '12px 0 4px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--t3)', letterSpacing: 1 }}>
          🏆 PRESTATIONER ({unlocked.length}/{ALL_ACHIEVEMENTS.length})
        </div>
        <button
          style={{ fontSize: 11, color: 'var(--green)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}
          onClick={() => setExpanded(e => !e)}
        >
          {expanded ? 'Visa mindre' : 'Visa alla'}
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 7 }}>
        {displayed.map(a => {
          const isUnlocked = unlocked.includes(a.id)
          const isPinned = pinned.includes(a.id)
          return (
            <div
              key={a.id}
              title={`${a.title}: ${a.description}`}
              style={{
                background: isUnlocked ? RARITY_COLORS[a.rarity] : 'rgba(255,255,255,.03)',
                border: `1px solid ${isUnlocked ? RARITY_BORDER[a.rarity] : 'rgba(255,255,255,.06)'}`,
                borderRadius: 12,
                padding: '10px 6px 6px',
                textAlign: 'center',
                opacity: isUnlocked ? 1 : 0.35,
                filter: isUnlocked ? 'none' : 'grayscale(1)',
                transition: 'all .2s',
                position: 'relative',
              }}
            >
              {isUnlocked && (
                <button
                  style={{
                    position: 'absolute', top: 3, right: 3,
                    background: isPinned ? 'rgba(255,204,0,.25)' : 'rgba(255,255,255,.06)',
                    border: `1px solid ${isPinned ? 'rgba(255,204,0,.5)' : 'rgba(255,255,255,.1)'}`,
                    borderRadius: 6, width: 18, height: 18,
                    fontSize: 9, cursor: 'pointer', lineHeight: 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                  onClick={e => { e.stopPropagation(); onTogglePin(a.id) }}
                  title={isPinned ? 'Ta bort pin' : 'Fäst på profil'}
                >
                  📌
                </button>
              )}
              <div style={{ fontSize: 22, lineHeight: 1 }}>{a.emoji}</div>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--t2)', marginTop: 4, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
})

const ActivityHeatmap = memo(function ActivityHeatmap({ activityLog }: { activityLog: Record<string, number> }) {
  const days: { key: string; count: number; level: number; isToday: boolean }[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    const count = activityLog[key] ?? 0
    const level = count === 0 ? 0 : count < 5 ? 1 : count < 15 ? 2 : count < 30 ? 3 : 4
    days.push({ key, count, level, isToday: i === 0 })
  }

  const totalTaps = Object.values(activityLog).reduce((s, v) => s + v, 0)
  const activeDays = Object.values(activityLog).filter(v => v > 0).length
  const maxDay = Math.max(...Object.values(activityLog), 0)

  return (
    <div style={{ margin: '10px 0 4px' }}>
      <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--t3)', letterSpacing: 1, marginBottom: 7 }}>📅 30 DAGARS AKTIVITET</div>
      <div className="ahm-grid">
        {days.map(d => (
          <div
            key={d.key}
            className={`ahm-day l${d.level}${d.isToday ? ' today' : ''}`}
            title={`${d.key}: ${d.count} pek`}
          />
        ))}
      </div>
      <div className="ahm-stats-row">
        <div><div className="ahm-sval">{totalTaps}</div><div className="ahm-slbl">Totalt</div></div>
        <div><div className="ahm-sval">{activeDays}</div><div className="ahm-slbl">Aktiva dagar</div></div>
        <div><div className="ahm-sval">{maxDay}</div><div className="ahm-slbl">Rekorddag</div></div>
      </div>
      <div className="ahm-legend">
        <span style={{ fontSize: 9, color: 'var(--t3)' }}>Lite</span>
        {[0,1,2,3,4].map(l => <span key={l} className={`ahm-day l${l}`} style={{ display: 'inline-block' }} />)}
        <span style={{ fontSize: 9, color: 'var(--t3)' }}>Mycket</span>
      </div>
    </div>
  )
})

const BPASS_TIERS = [
  { xp: 100,  freeLabel: '🪙50',    premLabel: '💎2'   },
  { xp: 200,  freeLabel: '🪙100',   premLabel: '🪙150' },
  { xp: 300,  freeLabel: '⭐100XP', premLabel: '💎5'   },
  { xp: 400,  freeLabel: '🪙150',   premLabel: '🪙250' },
  { xp: 500,  freeLabel: '🍖Mat×3', premLabel: '🎩Hatt' },
  { xp: 600,  freeLabel: '🪙200',   premLabel: '💎10'  },
  { xp: 700,  freeLabel: '⭐300XP', premLabel: '🪙400' },
  { xp: 800,  freeLabel: '💎3',     premLabel: '✨Aura' },
  { xp: 900,  freeLabel: '🪙300',   premLabel: '💎15'  },
  { xp: 1000, freeLabel: '👑Krona', premLabel: '🌌Galaxy' },
]
const SEASON_MAX = 1000

const BattlePassSection = memo(function BattlePassSection({ bpassXP }: { bpassXP: number }) {
  const pct = Math.min(100, (bpassXP / SEASON_MAX) * 100)
  return (
    <div style={{ padding: '0 16px 8px' }}>
      <div className="card" style={{ padding: '14px 14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div>
            <div className="sh-t">🎫 SÄSONGSPASS S1</div>
            <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 2 }}>Rise of the Dragon</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--ff-head)', fontSize: 14, fontWeight: 900, color: 'var(--purple)' }}>{bpassXP}<span style={{ fontSize: 10, color: 'var(--t3)' }}>/{SEASON_MAX} BP</span></div>
          </div>
        </div>
        {/* Progress bar */}
        <div style={{ background: 'rgba(255,255,255,.06)', borderRadius: 8, height: 8, overflow: 'hidden', marginBottom: 12 }}>
          <div style={{
            height: '100%',
            width: `${pct}%`,
            background: 'linear-gradient(90deg, var(--purple), var(--blue), var(--green))',
            borderRadius: 8,
            transition: 'width .6s',
          }} />
        </div>
        {/* Tier nodes */}
        <div style={{ display: 'flex', gap: 4, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
          {BPASS_TIERS.map(t => {
            const claimed = bpassXP >= t.xp
            return (
              <div
                key={t.xp}
                style={{
                  flex: '0 0 auto',
                  minWidth: 60,
                  background: claimed ? 'rgba(170,102,255,.15)' : 'rgba(255,255,255,.03)',
                  border: `1px solid ${claimed ? 'rgba(170,102,255,.4)' : 'rgba(255,255,255,.06)'}`,
                  borderRadius: 10,
                  padding: '6px 4px',
                  textAlign: 'center',
                  opacity: claimed ? 1 : 0.55,
                }}
              >
                <div style={{ fontSize: 9, color: 'var(--t3)', marginBottom: 3 }}>T{t.xp / 100}</div>
                <div style={{ fontSize: 11, marginBottom: 2 }}>{claimed ? '✅' : '🔒'}</div>
                <div style={{ fontSize: 8, color: 'var(--green)', lineHeight: 1.2 }}>{t.freeLabel}</div>
                <div style={{ fontSize: 7, color: 'var(--purple)', marginTop: 1 }}>{t.premLabel}</div>
              </div>
            )
          })}
        </div>
        <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 8, textAlign: 'center' }}>
          BP tjänas automatiskt från XP · {Math.max(0, SEASON_MAX - bpassXP)} kvar till S1 max
        </div>
      </div>
    </div>
  )
})

const SettingToggle = memo(function SettingToggle({ label, emoji, value, onChange }: {
  label: string; emoji: string; value: boolean; onChange: (v: boolean) => void
}) {
  return (
    <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--line)' }}>
      <span style={{ fontSize: 16 }}>{emoji}</span>
      <span style={{ flex: 1, fontSize: 13, color: 'var(--t2)' }}>{label}</span>
      <button
        style={{
          width: 44, height: 24,
          borderRadius: 12,
          background: value ? 'var(--green)' : 'rgba(255,255,255,.1)',
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
          transition: 'background .2s',
        }}
        onClick={() => onChange(!value)}
        aria-pressed={value}
      >
        <span style={{
          position: 'absolute',
          top: 3, left: value ? 23 : 3,
          width: 18, height: 18,
          borderRadius: '50%',
          background: '#fff',
          transition: 'left .2s',
        }} />
      </button>
    </div>
  )
})
