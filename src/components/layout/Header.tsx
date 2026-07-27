import { memo, useState } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { useUIStore } from '@/stores/uiStore'
import { formatNumber } from '@/utils/format'
import { audio } from '@/services/AudioService'

const SONGS = [
  'Karma Vibes - Lo-Fi Beat',
  'Night Grind - Synthwave',
  'Pixel Flow - Chillhop',
  'Level Up - Electro',
  'Deep Dungeon - Dark Ambient',
  'Sunrise Run - J-Beat',
]

export const Header = memo(function Header() {
  const coins    = useGameStore(s => s.pet.coins)
  const kc       = useGameStore(s => s.pet.kc)
  const streak   = useGameStore(s => s.pet.streak)
  const level    = useGameStore(s => s.pet.level)
  const petName  = useGameStore(s => s.pet.petName)
  const petEmoji = useGameStore(s => s.pet.petEmoji)
  const bpassXP  = useGameStore(s => s.pet.bpassXP)
  const battleWins = useGameStore(s => s.pet.battleWins)
  const fishCaught = useGameStore(s => s.pet.fishCaught)
  const notifCount  = useUIStore(s => s.notifCount)
  const openPanelId = useUIStore(s => s.openPanelId)
  const setTab      = useUIStore(s => s.setTab)
  const [menuOpen, setMenuOpen] = useState(false)
  const [radioOn, setRadioOn] = useState(false)
  const [songIdx] = useState(() => Math.floor(Math.random() * SONGS.length))

  const toggleRadio = () => {
    setRadioOn(on => {
      if (!on) audio.startAmbient(0.03)
      else audio.stopAmbient()
      return !on
    })
  }

  const go = (tab: Parameters<typeof setTab>[0]) => {
    setTab(tab)
    setMenuOpen(false)
    audio.click()
  }

  return (
    <div className="topbar">
      {/* KARMA logo */}
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
      <div className={`radio-btn${radioOn ? ' on' : ''}`} onClick={toggleRadio}>♪</div>

      {/* Now playing panel */}
      <div id="radioNowPlaying" className={radioOn ? 'show' : ''}>
        <div className="rnp-bars">
          <div className="rnp-bar rnp-bar-a" />
          <div className="rnp-bar rnp-bar-b" />
          <div className="rnp-bar rnp-bar-c" />
          <div className="rnp-bar rnp-bar-d" />
          <div className="rnp-bar rnp-bar-e" />
        </div>
        <div className="rnp-info">
          <div className="rnp-lbl">NOW PLAYING</div>
          <div className="rnp-song">{SONGS[songIdx]}</div>
        </div>
        <div className="rnp-stop" onClick={toggleRadio}>■</div>
      </div>

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
          {/* Pet identity header */}
          <div className="dd-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 24 }}>{petEmoji}</span>
              <div>
                <div className="dd-nm">{petName}</div>
                <div className="dd-sb">LV{level} · {formatNumber(coins)}🪙 · {formatNumber(kc)}💎</div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="dd-sec">
            <div style={{ fontSize: 9, color: '#666', fontWeight: 900, letterSpacing: 1, padding: '4px 0 2px' }}>NAVIGATION</div>
            <div className="ddr" onClick={() => go('pet')}>
              <span className="ddr-i">🐾</span>
              <span style={{ flex: 1 }}>Husdjur</span>
              <span style={{ fontSize: 9, color: '#888' }}>LV{level}</span>
            </div>
            <div className="ddr" onClick={() => go('flash')}>
              <span className="ddr-i">⚡</span>
              <span style={{ flex: 1 }}>Flash</span>
              <span style={{ fontSize: 9, color: '#888' }}>Social</span>
            </div>
            <div className="ddr" onClick={() => go('create')}>
              <span className="ddr-i">🌟</span>
              <span style={{ flex: 1 }}>Skapa</span>
              <span style={{ fontSize: 9, color: '#888' }}>Recept & Expd.</span>
            </div>
            <div className="ddr" onClick={() => go('games')}>
              <span className="ddr-i">🎮</span>
              <span style={{ flex: 1 }}>Spel</span>
              <span style={{ fontSize: 9, color: '#888' }}>8 spel</span>
            </div>
            <div className="ddr" onClick={() => go('profile')}>
              <span className="ddr-i">👤</span>
              <span style={{ flex: 1 }}>Profil</span>
              <span style={{ fontSize: 9, color: '#888' }}>Stats & Shop</span>
            </div>
          </div>

          {/* Games shortcuts */}
          <div className="dd-sec">
            <div style={{ fontSize: 9, color: '#666', fontWeight: 900, letterSpacing: 1, padding: '4px 0 2px' }}>SPEL</div>
            <div className="ddr" onClick={() => go('games')}>
              <span className="ddr-i">⚔️</span>
              <span style={{ flex: 1 }}>Strid</span>
              <span style={{ fontSize: 9, color: '#ff4455' }}>{battleWins} segrar</span>
            </div>
            <div className="ddr" onClick={() => go('games')}>
              <span className="ddr-i">🎣</span>
              <span style={{ flex: 1 }}>Fiske</span>
              <span style={{ fontSize: 9, color: '#4488ff' }}>{fishCaught} fisk</span>
            </div>
            <div className="ddr" onClick={() => go('games')}>
              <span className="ddr-i">🎰</span>
              <span style={{ flex: 1 }}>Lyckhjulet</span>
              <span style={{ fontSize: 9, color: '#ffcc00' }}>10🪙/snurr</span>
            </div>
            <div className="ddr" onClick={() => go('games')}>
              <span className="ddr-i">🔢</span>
              <span style={{ flex: 1 }}>2048</span>
              <span style={{ fontSize: 9, color: '#aa66ff' }}>500🪙 belöning</span>
            </div>
            <div className="ddr" onClick={() => go('games')}>
              <span className="ddr-i">🏃</span>
              <span style={{ flex: 1 }}>Runner</span>
              <span style={{ fontSize: 9, color: '#00ff88' }}>Undvik hinder</span>
            </div>
            <div className="ddr" onClick={() => go('games')}>
              <span className="ddr-i">🐍</span>
              <span style={{ flex: 1 }}>Snake</span>
              <span style={{ fontSize: 9, color: '#888' }}>Klassiskt</span>
            </div>
            <div className="ddr" onClick={() => go('games')}>
              <span className="ddr-i">🃏</span>
              <span style={{ flex: 1 }}>Minne</span>
              <span style={{ fontSize: 9, color: '#888' }}>Para ihop</span>
            </div>
            <div className="ddr" onClick={() => go('games')}>
              <span className="ddr-i">⚡</span>
              <span style={{ flex: 1 }}>Reaktion</span>
              <span style={{ fontSize: 9, color: '#888' }}>Hur snabb?</span>
            </div>
          </div>

          {/* Features */}
          <div className="dd-sec">
            <div style={{ fontSize: 9, color: '#666', fontWeight: 900, letterSpacing: 1, padding: '4px 0 2px' }}>FUNKTIONER</div>
            <div className="ddr" onClick={() => go('create')}>
              <span className="ddr-i">🗺️</span>
              <span style={{ flex: 1 }}>Expedition</span>
              <span style={{ fontSize: 9, color: '#888' }}>Utforska</span>
            </div>
            <div className="ddr" onClick={() => go('profile')}>
              <span className="ddr-i">🛒</span>
              <span style={{ flex: 1 }}>Butik</span>
              <span style={{ fontSize: 9, color: '#888' }}>Cosmetics & Boosts</span>
            </div>
            <div className="ddr" onClick={() => go('profile')}>
              <span className="ddr-i">🏆</span>
              <span style={{ flex: 1 }}>Prestationer</span>
              <span style={{ fontSize: 9, color: '#888' }}>Badges & Awards</span>
            </div>
            <div className="ddr" onClick={() => go('profile')}>
              <span className="ddr-i">💎</span>
              <span style={{ flex: 1 }}>Battle Pass</span>
              <span style={{ fontSize: 9, color: '#aa66ff' }}>{formatNumber(bpassXP)} XP</span>
            </div>
            <div className="ddr" onClick={() => go('flash')}>
              <span className="ddr-i">🏅</span>
              <span style={{ flex: 1 }}>Topplista</span>
              <span style={{ fontSize: 9, color: '#888' }}>Rankning</span>
            </div>
            <div className="ddr" onClick={() => go('pet')}>
              <span className="ddr-i">📅</span>
              <span style={{ flex: 1 }}>Dagliga uppdrag</span>
              <span style={{ fontSize: 9, color: '#888' }}>Mål & Belöningar</span>
            </div>
            <div className="ddr" onClick={() => go('create')}>
              <span className="ddr-i">🧪</span>
              <span style={{ flex: 1 }}>Hantverk</span>
              <span style={{ fontSize: 9, color: '#888' }}>Craftingbord</span>
            </div>
            <div className="ddr" onClick={() => { openPanelId('notifications'); setMenuOpen(false) }}>
              <span className="ddr-i">🔔</span>
              <span style={{ flex: 1 }}>Notiser</span>
              {notifCount > 0 && <span style={{ fontSize: 9, background: '#ff4455', borderRadius: 6, padding: '1px 5px', color: '#fff', fontWeight: 900 }}>{notifCount}</span>}
            </div>
          </div>

          {/* Stats footer */}
          <div style={{ padding: '8px 0 0', borderTop: '1px solid rgba(255,255,255,.06)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { icon: '⭐', val: `LV${level}`, color: '#ffcc00' },
              { icon: '💰', val: formatNumber(coins), color: '#ffd700' },
              { icon: '💎', val: formatNumber(kc), color: '#00f0ff' },
              { icon: '🔥', val: `${streak}d`, color: '#ff8844' },
            ].map(s => (
              <div key={s.icon} style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'rgba(255,255,255,.04)', borderRadius: 8, padding: '3px 7px', fontSize: 10, fontWeight: 700, color: s.color }}>
                {s.icon} {s.val}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
})
