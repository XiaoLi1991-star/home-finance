import { useEffect } from 'react'
import { App as CapacitorApp } from '@capacitor/app'
import { HashRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { BottomNav } from '@/components/BottomNav'
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
    </main>
  )
}

export default function App() {
  return (
    <HashRouter>
      <Shell />
    </HashRouter>
  )
}
