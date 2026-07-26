import { memo, useEffect, Suspense, lazy } from 'react'
import { useUIStore } from '@/stores/uiStore'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'
import { Toast } from '@/components/ui/Toast'
import { FloatText } from '@/components/ui/FloatText'
import { Confetti } from '@/components/ui/Confetti'
import { NotificationsPanel } from '@/components/ui/NotificationsPanel'
import { AmbientEmojis } from '@/components/ui/AmbientEmojis'
import { PetView } from '@/features/pet/PetView'
import { startAutoSave, startDecayTick } from '@/services/SaveService'
import styles from './App.module.css'

const FlashView  = lazy(() => import('@/features/flash/FlashView').then(m => ({ default: m.FlashView })))
const GamesView  = lazy(() => import('@/features/games/GamesView').then(m => ({ default: m.GamesView })))
const ProfileView = lazy(() => import('@/features/profile/ProfileView').then(m => ({ default: m.ProfileView })))
const CreateView  = lazy(() => import('@/features/create/CreateView').then(m => ({ default: m.CreateView })))

const LORE = [
  '🌙 The moon blesses tonight\'s sessions with double XP',
  '🌌 Cosmic forces are converging in the Omega Core',
  '✨ Lucky stars fall upon those who stay vigilant',
  '🐉 The Dragon form awaits those who reach Level 75',
  '🔥 An XP multiplier event is imminent',
  '💎 The Crystal Resonance hums with ancient power',
  '🌸 Spring brings renewal to all Karma travelers',
  '⚔️ Boss Rush Wave 7: Cosmos Destroyer awakens',
  '🧘 Inner peace multiplies your strength by 3x today',
  '🌊 The Ocean Sage whispers secrets to the patient',
  '⚡ Your karma grows stronger with every tap',
  '🏆 Dimensional rifts have been detected — be ready',
]
const TICKER_TEXT = (LORE.join('  •  ') + '  •  ').repeat(2)

const TabSpinner = () => (
  <div className={styles.spinner}>
    <div className={styles.spinnerInner} />
  </div>
)

export const App = memo(function App() {
  const activeTab = useUIStore(s => s.activeTab)
  const openPanel = useUIStore(s => s.openPanel)

  useEffect(() => {
    startAutoSave()
    startDecayTick()
  }, [])

  return (
    <div className={styles.app}>
      {/* Ambient floating emojis layer */}
      <AmbientEmojis />

      <Header />

      <main className={styles.main}>
        <Suspense fallback={<TabSpinner />}>
          {activeTab === 'pet'     && <PetView />}
          {activeTab === 'flash'   && <FlashView />}
          {activeTab === 'create'  && <CreateView />}
          {activeTab === 'games'   && <GamesView />}
          {activeTab === 'profile' && <ProfileView />}
        </Suspense>
      </main>

      {/* Live lore ticker above bottom nav */}
      <div className={styles.ticker}>
        <div className={styles.tickerLive}>
          <span className={styles.tickerDot} />
          LIVE
        </div>
        <div className={styles.tickerScroll}>
          <div className={styles.tickerInner}>
            {TICKER_TEXT.split('  •  ').map((item, i) => (
              <span key={i}>
                {item}
                <span className={styles.tickerSep}>•</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <BottomNav />

      {/* Overlays */}
      <Toast />
      <FloatText />
      <Confetti />
      {openPanel === 'notifications' && <NotificationsPanel />}
    </div>
  )
})
