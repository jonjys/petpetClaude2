import { memo, useState } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { formatNumber, formatAge } from '@/utils/format'
import { audio } from '@/services/AudioService'
import styles from './ProfileView.module.css'

const PET_EMOJIS = ['🐱', '🐶', '🦊', '🐻', '🐼', '🐨', '🦁', '🐯', '🐸', '🐙', '🦄', '🐲']

export const ProfileView = memo(function ProfileView() {
  const pet = useGameStore(s => s.pet)
  const gainXP = useGameStore(s => s.gainXP)
  const settings = useSettingsStore()

  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState(pet.petName)

  const saveName = () => {
    if (nameInput.trim()) {
      useGameStore.setState(s => ({
        pet: { ...s.pet, petName: nameInput.trim() }
      }))
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
    <div className={styles.root}>
      {/* Pet identity card */}
      <div className={styles.card}>
        <div className={styles.emojiRow}>
          {PET_EMOJIS.map(e => (
            <button
              key={e}
              className={`${styles.emojiBtn} ${pet.petEmoji === e ? styles.active : ''}`}
              onClick={() => setPetEmoji(e)}
            >
              {e}
            </button>
          ))}
        </div>
        <div className={styles.currentPet}>{pet.petEmoji}</div>
        {editingName ? (
          <div className={styles.nameEdit}>
            <input
              className={styles.nameInput}
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') saveName() }}
              autoFocus
              maxLength={20}
            />
            <button className="btn-primary" onClick={saveName}>Spara</button>
          </div>
        ) : (
          <button className={styles.petNameBtn} onClick={() => setEditingName(true)}>
            {pet.petName} ✏️
          </button>
        )}
        <div className={styles.petAge}>Ålder: {formatAge(pet.createdAt)}</div>
      </div>

      {/* Stats overview */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>📊 Statistik</div>
        <div className={styles.statsGrid}>
          <StatItem label="Nivå" value={`${pet.level}`} emoji="⭐" />
          <StatItem label="Totala pek" value={formatNumber(pet.totalTaps)} emoji="👆" />
          <StatItem label="Mynt" value={formatNumber(pet.coins)} emoji="🪙" />
          <StatItem label="KC" value={formatNumber(pet.kc)} emoji="✨" />
          <StatItem label="XP" value={formatNumber(pet.exp)} emoji="💡" />
          <StatItem label="Nästa nivå" value={formatNumber(pet.expNext)} emoji="🎯" />
        </div>
      </div>

      {/* Settings */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>⚙️ Inställningar</div>

        <Toggle
          label="Ljud"
          emoji="🔊"
          value={settings.audioEnabled}
          onChange={v => { settings.setAudioEnabled(v); audio.click() }}
        />
        <Toggle
          label="Vibration"
          emoji="📳"
          value={settings.hapticEnabled}
          onChange={settings.setHapticEnabled}
        />
        <Toggle
          label="Reducerad rörelse"
          emoji="♿"
          value={settings.reducedMotion}
          onChange={settings.setReducedMotion}
        />

        <div className={styles.sliderRow}>
          <span className={styles.sliderLabel}>🎵 Musik</span>
          <input
            type="range" min={0} max={1} step={0.05}
            value={settings.musicVolume}
            className={styles.slider}
            onChange={e => settings.setMusicVolume(+e.target.value)}
          />
          <span className={styles.sliderVal}>{Math.round(settings.musicVolume * 100)}%</span>
        </div>
        <div className={styles.sliderRow}>
          <span className={styles.sliderLabel}>🔔 Ljud</span>
          <input
            type="range" min={0} max={1} step={0.05}
            value={settings.sfxVolume}
            className={styles.slider}
            onChange={e => settings.setSfxVolume(+e.target.value)}
          />
          <span className={styles.sliderVal}>{Math.round(settings.sfxVolume * 100)}%</span>
        </div>
      </div>

      {/* Danger zone */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>🧪 Dev</div>
        <button className="btn-primary" style={{ width: '100%' }}
          onClick={() => { gainXP(500); audio.achievement() }}>
          +500 XP (test)
        </button>
      </div>
    </div>
  )
})

const StatItem = memo(function StatItem({ label, value, emoji }: { label: string; value: string; emoji: string }) {
  return (
    <div className={styles.statItem}>
      <span className={styles.statEmoji}>{emoji}</span>
      <span className={styles.statVal}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  )
})

const Toggle = memo(function Toggle({ label, emoji, value, onChange }: {
  label: string; emoji: string; value: boolean; onChange: (v: boolean) => void
}) {
  return (
    <div className={styles.toggleRow}>
      <span className={styles.toggleEmoji}>{emoji}</span>
      <span className={styles.toggleLabel}>{label}</span>
      <button
        className={`${styles.toggle} ${value ? styles.toggleOn : ''}`}
        onClick={() => onChange(!value)}
        aria-pressed={value}
      >
        <span className={styles.toggleThumb} />
      </button>
    </div>
  )
})
