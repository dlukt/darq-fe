import { create } from "zustand"
import { persist } from "zustand/middleware"

interface SettingsState {
  showSensitiveMedia: boolean
  expandContentWarnings: boolean
  setShowSensitiveMedia: (val: boolean) => void
  setExpandContentWarnings: (val: boolean) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      showSensitiveMedia: false,
      expandContentWarnings: false,
      setShowSensitiveMedia: (val) => set({ showSensitiveMedia: val }),
      setExpandContentWarnings: (val) => set({ expandContentWarnings: val }),
    }),
    {
      name: "darq-settings",
    }
  )
)
