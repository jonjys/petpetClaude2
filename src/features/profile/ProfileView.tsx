import { memo, useState } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { formatNumber, formatAge } from '@/utils/format'
import { audio } from '@/services/AudioService'

const PET_EMOJIS = ['🐱', '🐶', '🦊', '🐻', '🐼', '🐨', '🦁', '🐯', '🐸', '🐙', '🦄', '🐲']

export const ProfileView = memo(function ProfileView() {
  const pet = useGameStore(s => s.pet)
  const gainXP = useGameStore(s => s.gainXP)
  const settings = useSettingsStore()

  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState(pet.petName)

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
