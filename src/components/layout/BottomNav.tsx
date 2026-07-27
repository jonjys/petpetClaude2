import { memo } from 'react'
import { useUIStore } from '@/stores/uiStore'
import { useGameStore } from '@/stores/gameStore'

export const BottomNav = memo(function BottomNav() {
  const activeTab = useUIStore(s => s.activeTab)
  const setTab = useUIStore(s => s.setTab)
  const dailyMissions = useGameStore(s => s.dailyMissions)

  const missionsDue = dailyMissions.filter(m => !m.done && m.progress >= m.target).length
  const missionsComplete = dailyMissions.filter(m => m.done).length !== dailyMissions.length
  const notifCount = useUIStore(s => s.notifCount)

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
      <button className="nb-center" onClick={() => setTab('create')}>
        <div className="nb-center-ico">✚</div>
        <div className="nl" style={{ color: 'var(--pink)' }}>Skapa</div>
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
