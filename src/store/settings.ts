import { create } from "zustand"
import { persist } from "zustand/middleware"

interface SettingsState {
  showSensitiveMedia: boolean
  expandContentWarnings: boolean
  defaultLanguage: string
  setShowSensitiveMedia: (val: boolean) => void
  setExpandContentWarnings: (val: boolean) => void
  setDefaultLanguage: (val: string) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      showSensitiveMedia: false,
      expandContentWarnings: false,
      defaultLanguage: "en",
      setShowSensitiveMedia: (val) => set({ showSensitiveMedia: val }),
      setExpandContentWarnings: (val) => set({ expandContentWarnings: val }),
      setDefaultLanguage: (val) => set({ defaultLanguage: val }),
    }),
    {
      name: "darq-settings",
    }
  )
)
