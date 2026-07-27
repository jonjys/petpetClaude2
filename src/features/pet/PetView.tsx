import { memo, useEffect, useRef, useState } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { useUIStore } from '@/stores/uiStore'
import { audio } from '@/services/AudioService'
import { formatNumber, formatAge } from '@/utils/format'
import { ALL_ACHIEVEMENTS } from '@/constants/config'

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
    <>
      {/* Achievement overlay */}
      {achieveVisible && newAchievementObj && (
        <div id="achieveOverlay" className="open" onClick={() => { setAchieveVisible(false); clearNewAchievement() }}>
          <div className="ach-big">{newAchievementObj?.emoji}</div>
          <div className="ach-unlocked">✦ Badge Upplåst ✦</div>
          <div className="ach-name">{newAchievementObj?.title}</div>
          <div className="ach-desc">{newAchievementObj?.description ?? 'Prestation upplåst!'}</div>
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
