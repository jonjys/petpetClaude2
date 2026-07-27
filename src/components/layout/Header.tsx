import { memo, useState } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { useUIStore } from '@/stores/uiStore'
import { formatNumber } from '@/utils/format'

export const Header = memo(function Header() {
  const coins    = useGameStore(s => s.pet.coins)
  const kc       = useGameStore(s => s.pet.kc)
  const streak   = useGameStore(s => s.pet.streak)
  const notifCount  = useUIStore(s => s.notifCount)
  const openPanelId = useUIStore(s => s.openPanelId)
  const setTab      = useUIStore(s => s.setTab)
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="topbar">
      {/* KARMA logo — exact legacy structure: span wraps first letter */}
      <div className="logo" style={{ cursor: 'pointer' }} onClick={() => setTab('pet')}>
        <span>K</span>ARMA
      </div>

      <div className="pills">
        {/* POTT chip */}
        <div className="pott-chip" style={{ cursor: 'pointer' }}>
          <span>💰</span>
          <div>
            <div className="pott-chip-lbl">POTT</div>
            <div className="pott-chip-val" id="pottTopVal">{formatNumber(coins)} kr</div>
          </div>
        </div>

        {streak > 0 && (
          <div className="pill pill-r">🔥<b>{streak}d</b></div>
        )}

        <div className="pill pill-y">⚡<b id="hCoins">{formatNumber(coins)}</b></div>
        <div className="pill" style={{ color: '#00f0ff', borderColor: 'rgba(0,240,255,.25)' }}>
          💎<b id="hKC">{formatNumber(kc)} KC</b>
        </div>
      </div>

      {/* Radio/music button */}
      <div className="radio-btn">♪</div>

      {/* Notification bell */}
      <div className="notif-wrap">
        <div className="notif-btn" onClick={() => openPanelId('notifications')}>🔔</div>
        {notifCount > 0 && (
          <div className="notif-badge">{notifCount > 9 ? '9+' : notifCount}</div>
        )}
      </div>

      {/* Hamburger menu */}
      <div className="menu-wrap">
        <div className={`ham${menuOpen ? ' open' : ''}`} onClick={() => setMenuOpen(o => !o)}>
          <span /><span /><span />
        </div>
        <div className={`dd${menuOpen ? ' open' : ''}`}>
          <div className="dd-head">
            <div className="dd-nm">KARMA</div>
            <div className="dd-sb">Meny</div>
          </div>
          <div className="dd-sec">
            <div className="ddr" onClick={() => { setTab('pet'); setMenuOpen(false) }}>
              <span className="ddr-i">🐾</span>Pet
            </div>
            <div className="ddr" onClick={() => { setTab('flash'); setMenuOpen(false) }}>
              <span className="ddr-i">⚡</span>Flash
            </div>
            <div className="ddr" onClick={() => { setTab('games'); setMenuOpen(false) }}>
              <span className="ddr-i">🎮</span>Games
            </div>
            <div className="ddr" onClick={() => { setTab('profile'); setMenuOpen(false) }}>
              <span className="ddr-i">👤</span>Profil
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})
