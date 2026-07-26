import { memo, useCallback, useRef, useEffect } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { useUIStore } from '@/stores/uiStore'
import { useGame } from '@/hooks/useGame'
import { formatNumber, formatAge } from '@/utils/format'
import { audio } from '@/services/AudioService'
import styles from './PetView.module.css'

export const PetView = memo(function PetView() {
  const pet = useGameStore(s => s.pet)
  const levelUpPending = useGameStore(s => s.levelUpPending)
  const clearLevelUp = useGameStore(s => s.clearLevelUp)
  const { tapPet, awardXP } = useGame()
  const triggerConfetti = useUIStore(s => s.triggerConfetti)
  const petRef = useRef<HTMLDivElement>(null)
  const rippleContainer = useRef<HTMLDivElement>(null)

  // Level-up visual
  useEffect(() => {
    if (levelUpPending) {
      triggerConfetti()
      clearLevelUp()
    }
  }, [levelUpPending, triggerConfetti, clearLevelUp])

  const handleTap = useCallback((e: React.PointerEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const x = e.clientX
    const y = rect.top

    tapPet(x, y)

    // Ripple
    if (rippleContainer.current) {
      const rip = document.createElement('div')
      rip.className = styles.ripple
      rip.style.left = `${e.clientX - rect.left}px`
      rip.style.top = `${e.clientY - rect.top}px`
      rippleContainer.current.appendChild(rip)
      setTimeout(() => rip.remove(), 700)
    }

    // Pet bounce
    if (petRef.current) {
      petRef.current.classList.remove(styles.bounce)
      void petRef.current.offsetWidth
      petRef.current.classList.add(styles.bounce)
    }
  }, [tapPet])

  const xpPct = Math.min(100, (pet.exp / pet.expNext) * 100)

  return (
    <div className={styles.root}>
      {/* Stats bar */}
      <div className={styles.statsRow}>
        <StatBar icon="😊" value={pet.mood} color="var(--col-accent2)" label="Humör" />
        <StatBar icon="🍖" value={pet.hunger} color="#fb923c" label="Mat" />
        <StatBar icon="⚡" value={pet.energy} color="var(--col-green)" label="Energi" />
      </div>

      {/* Level + XP */}
      <div className={styles.levelRow}>
        <span className={styles.levelBadge}>LV{pet.level}</span>
        <div className={styles.xpBarTrack}>
          <div className={`stat-bar-fill xp-bar-fill ${styles.xpFill}`} style={{ width: `${xpPct}%` }} />
        </div>
        <span className={styles.xpText}>{formatNumber(pet.exp)}/{formatNumber(pet.expNext)}</span>
      </div>

      {/* Pet tap area */}
      <div className={styles.tapArea} onPointerDown={handleTap} ref={rippleContainer}>
        <div ref={petRef} className={styles.petEmoji}>{pet.petEmoji}</div>
        <div className={styles.petName}>{pet.petName}</div>
        <div className={styles.tapHint}>Tryck för att peta!</div>
      </div>

      {/* Quick stats */}
      <div className={styles.quickStats}>
        <QuickStat emoji="👆" label="Pek" value={formatNumber(pet.totalTaps)} />
        <QuickStat emoji="🪙" label="Mynt" value={formatNumber(pet.coins)} />
        <QuickStat emoji="✨" label="KC" value={formatNumber(pet.kc)} />
        <QuickStat emoji="🎂" label="Ålder" value={formatAge(pet.createdAt)} />
      </div>

      {/* Daily bonus button */}
      <DailyBonus onClaim={() => {
        awardXP(200, 'daily')
        audio.achievement()
      }} />
    </div>
  )
})

// ── Sub-components ────────────────────────────────────────────────────────────

const StatBar = memo(function StatBar({
  icon, value, color, label
}: { icon: string; value: number; color: string; label: string }) {
  return (
    <div className={styles.statBar}>
      <span className={styles.statIcon}>{icon}</span>
      <div className="stat-bar-track" style={{ flex: 1 }}>
        <div className="stat-bar-fill" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className={styles.statVal}>{Math.round(value)}</span>
    </div>
  )
})

const QuickStat = memo(function QuickStat({ emoji, label, value }: { emoji: string; label: string; value: string }) {
  return (
    <div className={styles.quickStat}>
      <span className={styles.qsEmoji}>{emoji}</span>
      <span className={styles.qsVal}>{value}</span>
      <span className={styles.qsLabel}>{label}</span>
    </div>
  )
})

const DAILY_KEY = 'k0509_dailyBonus'

function DailyBonus({ onClaim }: { onClaim: () => void }) {
  const today = new Date().toDateString()
  const claimed = localStorage.getItem(DAILY_KEY) === today

  if (claimed) return null

  return (
    <button
      className={`btn-primary ${styles.dailyBtn}`}
      onClick={() => {
        localStorage.setItem(DAILY_KEY, today)
        onClaim()
      }}
    >
      🎁 Daglig bonus — klicka för att hämta!
    </button>
  )
}
