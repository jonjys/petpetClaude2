import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { SETTINGS_KEY, AUDIO_ENABLED_DEFAULT, MUSIC_VOLUME_DEFAULT, SFX_VOLUME_DEFAULT } from '@/constants/config'

interface Settings {
  audioEnabled: boolean
  musicVolume: number
  sfxVolume: number
  hapticEnabled: boolean
  language: 'sv' | 'en'
  theme: 'dark' | 'light'
  showFPS: boolean
  reducedMotion: boolean
}

interface SettingsStore extends Settings {
  set: (partial: Partial<Settings>) => void
  reset: () => void
  setAudioEnabled: (v: boolean) => void
  setMusicVolume: (v: number) => void
  setSfxVolume: (v: number) => void
  setHapticEnabled: (v: boolean) => void
  setReducedMotion: (v: boolean) => void
}

const DEFAULTS: Settings = {
  audioEnabled: AUDIO_ENABLED_DEFAULT,
  musicVolume: MUSIC_VOLUME_DEFAULT,
  sfxVolume: SFX_VOLUME_DEFAULT,
  hapticEnabled: true,
  language: 'sv',
  theme: 'dark',
  showFPS: false,
  reducedMotion: false,
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      set: (partial) => set(partial),
      reset: () => set(DEFAULTS),
      setAudioEnabled: (v) => set({ audioEnabled: v }),
      setMusicVolume: (v) => set({ musicVolume: v }),
      setSfxVolume: (v) => set({ sfxVolume: v }),
      setHapticEnabled: (v) => set({ hapticEnabled: v }),
      setReducedMotion: (v) => set({ reducedMotion: v }),
    }),
    { name: SETTINGS_KEY }
  )
)
