import { registerPlugin } from '@capacitor/core'

interface NativeSecureStoragePlugin {
  get(options: { key: string }): Promise<{ value: string | null }>
  set(options: { key: string; value: string }): Promise<void>
  remove(options: { key: string }): Promise<void>
  clear(): Promise<void>
}

const NativeSecureStorage = registerPlugin<NativeSecureStoragePlugin>('NativeSecureStorage')

export async function getSecureItem(key: string): Promise<string> {
  const result = await NativeSecureStorage.get({ key })
  return result.value || ''
}

export function setSecureItem(key: string, value: string): Promise<void> {
  return NativeSecureStorage.set({ key, value })
}

export function removeSecureItem(key: string): Promise<void> {
  return NativeSecureStorage.remove({ key })
}

export function clearSecureStorage(): Promise<void> {
  return NativeSecureStorage.clear()
}
