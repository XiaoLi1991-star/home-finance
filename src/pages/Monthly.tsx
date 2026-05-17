import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Upload } from 'lucide-react'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { PageHeader } from '@/components/PageHeader'
import { createFailedReport, generateMonthlyAiReport } from '@/lib/ai/reports'
import { getAiApiKey } from '@/lib/native/secrets'
import { getCategoryLabel, getStatusLabel } from '@/lib/v2/categories'
import { compareMonth, currentMonthKey } from '@/lib/v2/migration'
import { formatWan } from '@/lib/utils'
import { useLedgerStore } from '@/store/useLedgerStore'
import { useSettingsStore } from '@/store/useSettingsStore'

export default function Monthly() {
  const items = useLedgerStore(state => state.items)
  const snapshots = useLedgerStore(state => state.snapshots)
  const createSnapshot = useLedgerStore(state => state.createSnapshot)
  const addReport = useLedgerStore(state => state.addReport)
  const confirmItem = useLedgerStore(state => state.confirmItem)
  const endItem = useLedgerStore(state => state.endItem)
  const model = useSettingsStore(state => state.model)
  const monthlyReportAutoGenerate = useSettingsStore(state => state.monthlyReportAutoGenerate)
  const hidden = useSettingsStore(state => state.privacy.hideAmounts)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)
  const month = currentMonthKey()
  const hasSnapshotRecords = items.some(item => item.status === 'active')

  const focusItems = useMemo(() => {
    return items.filter(item => {
      if (item.status === 'draft' || item.status === 'ended') return false
      if (item.status === 'pending_confirmation') return true
      if (item.kind === 'liability') return true
      if (item.category === 'cash_accounts' || item.category === 'investments') return true
      if (item.endMonth && compareMonth(item.endMonth, month) <= 0 && item.status === 'active') return true
      return false
    })
  }, [items, month])

  const latest = snapshots.find(snapshot => snapshot.month === month)

  return (
    <div className="space-y-4 pb-24">
      <PageHeader title="月度确认" subtitle={`${month} · 重点确认与快照`} />

      {notice && (
        <Card className={`p-3 text-sm ${notice.tone === 'error' ? 'border-danger-light bg-danger-light text-danger' : 'text-ink-muted'}`}>
          {notice.text}
        </Card>
      )}

      <Card className="border-brand-light bg-brand-light/35 p-3 shadow-none">
        <div className="flex items-start gap-3">
          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand" />
          <div>
            <h2 className="font-bold">本月重点项</h2>
            <p className="mt-0.5 text-xs leading-5 text-ink-muted">现金、投资、贷款和待确认记录会优先出现在这里。</p>
          </div>
        </div>
      </Card>

      {!hasSnapshotRecords ? (
        <Card className="space-y-3 p-5 text-center text-sm text-ink-muted">
          <p>还没有正式记录，暂时不能生成月度快照。</p>
          <div className="grid grid-cols-2 gap-2">
            <Link to="/ledger/new">
              <Button className="w-full justify-start">
                <Plus className="h-4 w-4" />
                记一笔
              </Button>
            </Link>
            <Link to="/migration">
              <Button variant="secondary" className="w-full justify-start">
                <Upload className="h-4 w-4" />
                导入备份
              </Button>
            </Link>
          </div>
        </Card>
      ) : focusItems.length === 0 ? (
        <Card className="p-6 text-center text-sm text-ink-muted">暂无需要确认的项目。</Card>
      ) : (
        <div className="space-y-2">
          {focusItems.map(item => {
            const shouldEnd = item.endMonth && compareMonth(item.endMonth, month) <= 0 && item.status === 'active'
            const needsAction = item.status === 'pending_confirmation' || shouldEnd
            return (
              <Card key={item.id} className="p-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-bold leading-tight">{item.name}</p>
                    <p className="mt-1 text-xs text-ink-muted">{getCategoryLabel(item.category)} · {getStatusLabel(item.status)}</p>
                    {shouldEnd && <p className="mt-1 text-xs text-danger">可能已到结束月份，请确认。</p>}
                  </div>
                  <p className={`shrink-0 text-right text-base font-black ${item.kind === 'liability' ? 'text-danger' : 'text-brand-dark'}`}>
                    {item.kind === 'liability' ? '-' : '+'}
                    {formatWan(item.amount, hidden)}
                  </p>
                </div>
                {needsAction && (
                  <div className="mt-2 flex gap-2">
                    {item.status === 'pending_confirmation' && (
                      <Button size="sm" onClick={() => confirmItem(item.id)}>确认有效</Button>
                    )}
                    {shouldEnd && (
                      <Button size="sm" variant="danger" onClick={() => endItem(item.id)}>确认结束</Button>
                    )}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      <Button
        size="lg"
        className="w-full"
        disabled={saving || !hasSnapshotRecords}
        onClick={async () => {
          if (!hasSnapshotRecords) return
          setSaving(true)
          const snapshot = createSnapshot(month)
          try {
            if (monthlyReportAutoGenerate) {
              const apiKey = await getAiApiKey()
              const report = await generateMonthlyAiReport({
                settings: model,
                apiKey,
                snapshot,
                items,
                snapshots: [...snapshots.filter(item => item.month !== snapshot.month), snapshot]
              })
              addReport(report)
              setNotice({ tone: 'success', text: `已生成 ${snapshot.month} 月度快照和 AI 月报。` })
            } else {
              setNotice({ tone: 'success', text: `已生成 ${snapshot.month} 月度快照。` })
            }
          } catch (err) {
            addReport(createFailedReport(snapshot, err instanceof Error ? err.message : 'AI 月报生成失败。'))
            setNotice({ tone: 'error', text: `已生成 ${snapshot.month} 月度快照。AI 月报生成失败，可在洞察里查看记录。` })
          } finally {
            setSaving(false)
          }
        }}
      >
        {saving ? '处理中...' : hasSnapshotRecords ? '生成本月快照' : '先添加记录再生成快照'}
      </Button>

      {latest && (
        <Card className="p-4">
          <h2 className="font-bold">本月已生成快照</h2>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
            <div className="rounded-xl bg-surface-dark p-3">
              <p className="text-xs text-ink-muted">资产</p>
              <b>{formatWan(latest.totals.totalAssets, hidden)}</b>
            </div>
            <div className="rounded-xl bg-[#f8f1f1] p-3">
              <p className="text-xs text-danger">负债</p>
              <b>{formatWan(latest.totals.totalLiabilities, hidden)}</b>
            </div>
            <div className="rounded-xl bg-surface-dim p-3">
              <p className="text-xs text-ink-muted">净值</p>
              <b>{formatWan(latest.totals.netWorth, hidden)}</b>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
