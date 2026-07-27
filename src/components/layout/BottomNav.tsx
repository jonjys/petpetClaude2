import { memo } from 'react'
import { useUIStore } from '@/stores/uiStore'

export const BottomNav = memo(function BottomNav() {
  const activeTab = useUIStore(s => s.activeTab)
  const setTab = useUIStore(s => s.setTab)

  return (
    <div className="bnav">
      <button className={`nb${activeTab === 'pet' ? ' on' : ''}`} data-v="pet" onClick={() => setTab('pet')}>
        <div className="ni">🐾</div>
        <div className="nl">Pet</div>
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
      <button className={`nb${activeTab === 'profile' ? ' on' : ''}`} data-v="profile" onClick={() => setTab('profile')}>
        <div className="ni">👤</div>
        <div className="nl">Profil</div>
      </button>
    </div>
  )
})
