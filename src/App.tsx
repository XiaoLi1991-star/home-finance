import { Component, type ReactNode, useEffect, useState } from 'react'
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
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'

const primaryPaths = new Set(['/', '/ledger', '/monthly', '/insights', '/settings'])

class RouteErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: unknown) {
    console.error(`页面加载失败：${error instanceof Error ? error.message : String(error)}`)
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className="space-y-4 pb-24 pt-6">
        <Card className="space-y-3 p-5 text-sm text-ink-muted">
          <h1 className="text-lg font-bold text-ink">页面加载失败</h1>
          <p>可以先返回上一页，或重新打开这个页面。</p>
          <Button type="button" onClick={() => window.location.assign('#/')}>回到首页</Button>
        </Card>
      </div>
    )
  }
}

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
    <main className="min-h-screen bg-surface-dim px-4 text-ink selection:bg-brand/20">
      <AndroidBackButton />
      <div className="mx-auto max-w-md">
        <RouteErrorBoundary>
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
        </RouteErrorBoundary>
      </div>
      {showBottomNav && <BottomNav />}
      {covered && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-dark px-8 text-center text-sm font-semibold text-ink-muted">
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
