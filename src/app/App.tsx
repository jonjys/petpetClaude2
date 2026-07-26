import { memo, useEffect, Suspense, lazy } from 'react'
import { useUIStore } from '@/stores/uiStore'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'
import { Toast } from '@/components/ui/Toast'
import { FloatText } from '@/components/ui/FloatText'
import { Confetti } from '@/components/ui/Confetti'
import { NotificationsPanel } from '@/components/ui/NotificationsPanel'
import { PetView } from '@/features/pet/PetView'
import { startAutoSave, startDecayTick } from '@/services/SaveService'
import styles from './App.module.css'

const FlashView = lazy(() => import('@/features/flash/FlashView').then(m => ({ default: m.FlashView })))
const GamesView = lazy(() => import('@/features/games/GamesView').then(m => ({ default: m.GamesView })))
const ProfileView = lazy(() => import('@/features/profile/ProfileView').then(m => ({ default: m.ProfileView })))
const CreateView = lazy(() => import('@/features/create/CreateView').then(m => ({ default: m.CreateView })))

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
      <Header />

      <main className={styles.main}>
        <Suspense fallback={<TabSpinner />}>
          {activeTab === 'pet' && <PetView />}
          {activeTab === 'flash' && <FlashView />}
          {activeTab === 'create' && <CreateView />}
          {activeTab === 'games' && <GamesView />}
          {activeTab === 'profile' && <ProfileView />}
        </Suspense>
      </main>

      <BottomNav />

      {/* Overlays */}
      <Toast />
      <FloatText />
      <Confetti />
      {openPanel === 'notifications' && <NotificationsPanel />}
    </div>
  )
})
