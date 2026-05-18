type WakeLockSentinel = {
  released?: boolean
  release: () => Promise<void>
}

type NavigatorWithWakeLock = Navigator & {
  wakeLock?: {
    request: (type: 'screen') => Promise<WakeLockSentinel>
  }
}

export async function requestScreenWakeLock() {
  if (typeof navigator === 'undefined') return null

  const wakeLock = (navigator as NavigatorWithWakeLock).wakeLock
  if (!wakeLock) return null

  try {
    return await wakeLock.request('screen')
  } catch {
    return null
  }
}

export async function releaseScreenWakeLock(sentinel: WakeLockSentinel | null) {
  if (!sentinel || sentinel.released) return

  try {
    await sentinel.release()
  } catch {
    // Losing the lock is harmless; the UI already tells users to keep the app foregrounded.
  }
}
