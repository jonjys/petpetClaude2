import { memo, useEffect, useRef, useState } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { useUIStore } from '@/stores/uiStore'
import { audio } from '@/services/AudioService'
import { formatNumber, formatAge } from '@/utils/format'
import { ALL_ACHIEVEMENTS } from '@/constants/config'
import styles from './PetView.module.css'

export const PetView = memo(function PetView() {
  const pet = useGameStore(s => s.pet)
  const tap = useGameStore(s => s.tap)
  const careAction = useGameStore(s => s.careAction)
  const dailyMissions = useGameStore(s => s.dailyMissions)
  const claimMission = useGameStore(s => s.claimMission)
  const newAchievement = useGameStore(s => s.newAchievement)
  const clearNewAchievement = useGameStore(s => s.clearNewAchievement)
  const checkStreak = useGameStore(s => s.checkStreak)
  const spawnFloat = useUIStore(s => s.spawnFloat)
  const pushNotif = useUIStore(s => s.pushNotif)
  const petRef = useRef<HTMLDivElement>(null)
  const [achieveVisible, setAchieveVisible] = useState(false)
  const newAchievementObj = newAchievement ? ALL_ACHIEVEMENTS.find(a => a.id === newAchievement) ?? null : null

  useEffect(() => { checkStreak() }, [checkStreak])

  useEffect(() => {
    if (!newAchievementObj) return
    setAchieveVisible(true)
    pushNotif('🏆', `Prestation upplåst: ${newAchievementObj?.title}`)
    const t = setTimeout(() => {
      setAchieveVisible(false)
      clearNewAchievement()
    }, 3500)
    return () => clearTimeout(t)
  }, [newAchievementObj, clearNewAchievement, pushNotif])

  const handleTap = (e: React.MouseEvent | React.TouchEvent) => {
    const rect = petRef.current?.getBoundingClientRect()
    if (!rect) return
    const clientX = 'touches' in e ? e.touches[0]?.clientX ?? rect.left + rect.width / 2 : (e as React.MouseEvent).clientX
    const clientY = 'touches' in e ? e.touches[0]?.clientY ?? rect.top + rect.height / 2 : (e as React.MouseEvent).clientY
    tap()
    audio.tap()
    spawnFloat(`+${5}XP`, clientX, clientY, '#00f0ff')
  }

  const xpPct = Math.min(100, (pet.exp / pet.expNext) * 100)

  return (
    <div className={styles.root}>
      {/* Achievement toast */}
      {achieveVisible && newAchievementObj && (
        <div className={styles.achieveToast}>
          <span className={styles.achieveIcon}>{newAchievementObj?.emoji}</span>
          <div>
            <div className={styles.achieveText}>{newAchievementObj?.title}</div>
            <div className={styles.achieveLabel}>Prestation upplåst!</div>
          </div>
        </div>
      )}

      {/* Pet Stage */}
      <div className={styles.stage}>
        <div className={styles.stageBg} />
        <div className={styles.aura} />

        {/* Level badge */}
        <div className={styles.levelBadge}>LV{pet.level}</div>

        {/* XP bar top-right */}
        <div className={styles.xpRow}>
          <span className={styles.xpLabel}>XP {formatNumber(pet.exp)}</span>
          <div className={styles.xpBarWrap}>
            <div className={styles.xpFill} style={{ width: `${xpPct}%` }} />
          </div>
        </div>

        <div className={styles.petWrap}>
          <div
            ref={petRef}
            className={styles.petEmoji}
            onClick={handleTap}
            onTouchStart={handleTap}
          >
            {pet.petEmoji}
          </div>
          <div className={styles.petName}>{pet.petName}</div>
        </div>

        {/* Vitals strip */}
        <div className={styles.vitals}>
          <div className={styles.vitalItem}>
            <div className={styles.vitalLabel}>
              <span className={styles.vitalEmoji}>😊</span>
              <span className={styles.vitalPct}>{Math.round(pet.mood)}%</span>
            </div>
            <div className={styles.vitalBar}>
              <div className={`${styles.vitalFill} ${styles.moodFill}`} style={{ width: `${pet.mood}%` }} />
            </div>
          </div>
          <div className={styles.vitalItem}>
            <div className={styles.vitalLabel}>
              <span className={styles.vitalEmoji}>🍖</span>
              <span className={styles.vitalPct}>{Math.round(pet.hunger)}%</span>
            </div>
            <div className={styles.vitalBar}>
              <div className={`${styles.vitalFill} ${styles.hungerFill}`} style={{ width: `${pet.hunger}%` }} />
            </div>
          </div>
          <div className={styles.vitalItem}>
            <div className={styles.vitalLabel}>
              <span className={styles.vitalEmoji}>⚡</span>
              <span className={styles.vitalPct}>{Math.round(pet.energy)}%</span>
            </div>
            <div className={styles.vitalBar}>
              <div className={`${styles.vitalFill} ${styles.energyFill}`} style={{ width: `${pet.energy}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Care grid */}
      <div className={styles.careHeader}>
        <span className={styles.careTitle}>SKÖTSEL</span>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,.3)', fontFamily: 'var(--ff-head)' }}>
          {formatAge(pet.createdAt)} gammal
        </span>
      </div>
      <div className={styles.careGrid}>
        <button className={`${styles.careBtn} ${styles.careBtnFeed}`} onClick={() => { careAction('feed'); audio.click() }}>
          <span className={styles.careIco}>🍖</span>
          <span className={styles.careLbl}>MATA</span>
        </button>
        <button className={`${styles.careBtn} ${styles.careBtnTrain}`} onClick={() => { careAction('train'); audio.click() }}>
          <span className={styles.careIco}>💪</span>
          <span className={styles.careLbl}>TRÄNA</span>
        </button>
        <button className={`${styles.careBtn} ${styles.careBtnSleep}`} onClick={() => { careAction('sleep'); audio.click() }}>
          <span className={styles.careIco}>😴</span>
          <span className={styles.careLbl}>SOVA</span>
        </button>
        <button className={`${styles.careBtn} ${styles.careBtnPlay}`} onClick={() => { careAction('play'); audio.click() }}>
          <span className={styles.careIco}>🎮</span>
          <span className={styles.careLbl}>LEK</span>
        </button>
      </div>

      {/* Daily missions */}
      {dailyMissions.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>📋 Dagliga Uppdrag</div>
          <div className={styles.missions}>
            {dailyMissions.map(m => (
              <div key={m.id} className={styles.missionItem}>
                <span className={styles.missionEmoji}>{m.emoji}</span>
                <div className={styles.missionBody}>
                  <div className={styles.missionLabel}>{m.label}</div>
                  <div className={styles.missionBar}>
                    <div
                      className={styles.missionFill}
                      style={{ width: `${Math.min(100, (m.progress / m.target) * 100)}%` }}
                    />
                  </div>
                  <div className={styles.missionProgress}>{m.progress}/{m.target}</div>
                </div>
                <button
                  className={styles.claimBtn}
                  disabled={!m.done}
                  onClick={() => { claimMission(m.id); audio.achievement() }}
                >
                  {m.done ? 'HÄMTA' : '🔒'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick stats */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>📊 Statistik</div>
        <div className={styles.statsGrid}>
          <div className={styles.statItem}>
            <span className={styles.statEmoji}>👆</span>
            <span className={styles.statVal}>{formatNumber(pet.totalTaps)}</span>
            <span className={styles.statLbl}>Pek</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statEmoji}>🪙</span>
            <span className={styles.statVal}>{formatNumber(pet.coins)}</span>
            <span className={styles.statLbl}>Mynt</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statEmoji}>💎</span>
            <span className={styles.statVal}>{formatNumber(pet.kc)}</span>
            <span className={styles.statLbl}>KC</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statEmoji}>🔥</span>
            <span className={styles.statVal}>{pet.streak}</span>
            <span className={styles.statLbl}>Streak</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statEmoji}>⚔️</span>
            <span className={styles.statVal}>{pet.battleWins}</span>
            <span className={styles.statLbl}>Segrar</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statEmoji}>🎣</span>
            <span className={styles.statVal}>{pet.fishCaught}</span>
            <span className={styles.statLbl}>Fisk</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statEmoji}>🏃</span>
            <span className={styles.statVal}>{pet.runnerBest}</span>
            <span className={styles.statLbl}>Rekord</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statEmoji}>🏆</span>
            <span className={styles.statVal}>{pet.questsCompleted}</span>
            <span className={styles.statLbl}>Quest</span>
          </div>
        </div>
      </div>
    </div>
  )
})
