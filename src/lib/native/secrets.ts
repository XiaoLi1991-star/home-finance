const AI_API_KEY_STORAGE_KEY = 'ledger-v2-ai-api-key'

function canUseLocalStorage(): boolean {
  return typeof localStorage !== 'undefined'
}

export async function getAiApiKey(): Promise<string> {
  if (!canUseLocalStorage()) return ''
  return localStorage.getItem(AI_API_KEY_STORAGE_KEY) || ''
}

export async function setAiApiKey(apiKey: string): Promise<void> {
  if (!canUseLocalStorage()) return
  const trimmed = apiKey.trim()
  if (!trimmed) {
    localStorage.removeItem(AI_API_KEY_STORAGE_KEY)
    return
  }
  localStorage.setItem(AI_API_KEY_STORAGE_KEY, trimmed)
}

export async function clearAiApiKey(): Promise<void> {
  if (!canUseLocalStorage()) return
  localStorage.removeItem(AI_API_KEY_STORAGE_KEY)
}

export function maskSecret(value: string): string {
  if (!value) return '未设置'
  if (value.length <= 8) return '已设置'
  return `${value.slice(0, 4)}...${value.slice(-4)}`
}
