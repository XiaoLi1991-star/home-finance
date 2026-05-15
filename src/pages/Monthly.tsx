import { useMemo } from 'react'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { PageHeader } from '@/components/PageHeader'
import { getCategoryLabel, getStatusLabel } from '@/lib/v2/categories'
import { compareMonth, currentMonthKey } from '@/lib/v2/migration'
import { formatWan } from '@/lib/utils'
import { useLedgerStore } from '@/store/useLedgerStore'

export default function Monthly() {
  const items = useLedgerStore(state => state.items)
  const snapshots = useLedgerStore(state => state.snapshots)
  const createSnapshot = useLedgerStore(state => state.createSnapshot)
  const confirmItem = useLedgerStore(state => state.confirmItem)
  const endItem = useLedgerStore(state => state.endItem)
  const month = currentMonthKey()

  const focusItems = useMemo(() => {
    return items.filter(item => {
      if (item.status === 'draft') return false
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
      <PageHeader title="月度确认" subtitle={`${month} · 少改一点也可以`} />

      <Card className="p-4">
        <h2 className="font-bold">本月重点项</h2>
        <p className="mt-1 text-sm text-[#76877e]">现金、投资、贷款和待确认记录会优先出现在这里。</p>
      </Card>

      {focusItems.length === 0 ? (
        <Card className="p-6 text-center text-sm text-[#8c9b94]">暂无需要确认的项目。</Card>
      ) : (
        <div className="space-y-3">
          {focusItems.map(item => {
            const shouldEnd = item.endMonth && compareMonth(item.endMonth, month) <= 0 && item.status === 'active'
            return (
              <Card key={item.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-bold">{item.name}</p>
                    <p className="mt-1 text-xs text-[#76877e]">{getCategoryLabel(item.category)} · {getStatusLabel(item.status)}</p>
                    {shouldEnd && <p className="mt-2 text-xs text-[#a44f4f]">可能已到结束月份，请确认。</p>}
                  </div>
                  <p className="font-black">{formatWan(item.amount)}</p>
                </div>
                <div className="mt-3 flex gap-2">
                  {item.status === 'pending_confirmation' && (
                    <Button size="sm" onClick={() => confirmItem(item.id)}>确认有效</Button>
                  )}
                  {shouldEnd && (
                    <Button size="sm" variant="danger" onClick={() => endItem(item.id)}>确认结束</Button>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Button
        size="lg"
        className="w-full"
        onClick={() => {
          const snapshot = createSnapshot(month)
          alert(`已生成 ${snapshot.month} 月度快照`)
        }}
      >
        生成本月快照
      </Button>

      {latest && (
        <Card className="p-4">
          <h2 className="font-bold">本月已生成快照</h2>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
            <div className="rounded-xl bg-[#f1f6f4] p-3">
              <p className="text-xs text-[#76877e]">资产</p>
              <b>{formatWan(latest.totals.totalAssets)}</b>
            </div>
            <div className="rounded-xl bg-[#f8f1f1] p-3">
              <p className="text-xs text-[#8d7474]">负债</p>
              <b>{formatWan(latest.totals.totalLiabilities)}</b>
            </div>
            <div className="rounded-xl bg-[#f7faf8] p-3">
              <p className="text-xs text-[#76877e]">净值</p>
              <b>{formatWan(latest.totals.netWorth)}</b>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
