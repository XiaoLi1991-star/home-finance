import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Car,
  CheckCircle2,
  Clock3,
  CreditCard,
  Home as HomeIcon,
  Plus,
  ShieldCheck,
  TrendingUp,
  Upload,
  Wallet,
  type LucideIcon
} from 'lucide-react'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { PageHeader } from '@/components/PageHeader'
import { createFailedReport, generateMonthlyAiReport } from '@/lib/ai/reports'
import { getAiApiKey } from '@/lib/native/secrets'
import { getCategoryLabel, getStatusLabel, getSubTypeLabel } from '@/lib/v2/categories'
import { compareMonth, currentMonthKey } from '@/lib/v2/migration'
import { cn, formatWan } from '@/lib/utils'
import { releaseScreenWakeLock, requestScreenWakeLock } from '@/lib/wakeLock'
import { useLedgerStore } from '@/store/useLedgerStore'
import { useSettingsStore } from '@/store/useSettingsStore'
import type { LedgerCategory, LedgerItem } from '@/types/ledger'

const MONTHLY_CATEGORY_VISUALS: Record<LedgerCategory, {
  icon: LucideIcon
  accent: string
  tint: string
  chip: string
  amount: string
}> = {
  cash_accounts: {
    icon: Wallet,
    accent: 'bg-brand',
    tint: 'bg-[#eef8f4]',
    chip: 'bg-[#dff2eb] text-[#347c6f]',
    amount: 'text-[#347c6f]'
  },
  investments: {
    icon: TrendingUp,
    accent: 'bg-[#5f85ad]',
    tint: 'bg-[#eef4fb]',
    chip: 'bg-[#e4edf7] text-[#4d6f95]',
    amount: 'text-[#4d6f95]'
  },
  insurance_pensions: {
    icon: ShieldCheck,
    accent: 'bg-[#8587aa]',
    tint: 'bg-[#f2f2fa]',
    chip: 'bg-[#e8e9f4] text-[#686b99]',
    amount: 'text-[#686b99]'
  },
  property_real_estate: {
    icon: HomeIcon,
    accent: 'bg-[#b9955a]',
    tint: 'bg-[#fbf5e8]',
    chip: 'bg-[#f4ead4] text-[#7e6435]',
    amount: 'text-[#7e6435]'
  },
  vehicles_goods: {
    icon: Car,
    accent: 'bg-[#7f8d6c]',
    tint: 'bg-[#f4f7ef]',
    chip: 'bg-[#e7eddd] text-[#63714f]',
    amount: 'text-[#63714f]'
  },
  liabilities_loans: {
    icon: CreditCard,
    accent: 'bg-[#b56b6b]',
    tint: 'bg-[#fbf0ef]',
    chip: 'bg-[#f3dedb] text-[#8f5353]',
    amount: 'text-[#8f5353]'
  }
}

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
        <Card className={`p-3 text-sm ${notice.tone === 'error' ? 'border-[#f0d6d2] bg-[#f8eeee] text-[#8f5353]' : 'text-ink-muted'}`}>
          {notice.text}
        </Card>
      )}

      {monthlyReportAutoGenerate && (
        <Card className={`p-3 text-sm shadow-none ${saving ? 'border-[#d9eee6] bg-[#edf7f2] text-[#347c6f]' : 'border-surface-dark bg-white/70 text-ink-muted'}`}>
          <p className="font-semibold text-ink">生成 AI 月报时请保持 App 在前台</p>
          <p className="mt-1 leading-5">
            {saving
              ? '正在生成月报和背景图，请先不要锁屏、切到后台或退出页面。'
              : '月报生成会调用模型服务，锁屏或切到后台时手机可能暂停网络请求。'}
          </p>
        </Card>
      )}

      <Card className="border-[#d9eee6] bg-[#edf7f2] p-3 shadow-none">
        <div className="flex items-start gap-3">
          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#3f9b7f]" />
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
          {focusItems.map(item => (
            <MonthlyFocusItemCard
              key={item.id}
              item={item}
              month={month}
              hidden={hidden}
              onConfirm={confirmItem}
              onEnd={endItem}
            />
          ))}
        </div>
      )}

      <Button
        size="lg"
        variant={hasSnapshotRecords ? 'primary' : 'secondary'}
        className={hasSnapshotRecords ? 'w-full shadow-[0_8px_18px_rgba(79,155,121,0.18)]' : 'w-full border-dashed bg-surface-dim text-ink-muted shadow-none'}
        disabled={saving || !hasSnapshotRecords}
        onClick={async () => {
          if (!hasSnapshotRecords) return
          setSaving(true)
          const snapshot = createSnapshot(month)
          const wakeLock = monthlyReportAutoGenerate ? await requestScreenWakeLock() : null
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
            await releaseScreenWakeLock(wakeLock)
            setSaving(false)
          }
        }}
      >
        {saving ? '生成中，请保持前台...' : hasSnapshotRecords ? '生成本月快照' : '添加记录后可生成快照'}
      </Button>

      {latest && (
        <Card className="p-4">
          <h2 className="font-bold">本月已生成快照</h2>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
            <div className="rounded-xl bg-surface-dark p-3">
              <p className="text-xs text-ink-muted">资产</p>
              <b>{formatWan(latest.totals.totalAssets, hidden)}</b>
            </div>
            <div className="rounded-xl bg-[#f8eeee] p-3">
              <p className="text-xs text-[#8f5353]">负债</p>
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

function MonthlyFocusItemCard({
  item,
  month,
  hidden,
  onConfirm,
  onEnd
}: {
  item: LedgerItem
  month: string
  hidden: boolean
  onConfirm: (id: string) => void
  onEnd: (id: string) => void
}) {
  const shouldEnd = Boolean(item.endMonth && compareMonth(item.endMonth, month) <= 0 && item.status === 'active')
  const needsAction = item.status === 'pending_confirmation' || shouldEnd
  const visual = MONTHLY_CATEGORY_VISUALS[item.category]
  const Icon = visual.icon

  return (
    <Card className={cn('relative overflow-hidden border-white/80 bg-white/90 p-0', needsAction && 'ring-1 ring-[#8fb7a9]/30')}>
      <span className={cn('absolute left-0 top-0 h-full w-1', visual.accent)} />
      <div className={cn('flex items-start gap-3 px-3 py-3', visual.tint)}>
        <span className={cn('mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm', visual.accent)}>
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <h3 className="truncate text-[15px] font-black leading-tight">{item.name}</h3>
            {needsAction && (
              <span className="shrink-0 rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-semibold text-[#347c6f]">
                待处理
              </span>
            )}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-ink-muted">
            <span className={cn('rounded-full px-2 py-0.5 font-semibold', visual.chip)}>
              {getCategoryLabel(item.category)}
            </span>
            <span className="rounded-full bg-white/70 px-2 py-0.5">
              {getSubTypeLabel(item.category, item.subType)}
            </span>
            <span className="rounded-full bg-white/70 px-2 py-0.5">
              {getStatusLabel(item.status)}
            </span>
          </div>
        </div>
        <p className={cn('shrink-0 text-right text-base font-black leading-tight', visual.amount)}>
          {item.kind === 'liability' ? '-' : '+'}
          {formatWan(item.amount, hidden)}
        </p>
      </div>

      {(needsAction || item.note) && (
        <div className="space-y-2 px-3 py-2.5">
          {needsAction && (
            <div className={cn('flex items-start gap-2 rounded-xl px-3 py-2 text-xs', shouldEnd ? 'bg-[#f7e9e7] text-[#8f5353]' : 'bg-[#e5f3ed] text-[#347c6f]')}>
              {shouldEnd ? <Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
              <span>{shouldEnd ? `结束月份为 ${item.endMonth}，本月需要确认是否结束。` : '这条记录确认后，会纳入本月快照。'}</span>
            </div>
          )}
          {item.note && (
            <p className="line-clamp-1 rounded-xl bg-surface-dim px-3 py-2 text-xs text-ink-muted">{item.note}</p>
          )}
        </div>
      )}

      {needsAction && (
        <div className="flex gap-2 px-3 pb-3">
          {item.status === 'pending_confirmation' && (
            <Button size="sm" className="flex-1" onClick={() => onConfirm(item.id)}>确认有效</Button>
          )}
          {shouldEnd && (
            <Button size="sm" variant="danger" className="flex-1" onClick={() => onEnd(item.id)}>确认结束</Button>
          )}
        </div>
      )}
    </Card>
  )
}
