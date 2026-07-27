import { memo } from 'react'
import { useUIStore } from '@/stores/uiStore'
import { useGameStore } from '@/stores/gameStore'

const BP_TIERS_XP = [100, 300, 600, 1000, 2000]

function getCreateBadge(bpassXP: number): number {
  const expId = localStorage.getItem('k0509_activeExp')
  const expEnd = Number(localStorage.getItem('k0509_expEnd') ?? 0)
  const expReady = !!expId && Date.now() >= expEnd && expEnd > 0

  const claimed: number[] = (() => { try { return JSON.parse(localStorage.getItem('k0509_bp_claimed') ?? '[]') } catch { return [] } })()
  const bpClaimable = BP_TIERS_XP.filter((xp, i) => bpassXP >= xp && !claimed.includes(i)).length

  return (expReady ? 1 : 0) + bpClaimable
}

export const BottomNav = memo(function BottomNav() {
  const activeTab = useUIStore(s => s.activeTab)
  const setTab = useUIStore(s => s.setTab)
  const dailyMissions = useGameStore(s => s.dailyMissions)
  const bpassXP = useGameStore(s => s.pet.bpassXP)

  const missionsDue = dailyMissions.filter(m => !m.done && m.progress >= m.target).length
  const missionsComplete = dailyMissions.filter(m => m.done).length !== dailyMissions.length
  const notifCount = useUIStore(s => s.notifCount)
  const createBadge = getCreateBadge(bpassXP)

  return (
    <div className="bnav">
      <button className={`nb${activeTab === 'pet' ? ' on' : ''}`} data-v="pet" onClick={() => setTab('pet')} style={{ position: 'relative' }}>
        <div className="ni">🐾</div>
        <div className="nl">Pet</div>
        {missionsDue > 0 && (
          <div style={{ position: 'absolute', top: 6, right: 10, width: 14, height: 14, background: 'var(--gold)', borderRadius: '50%', fontSize: 9, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000' }}>
            {missionsDue}
          </div>
        )}
      </button>
      <button className={`nb${activeTab === 'flash' ? ' on' : ''}`} data-v="flash" onClick={() => setTab('flash')}>
        <div className="ni">⚡</div>
        <div className="nl">Flash</div>
      </button>
      <button className="nb-center" style={{ position: 'relative' }} onClick={() => setTab('create')}>
        <div className="nb-center-ico">✚</div>
        <div className="nl" style={{ color: 'var(--pink)' }}>Skapa</div>
        {createBadge > 0 && (
          <div style={{
            position: 'absolute', top: 2, right: 10, minWidth: 16, height: 16,
            background: 'var(--green)', borderRadius: 8, fontSize: 9, fontWeight: 900,
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000',
            padding: '0 3px', border: '1.5px solid #000',
          }}>
            {createBadge}
          </div>
        )}
      </button>
      <button className={`nb${activeTab === 'games' ? ' on' : ''}`} data-v="games" onClick={() => setTab('games')}>
        <div className="ni">🎮</div>
        <div className="nl">Games</div>
      </button>
      <button className={`nb${activeTab === 'profile' ? ' on' : ''}`} data-v="profile" onClick={() => setTab('profile')} style={{ position: 'relative' }}>
        <div className="ni">👤</div>
        <div className="nl">Profil</div>
        {notifCount > 0 && (
          <div style={{ position: 'absolute', top: 6, right: 8, width: 14, height: 14, background: 'var(--red)', borderRadius: '50%', fontSize: 8, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            {notifCount > 9 ? '9+' : notifCount}
          </div>
        )}
        {!notifCount && missionsComplete && dailyMissions.length > 0 && dailyMissions.every(m => m.done) && (
          <div style={{ position: 'absolute', top: 6, right: 10, width: 8, height: 8, background: 'var(--green)', borderRadius: '50%' }} />
        )}
      </button>
    </div>
  )
})
