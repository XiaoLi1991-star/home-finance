const LAUNCH_PIN_STORAGE_KEY = 'ledger-v2-launch-pin'

interface StoredPin {
  salt: string
  hash: string
}

function bytesToHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')
}

function randomSalt(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map(byte => byte.toString(16).padStart(2, '0')).join('')
}

async function sha256(value: string): Promise<string> {
  if (!crypto.subtle) throw new Error('当前环境不支持 PIN 哈希。')
  const encoded = new TextEncoder().encode(value)
  return bytesToHex(await crypto.subtle.digest('SHA-256', encoded))
}

function readStoredPin(): StoredPin | null {
  if (typeof localStorage === 'undefined') return null
  const raw = localStorage.getItem(LAUNCH_PIN_STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as StoredPin
  } catch {
    return null
  }
}

export async function hasLaunchPin(): Promise<boolean> {
  return Boolean(readStoredPin())
}

export async function setLaunchPin(pin: string): Promise<void> {
  const normalized = pin.trim()
  if (normalized.length < 4) throw new Error('PIN 至少需要 4 位。')
  const salt = randomSalt()
  const hash = await sha256(`${salt}:${normalized}`)
  localStorage.setItem(LAUNCH_PIN_STORAGE_KEY, JSON.stringify({ salt, hash }))
}

export async function verifyLaunchPin(pin: string): Promise<boolean> {
  const stored = readStoredPin()
  if (!stored) return false
  const hash = await sha256(`${stored.salt}:${pin.trim()}`)
  return hash === stored.hash
}

export async function clearLaunchPin(): Promise<void> {
  localStorage.removeItem(LAUNCH_PIN_STORAGE_KEY)
}
