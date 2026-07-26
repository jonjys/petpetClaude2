import { memo, useCallback, useRef, useEffect, useState } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { useUIStore } from '@/stores/uiStore'
import { useGame } from '@/hooks/useGame'
import { formatNumber, formatAge } from '@/utils/format'
import { audio } from '@/services/AudioService'
import { ALL_ACHIEVEMENTS } from '@/constants/config'
import styles from './PetView.module.css'

export const PetView = memo(function PetView() {
  const pet = useGameStore(s => s.pet)
  const levelUpPending = useGameStore(s => s.levelUpPending)
  const clearLevelUp = useGameStore(s => s.clearLevelUp)
  const dailyMissions = useGameStore(s => s.dailyMissions)
  const claimMission = useGameStore(s => s.claimMission)
  const careAction = useGameStore(s => s.careAction)
  const newAchievement = useGameStore(s => s.newAchievement)
  const clearNewAchievement = useGameStore(s => s.clearNewAchievement)
  const unlockedAchievements = useGameStore(s => s.unlockedAchievements)
  const { tapPet, awardXP } = useGame()
  const triggerConfetti = useUIStore(s => s.triggerConfetti)
  const showToast = useUIStore(s => s.showToast)
  const pushNotif = useUIStore(s => s.pushNotif)
  const petRef = useRef<HTMLDivElement>(null)
  const rippleContainer = useRef<HTMLDivElement>(null)
  const [careAnim, setCareAnim] = useState<string | null>(null)

  useEffect(() => {
    if (levelUpPending) {
      triggerConfetti()
      pushNotif('⭐', `Level up! Ditt husdjur är nu nivå ${pet.level}!`)
      clearLevelUp()
    }
  }, [levelUpPending, triggerConfetti, clearLevelUp, pet.level, pushNotif])

  useEffect(() => {
    if (newAchievement) {
      const ach = ALL_ACHIEVEMENTS.find(a => a.id === newAchievement)
      if (ach) {
        showToast(`🏆 Prestation: ${ach.title}!`, 'success')
        triggerConfetti()
        pushNotif('🏆', `Prestation upplåst: ${ach.title}!`)
        audio.achievement()
      }
      clearNewAchievement()
    }
  }, [newAchievement, clearNewAchievement, showToast, triggerConfetti, pushNotif])

  const handleTap = useCallback((e: React.PointerEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    tapPet(e.clientX, rect.top)
    if (rippleContainer.current) {
      const rip = document.createElement('div')
      rip.className = styles.ripple
      rip.style.left = `${e.clientX - rect.left}px`
      rip.style.top = `${e.clientY - rect.top}px`
      rippleContainer.current.appendChild(rip)
      setTimeout(() => rip.remove(), 700)
    }
    if (petRef.current) {
      petRef.current.classList.remove(styles.bounce)
      void petRef.current.offsetWidth
      petRef.current.classList.add(styles.bounce)
    }
  }, [tapPet])

  const handleCare = useCallback((type: 'feed' | 'train' | 'sleep' | 'play') => {
    careAction(type)
    setCareAnim(type)
    audio.tap()
    const labels = { feed: '🍖 +Mat!', train: '🏋️ +XP!', sleep: '😴 +Energi!', play: '🎮 +Humör!' }
    showToast(labels[type], 'success')
    setTimeout(() => setCareAnim(null), 600)
  }, [careAction, showToast])

  const xpPct = Math.min(100, (pet.exp / pet.expNext) * 100)
  const today = new Date().toDateString()
  const dailyClaimed = localStorage.getItem('k0509_dailyBonus') === today

  const achCount = unlockedAchievements.length
  const achTotal = ALL_ACHIEVEMENTS.length

  return (
    <div className={styles.root}>
      {/* Stats row */}
      <div className={styles.statsRow}>
        <StatBar icon="😊" value={pet.mood} color="var(--col-accent2)" label="Humör" />
        <StatBar icon="🍖" value={pet.hunger} color="#fb923c" label="Mat" />
        <StatBar icon="⚡" value={pet.energy} color="var(--col-green)" label="Energi" />
      </div>

      {/* Level + XP */}
      <div className={styles.levelRow}>
        <span className={styles.levelBadge}>LV{pet.level}</span>
        <div className={styles.xpBarTrack}>
          <div className={styles.xpFill} style={{ width: `${xpPct}%` }} />
        </div>
        <span className={styles.xpText}>{formatNumber(pet.exp)}/{formatNumber(pet.expNext)}</span>
      </div>

      {/* Pet tap area */}
      <div className={styles.tapArea} onPointerDown={handleTap} ref={rippleContainer}>
        <div ref={petRef} className={styles.petEmoji}>{pet.petEmoji}</div>
        <div className={styles.petName}>{pet.petName}</div>
        <div className={styles.tapHint}>Tryck för att peta!</div>
      </div>

      {/* Care grid */}
      <div className={styles.careGrid}>
        <CareBtn emoji="🍖" label="MATA" sub="-10🪙" anim={careAnim === 'feed'} onClick={() => handleCare('feed')} />
        <CareBtn emoji="🏋️" label="TRÄNA" sub="-5🪙" anim={careAnim === 'train'} onClick={() => handleCare('train')} />
        <CareBtn emoji="😴" label="SOVA" sub="GRATIS" anim={careAnim === 'sleep'} onClick={() => handleCare('sleep')} />
        <CareBtn emoji="🎮" label="LEK" sub="-8🪙" anim={careAnim === 'play'} onClick={() => handleCare('play')} />
      </div>

      {/* Daily missions */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>📋 Dagliga Uppdrag</div>
        {dailyMissions.map(m => {
          const pct = Math.min(100, (m.progress / m.target) * 100)
          const ready = m.progress >= m.target && !m.done
          return (
            <div key={m.id} className={`${styles.mission} ${m.done ? styles.missionDone : ''}`}>
              <span className={styles.missionEmoji}>{m.emoji}</span>
              <div className={styles.missionInfo}>
                <span className={styles.missionLabel}>{m.label}</span>
                <div className={styles.missionBar}>
                  <div className={styles.missionFill} style={{ width: `${pct}%` }} />
                </div>
                <span className={styles.missionProg}>{m.progress}/{m.target}</span>
              </div>
              {m.done ? (
                <span className={styles.missionCheck}>✅</span>
              ) : ready ? (
                <button className={`btn-gold ${styles.claimBtn}`} onClick={() => { claimMission(m.id); audio.coin() }}>
                  Hämta!
                </button>
              ) : (
                <span className={styles.missionReward}>🪙{m.reward.coins}</span>
              )}
            </div>
          )
        })}
      </div>

      {/* Quick stats */}
      <div className={styles.quickStats}>
        <QuickStat emoji="👆" label="Pek" value={formatNumber(pet.totalTaps)} />
        <QuickStat emoji="🪙" label="Mynt" value={formatNumber(pet.coins)} />
        <QuickStat emoji="✨" label="KC" value={formatNumber(pet.kc)} />
        <QuickStat emoji="🎂" label="Ålder" value={formatAge(pet.createdAt)} />
        <QuickStat emoji="🔥" label="Streak" value={`${pet.streak}d`} />
        <QuickStat emoji="⚔️" label="Segrar" value={formatNumber(pet.battleWins)} />
        <QuickStat emoji="🎣" label="Fisk" value={formatNumber(pet.fishCaught)} />
        <QuickStat emoji="🏆" label="Prestationer" value={`${achCount}/${achTotal}`} />
      </div>

      {/* Daily bonus */}
      {!dailyClaimed && (
        <button
          className={`btn-primary ${styles.dailyBtn}`}
          onClick={() => {
            localStorage.setItem('k0509_dailyBonus', today)
            awardXP(200, 'daily')
            audio.achievement()
            showToast('🎁 +200 XP daglig bonus!', 'success')
          }}
        >
          🎁 Daglig bonus — klicka för att hämta!
        </button>
      )}
    </div>
  )
})

const StatBar = memo(function StatBar({ icon, value, color, label }: { icon: string; value: number; color: string; label: string }) {
  return (
    <div className={styles.statBar}>
      <span className={styles.statIcon}>{icon}</span>
      <div className={styles.statTrack} style={{ flex: 1 }}>
        <div className={styles.statFill} style={{ width: `${value}%`, background: color }} />
      </div>
      <span className={styles.statVal}>{Math.round(value)}</span>
    </div>
  )
})

const CareBtn = memo(function CareBtn({ emoji, label, sub, anim, onClick }: { emoji: string; label: string; sub: string; anim: boolean; onClick: () => void }) {
  return (
    <button className={`${styles.careBtn} ${anim ? styles.careBtnAnim : ''}`} onClick={onClick}>
      <span className={styles.careBtnEmoji}>{emoji}</span>
      <span className={styles.careBtnLabel}>{label}</span>
      <span className={styles.careBtnSub}>{sub}</span>
    </button>
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
