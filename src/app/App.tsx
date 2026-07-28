import { memo, useEffect, Suspense, lazy, useRef } from 'react'
import { useUIStore } from '@/stores/uiStore'
import { useGameStore } from '@/stores/gameStore'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'
import { Toast } from '@/components/ui/Toast'
import { FloatText } from '@/components/ui/FloatText'
import { Confetti } from '@/components/ui/Confetti'
import { NotificationsPanel } from '@/components/ui/NotificationsPanel'
import { DailyBonusModal } from '@/components/ui/DailyBonusModal'
import { AchievementUnlockOverlay } from '@/components/ui/AchievementUnlockOverlay'
import { PetView } from '@/features/pet/PetView'
import { startAutoSave, startDecayTick } from '@/services/SaveService'

const FlashView   = lazy(() => import('@/features/flash/FlashView').then(m => ({ default: m.FlashView })))
const GamesView   = lazy(() => import('@/features/games/GamesView').then(m => ({ default: m.GamesView })))
const ProfileView = lazy(() => import('@/features/profile/ProfileView').then(m => ({ default: m.ProfileView })))
const CreateView  = lazy(() => import('@/features/create/CreateView').then(m => ({ default: m.CreateView })))

const LORE_ITEMS = [
  '🌙 The moon blesses tonight\'s sessions with double XP',
  '🌌 Cosmic forces are converging in the Omega Core',
  '✨ Lucky stars fall upon those who stay vigilant',
  '🐉 The Dragon form awaits those who reach Level 75',
  '🔥 An XP multiplier event is imminent',
  '💎 The Crystal Resonance hums with ancient power',
  '⚔️ Boss Rush Wave 7: Cosmos Destroyer awakens',
  '🧘 Inner peace multiplies your strength by 3x today',
  '🌊 The Ocean Sage whispers secrets to the patient',
  '⚡ Your karma grows stronger with every tap',
]

const Spinner = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
    <div style={{ width: 36, height: 36, border: '3px solid rgba(0,255,136,.15)', borderTopColor: '#00ff88', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
  </div>
)

export const App = memo(function App() {
  const activeTab = useUIStore(s => s.activeTab)
  const openPanel = useUIStore(s => s.openPanel)
  const dailyBonusVisible = useUIStore(s => s.dailyBonusVisible)
  const showDailyBonus = useUIStore(s => s.showDailyBonus)
  const tickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    startAutoSave()
    const pet = useGameStore.getState().pet

    // Offline catch-up with earned coins estimate
    const awayMs = Date.now() - pet.lastSeen
    const awayMins = Math.floor(awayMs / 60000)
    if (awayMins >= 30) {
      const awayHrs = Math.floor(awayMins / 60)
      const label = awayHrs >= 1 ? `${awayHrs}h ${awayMins % 60}m` : `${awayMins}m`
      const passiveCoins = Math.min(200, Math.floor(awayMins / 10) * (1 + Math.floor(pet.level / 10)))
      if (passiveCoins > 0) {
        useGameStore.getState().gainCoins(passiveCoins)
        useUIStore.getState().showToast(`👋 Välkommen! Borta ${label} — +${passiveCoins}🪙 passiv inkomst!`, 'info')
      } else {
        useUIStore.getState().showToast(`👋 Välkommen tillbaka! Borta ${label} — kolla ditt husdjur!`, 'info')
      }
    }

    // Weather/time-based bonus
    const weatherKey = 'k0509_weather_bonus'
    const lastWeather = localStorage.getItem(weatherKey) ?? ''
    const hour = new Date().getHours()
    const todayHour = `${new Date().toDateString()}_${hour}`
    if (lastWeather !== todayHour) {
      localStorage.setItem(weatherKey, todayHour)
      if (hour >= 6 && hour < 10) {
        useUIStore.getState().showToast('🌅 Morgonbonus! +25% XP nästa timme', 'info')
      } else if (hour >= 20 && hour < 23) {
        useUIStore.getState().showToast('🌙 Natt-bonus! +15% mynt nästa timme', 'info')
      } else if (hour === 12) {
        useUIStore.getState().showToast('☀️ Lunchbonus! +10 XP gratis', 'info')
        useGameStore.getState().gainXP(10, 'weather')
      }
    }

    startDecayTick()
    const result = useGameStore.getState().checkStreak()
    if (result.extended) {
      showDailyBonus({ streak: result.newStreak, coins: result.coins, kc: result.kc })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /* Ambient emoji rain — same as legacy */
  useEffect(() => {
    const EMOJIS = ['🐟','☀️','🎱','🦋','⭐','💫','🌸','🎯','💎','🌊','🔥','🌟','🍀','⚡','🦄','🎮']
    const root = document.getElementById('root')
    if (!root) return
    const spawn = () => {
      const el = document.createElement('span')
      el.textContent = EMOJIS[Math.floor(Math.random() * EMOJIS.length)]
      el.style.cssText = `
        position:fixed;
        left:${Math.random() * 95}%;
        bottom:${60 + Math.random() * 80}px;
        font-size:${18 + Math.random() * 16}px;
        opacity:0;
        pointer-events:none;
        z-index:1;
        filter:opacity(.45) blur(.3px);
        animation:ambientFloat ${6 + Math.random() * 8}s ${Math.random() * 2}s ease-in forwards;
      `
      root.appendChild(el)
      setTimeout(() => el.remove(), 16000)
    }
    for (let i = 0; i < 3; i++) setTimeout(spawn, i * 700)
    const iv = setInterval(spawn, 1800)
    return () => { clearInterval(iv) }
  }, [])

  const tickerText = (LORE_ITEMS.join('  •  ') + '  •  ').repeat(3)

  return (
    <>
      {/* App shell — exact legacy structure */}
      <div id="app" style={{ display: 'flex' }}>
        <Header />

        <div className="main">
          {/* Inline opacity/transform override bypasses the legacy CSS display→opacity transition bug
              where opacity:0 on .view never transitions to 1 when display flips from none→flex */}
          <div className={`view${activeTab === 'pet'     ? ' active' : ''}`} id="view-pet-react"
            style={{ opacity: 1, transform: 'none', pointerEvents: 'auto' }}>
            <PetView />
          </div>
          <div className={`view${activeTab === 'flash'   ? ' active' : ''}`} id="view-flash-react"
            style={{ padding: 0, position: 'relative', opacity: 1, transform: 'none', pointerEvents: 'auto' }}>
            <Suspense fallback={<Spinner />}><FlashView /></Suspense>
          </div>
          <div className={`view${activeTab === 'create'  ? ' active' : ''}`} id="view-create-react"
            style={{ opacity: 1, transform: 'none', pointerEvents: 'auto' }}>
            <Suspense fallback={<Spinner />}><CreateView /></Suspense>
          </div>
          <div className={`view${activeTab === 'games'   ? ' active' : ''}`} id="view-games-react"
            style={{ opacity: 1, transform: 'none', pointerEvents: 'auto' }}>
            <Suspense fallback={<Spinner />}><GamesView /></Suspense>
          </div>
          <div className={`view${activeTab === 'profile' ? ' active' : ''}`} id="view-profile-react"
            style={{ opacity: 1, transform: 'none', pointerEvents: 'auto' }}>
            <Suspense fallback={<Spinner />}><ProfileView /></Suspense>
          </div>
        </div>

        <BottomNav />
      </div>

      {/* Live lore ticker */}
      <div id="liveTicker">
        <div className="lt-live">
          <div className="lt-dot" />
          LIVE
        </div>
        <div className="lt-scroll-wrap">
          <div className="lt-scroll" ref={tickerRef}>{tickerText}</div>
        </div>
      </div>

      {/* Overlays */}
      <Toast />
      <FloatText />
      <Confetti />
      {openPanel === 'notifications' && <NotificationsPanel />}
      {dailyBonusVisible && <DailyBonusModal />}
      <AchievementUnlockOverlay />
    </>
  )
})
