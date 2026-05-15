import { useEffect, useState } from 'react'
import { App as CapacitorApp } from '@capacitor/app'
import { HashRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { BottomNav } from '@/components/BottomNav'
import { LaunchGate } from '@/components/LaunchGate'
import AiEntry from '@/pages/AiEntry'
import DraftReview from '@/pages/DraftReview'
import Home from '@/pages/Home'
import Insights from '@/pages/Insights'
import Ledger from '@/pages/Ledger'
import LedgerDetail from '@/pages/LedgerDetail'
import LedgerEditor from '@/pages/LedgerEditor'
import MigrationWizard from '@/pages/MigrationWizard'
import Monthly from '@/pages/Monthly'
import Settings from '@/pages/Settings'
import { useSettingsStore } from '@/store/useSettingsStore'

const primaryPaths = new Set(['/', '/ledger', '/monthly', '/insights', '/settings'])

function AndroidBackButton() {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    let active = true
    let cleanup: (() => void) | undefined

    CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      if (primaryPaths.has(location.pathname)) {
        void CapacitorApp.exitApp()
        return
      }
      if (canGoBack) {
        navigate(-1)
        return
      }
      navigate('/', { replace: true })
    }).then(handle => {
      if (!active) {
        handle.remove()
        return
      }
      cleanup = () => handle.remove()
    })

    return () => {
      active = false
      cleanup?.()
    }
  }, [location.pathname, navigate])

  return null
}

function Shell() {
  const location = useLocation()
  const showBottomNav = primaryPaths.has(location.pathname)
  const blurInBackground = useSettingsStore(state => state.privacy.blurInBackground)
  const [covered, setCovered] = useState(false)

  useEffect(() => {
    const update = () => setCovered(blurInBackground && document.visibilityState === 'hidden')
    document.addEventListener('visibilitychange', update)
    const pause = CapacitorApp.addListener('pause', () => setCovered(blurInBackground))
    const resume = CapacitorApp.addListener('resume', () => setCovered(false))
    update()

    return () => {
      document.removeEventListener('visibilitychange', update)
      void pause.then(handle => handle.remove())
      void resume.then(handle => handle.remove())
    }
  }, [blurInBackground])

  return (
    <main className="min-h-screen bg-[#f1f6f4] px-4 text-[#24352f]">
      <AndroidBackButton />
      <div className="mx-auto max-w-md">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/ledger" element={<Ledger />} />
          <Route path="/ledger/new" element={<LedgerEditor />} />
          <Route path="/ledger/:id" element={<LedgerDetail />} />
          <Route path="/ledger/:id/edit" element={<LedgerEditor />} />
          <Route path="/drafts" element={<DraftReview />} />
          <Route path="/monthly" element={<Monthly />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/ai-entry" element={<AiEntry />} />
          <Route path="/migration" element={<MigrationWizard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      {showBottomNav && <BottomNav />}
      {covered && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#f1f6f4] px-8 text-center text-sm font-semibold text-[#4f6f62]">
          家庭台账已隐藏
        </div>
      )}
    </main>
  )
}

export default function App() {
  return (
    <HashRouter>
      <LaunchGate>
        <Shell />
      </LaunchGate>
    </HashRouter>
  )
}
