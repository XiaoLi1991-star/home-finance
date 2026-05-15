import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { LEDGER_SCHEMA_VERSION, type AppSettings, type ModelSettings, type PrivacySettings } from '@/types/ledger'

export const SETTINGS_STORAGE_KEY = 'ledger-v2-settings'

export const DEFAULT_MODEL_SETTINGS: ModelSettings = {
  baseUrl: 'https://api.minimaxi.com/v1',
  model: 'MiniMax-M2.7-highspeed',
  requestPath: '/chat/completions',
  compatibilityMode: 'openai_chat_completions',
  temperature: 0.2,
  maxTokens: 1200,
  stream: false,
  timeoutMs: 60000,
  retryCount: 1,
  customHeaders: {}
}

export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  hideAmounts: false,
  blurInBackground: false,
  launchProtectionEnabled: false
}

interface SettingsState extends AppSettings {
  updateModel: (patch: Partial<ModelSettings>) => void
  updatePrivacy: (patch: Partial<PrivacySettings>) => void
  authorizeAi: (scope: string, enabled: boolean) => void
  setMonthlyReportAutoGenerate: (enabled: boolean) => void
  resetSettings: () => void
}

function createDefaultSettings(): AppSettings {
  return {
    schemaVersion: LEDGER_SCHEMA_VERSION,
    model: DEFAULT_MODEL_SETTINGS,
    privacy: DEFAULT_PRIVACY_SETTINGS,
    aiAuthorizations: {},
    monthlyReportAutoGenerate: false
  }
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...createDefaultSettings(),

      updateModel: (patch) => {
        set(state => ({
          model: {
            ...state.model,
            ...patch
          }
        }))
      },

      updatePrivacy: (patch) => {
        set(state => ({
          privacy: {
            ...state.privacy,
            ...patch
          }
        }))
      },

      authorizeAi: (scope, enabled) => {
        set(state => ({
          aiAuthorizations: {
            ...state.aiAuthorizations,
            [scope]: enabled
          }
        }))
      },

      setMonthlyReportAutoGenerate: (enabled) => {
        set({ monthlyReportAutoGenerate: enabled })
      },

      resetSettings: () => {
        set(createDefaultSettings())
      }
    }),
    {
      name: SETTINGS_STORAGE_KEY,
      version: LEDGER_SCHEMA_VERSION,
      storage: createJSONStorage(() => localStorage)
    }
  )
)
