import { Capacitor } from '@capacitor/core'
import { getSecureItem, removeSecureItem, setSecureItem } from '@/lib/native/nativeSecureStorage'

const AI_API_KEY_STORAGE_KEY = 'ledger-v2-ai-api-key'
const SECURE_STORAGE_PREFIX = 'family-finance-v2_'
const SECURE_AI_API_KEY = `${SECURE_STORAGE_PREFIX}${AI_API_KEY_STORAGE_KEY}`

function canUseLocalStorage(): boolean {
  return typeof localStorage !== 'undefined'
}

function shouldUseNativeSecureStorage(): boolean {
  return Capacitor.isNativePlatform()
}

function getLegacyApiKey(): string {
  if (!canUseLocalStorage()) return ''
  return localStorage.getItem(AI_API_KEY_STORAGE_KEY) || ''
}

function clearLegacyApiKey(): void {
  if (!canUseLocalStorage()) return
  localStorage.removeItem(AI_API_KEY_STORAGE_KEY)
}

async function migrateLegacyApiKeyToSecureStorage(): Promise<string> {
  const legacy = getLegacyApiKey().trim()
  if (!legacy) return ''
  await setSecureItem(SECURE_AI_API_KEY, legacy)
  clearLegacyApiKey()
  return legacy
}

export async function getAiApiKey(): Promise<string> {
  if (!shouldUseNativeSecureStorage()) return getLegacyApiKey()

  try {
    const secureValue = await getSecureItem(SECURE_AI_API_KEY)
    if (secureValue) return secureValue
    return migrateLegacyApiKeyToSecureStorage()
  } catch {
    return getLegacyApiKey()
  }
}

export async function setAiApiKey(apiKey: string): Promise<void> {
  const trimmed = apiKey.trim()
  if (shouldUseNativeSecureStorage()) {
    if (!trimmed) {
      await removeSecureItem(SECURE_AI_API_KEY)
      clearLegacyApiKey()
      return
    }
    await setSecureItem(SECURE_AI_API_KEY, trimmed)
    clearLegacyApiKey()
    return
  }

  if (!canUseLocalStorage()) return
  if (!trimmed) {
    localStorage.removeItem(AI_API_KEY_STORAGE_KEY)
    return
  }
  localStorage.setItem(AI_API_KEY_STORAGE_KEY, trimmed)
}

export async function clearAiApiKey(): Promise<void> {
  if (shouldUseNativeSecureStorage()) {
    await removeSecureItem(SECURE_AI_API_KEY)
    clearLegacyApiKey()
    return
  }
  if (!canUseLocalStorage()) return
  localStorage.removeItem(AI_API_KEY_STORAGE_KEY)
}

export function maskSecret(value: string): string {
  if (!value) return '未设置'
  if (value.length <= 8) return '已设置'
  return `${value.slice(0, 4)}...${value.slice(-4)}`
}
