import { create } from 'zustand'
import type { TabId, ToastMessage, FloatTextItem, FeatureRegistration, Notification } from '@/types/game'
import { storageGet, storageSet } from '@/utils/storage'
import { NOTIFS_KEY } from '@/constants/config'

let toastCounter = 0
let floatCounter = 0
let notifCounter = 0

interface UIStore {
  activeTab: TabId
  openPanel: string | null
  toasts: ToastMessage[]
  floatTexts: FloatTextItem[]
  features: FeatureRegistration[]
  fabOpen: boolean
  confettiActive: boolean
  notifications: Notification[]
  notifCount: number
  dailyBonusVisible: boolean
  dailyBonusData: { streak: number; coins: number; kc: number } | null

  setTab: (tab: TabId) => void
  openPanelId: (id: string) => void
  closePanel: () => void
  showToast: (text: string, type?: ToastMessage['type']) => void
  dismissToast: (id: string) => void
  spawnFloat: (text: string, x: number, y: number, color?: string) => void
  clearFloat: (id: string) => void
  registerFeature: (f: FeatureRegistration) => void
  unregisterFeature: (id: string) => void
  setFabOpen: (open: boolean) => void
  triggerConfetti: () => void
  pushNotif: (icon: string, text: string) => void
  markNotifsRead: () => void
  showDailyBonus: (data: { streak: number; coins: number; kc: number }) => void
  hideDailyBonus: () => void
}

export const useUIStore = create<UIStore>()((set, get) => ({
  activeTab: 'pet',
  openPanel: null,
  toasts: [],
  floatTexts: [],
  features: [],
  fabOpen: false,
  confettiActive: false,
  notifications: storageGet<Notification[]>(NOTIFS_KEY, []).slice(0, 30),
  notifCount: storageGet<Notification[]>(NOTIFS_KEY, []).filter(n => !n.read).length,
  dailyBonusVisible: false,
  dailyBonusData: null,

  setTab(tab) { set({ activeTab: tab, openPanel: null, fabOpen: false }) },
  openPanelId(id) { set({ openPanel: id, fabOpen: false }) },
  closePanel() { set({ openPanel: null }) },

  showToast(text, type = 'info') {
    const id = `toast-${++toastCounter}`
    const msg: ToastMessage = { id, text, type, createdAt: Date.now() }
    set(s => ({ toasts: [...s.toasts.slice(-4), msg] }))
    setTimeout(() => get().dismissToast(id), 3000)
  },

  dismissToast(id) { set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })) },

  spawnFloat(text, x, y, color) {
    const id = `float-${++floatCounter}`
    set(s => ({ floatTexts: [...s.floatTexts, { id, text, x, y, color }] }))
    setTimeout(() => get().clearFloat(id), 1200)
  },

  clearFloat(id) { set(s => ({ floatTexts: s.floatTexts.filter(f => f.id !== id) })) },

  registerFeature(f) {
    set(s => {
      if (s.features.some(x => x.id === f.id)) return {}
      return { features: [...s.features, f] }
    })
  },

  unregisterFeature(id) { set(s => ({ features: s.features.filter(f => f.id !== id) })) },
  setFabOpen(open) { set({ fabOpen: open }) },

  triggerConfetti() {
    set({ confettiActive: true })
    setTimeout(() => set({ confettiActive: false }), 2500)
  },

  pushNotif(icon, text) {
    const n: Notification = { id: `n-${++notifCounter}`, icon, text, ts: Date.now(), read: false }
    set(s => {
      const updated = [n, ...s.notifications].slice(0, 30)
      storageSet(NOTIFS_KEY, updated)
      return { notifications: updated, notifCount: s.notifCount + 1 }
    })
  },

  markNotifsRead() {
    set(s => {
      const updated = s.notifications.map(n => ({ ...n, read: true }))
      storageSet(NOTIFS_KEY, updated)
      return { notifications: updated, notifCount: 0 }
    })
  },

  showDailyBonus(data) { set({ dailyBonusVisible: true, dailyBonusData: data }) },
  hideDailyBonus() { set({ dailyBonusVisible: false, dailyBonusData: null }) },
}))
