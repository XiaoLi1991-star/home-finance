import { useEffect, useState } from 'react'
import { LockKeyhole } from 'lucide-react'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { hasLaunchPin, verifyLaunchPin } from '@/lib/native/launchProtection'
import { useSettingsStore } from '@/store/useSettingsStore'

export function LaunchGate({ children }: { children: React.ReactNode }) {
  const enabled = useSettingsStore(state => state.privacy.launchProtectionEnabled)
  const updatePrivacy = useSettingsStore(state => state.updatePrivacy)
  const [ready, setReady] = useState(!enabled)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    if (!enabled) {
      setReady(true)
      return
    }
    void hasLaunchPin().then(exists => {
      if (!active) return
      if (!exists) {
        updatePrivacy({ launchProtectionEnabled: false })
        setReady(true)
      } else {
        setReady(false)
      }
    })
    return () => {
      active = false
    }
  }, [enabled, updatePrivacy])

  if (!enabled || ready) return <>{children}</>

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f1f6f4] px-4 text-[#24352f]">
      <Card className="w-full max-w-sm p-5">
        <div className="mb-4 flex items-center gap-2">
          <LockKeyhole className="h-5 w-5 text-[#4f9b79]" />
          <h1 className="text-xl font-bold">解锁家庭台账</h1>
        </div>
        <input
          className="input"
          type="password"
          inputMode="numeric"
          value={pin}
          onChange={event => setPin(event.target.value)}
          placeholder="输入 PIN"
          autoFocus
        />
        {error && <p className="mt-2 text-sm text-[#a44f4f]">{error}</p>}
        <Button
          className="mt-4 w-full"
          onClick={async () => {
            const ok = await verifyLaunchPin(pin)
            if (ok) {
              setReady(true)
              setError('')
              setPin('')
            } else {
              setError('PIN 不正确。')
            }
          }}
        >
          解锁
        </Button>
      </Card>
    </main>
  )
}
