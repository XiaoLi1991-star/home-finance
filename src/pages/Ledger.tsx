import { Link } from 'react-router-dom'
import { Car, ChevronDown, CreditCard, Home as HomeIcon, Plus, Search, ShieldCheck, TrendingUp, Wallet, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { PageHeader } from '@/components/PageHeader'
import { CATEGORY_META, getCategoryLabel, getStatusLabel, getSubTypeLabel, type CategoryMeta } from '@/lib/v2/categories'
import { createLedgerDemoItems, isLedgerDemoMode } from '@/lib/demo/ledgerDemo'
import { cn, formatWan } from '@/lib/utils'
import { useLedgerStore } from '@/store/useLedgerStore'
import { useSettingsStore } from '@/store/useSettingsStore'
import type { LedgerCategory, LedgerItem, LedgerKind, LedgerStatus } from '@/types/ledger'
import { useEffect, useMemo, useState } from 'react'

const CATEGORY_VISUALS: Record<LedgerCategory, {
  icon: LucideIcon
  accent: string
  tint: string
  chip: string
  amount: string
}> = {
  cash_accounts: {
    icon: Wallet,
    accent: 'bg-brand',
    tint: 'bg-[#eefaf5]',
    chip: 'bg-brand-light/80 text-brand-dark',
    amount: 'text-brand-dark'
  },
  investments: {
    icon: TrendingUp,
    accent: 'bg-[#4f7fb8]',
    tint: 'bg-[#eef5ff]',
    chip: 'bg-info-light/80 text-[#486c9f]',
    amount: 'text-[#486c9f]'
  },
  insurance_pensions: {
    icon: ShieldCheck,
    accent: 'bg-[#8b8fb9]',
    tint: 'bg-[#f1f2fb]',
    chip: 'bg-[#e7e9f8] text-[#686fa3]',
    amount: 'text-[#686fa3]'
  },
  property_real_estate: {
    icon: HomeIcon,
    accent: 'bg-[#c9a463]',
    tint: 'bg-[#fff8e6]',
    chip: 'bg-[#fff1c2] text-[#8a6a21]',
    amount: 'text-[#8a6a21]'
  },
  vehicles_goods: {
    icon: Car,
    accent: 'bg-[#8b9a74]',
    tint: 'bg-[#f3f7ec]',
    chip: 'bg-[#e8efd8] text-[#66784b]',
    amount: 'text-[#66784b]'
  },
  liabilities_loans: {
    icon: CreditCard,
    accent: 'bg-danger',
    tint: 'bg-danger-light/50',
    chip: 'bg-danger-light text-danger',
    amount: 'text-danger'
  }
}

export default function Ledger() {
  const storedItems = useLedgerStore(state => state.items)
  const hidden = useSettingsStore(state => state.privacy.hideAmounts)
  const [query, setQuery] = useState('')
  const [kind, setKind] = useState<LedgerKind | 'all'>('all')
  const [category, setCategory] = useState<LedgerCategory | 'all'>('all')
  const demoMode = isLedgerDemoMode()
  const items = useMemo(() => demoMode ? createLedgerDemoItems() : storedItems, [demoMode, storedItems])
  const hasFocusedFilter = category !== 'all' || Boolean(query.trim())

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter(item => {
      if (kind !== 'all' && item.kind !== kind) return false
      if (category !== 'all' && item.category !== category) return false
      if (!q) return true
      return `${item.name} ${item.note || ''} ${item.subType}`.toLowerCase().includes(q)
    })
  }, [category, items, kind, query])

  const grouped = useMemo(() => {
    return CATEGORY_META
      .map(meta => ({
        meta,
        items: filtered.filter(item => item.category === meta.value)
      }))
      .filter(group => group.items.length > 0)
  }, [filtered])

  return (
    <div className="space-y-4 pb-24">
      <PageHeader
        title="台账"
        subtitle={demoMode ? '演示数据，仅用于查看长列表效果' : '资产和负债都在这里'}
      />

      <div className="flex items-start gap-2">
        <Card className="min-w-0 flex-1 p-3">
          <details>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
              <span className="flex min-w-0 items-center gap-2 font-bold">
                <Search className="h-4 w-4 shrink-0 text-ink-muted" />
                <span className="truncate">筛选与搜索</span>
              </span>
              <span className="shrink-0 text-xs text-ink-muted">{getFilterLabel(kind, category, query)}</span>
            </summary>
            <div className="mt-3 space-y-3">
              <label className="flex items-center gap-2 rounded-xl bg-surface-dark px-3 py-2">
                <Search className="h-4 w-4 text-ink-muted" />
                <input
                  value={query}
                  onChange={event => setQuery(event.target.value)}
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-light"
                  placeholder="搜索名称、备注、分类"
                />
              </label>
              <div className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {(['all', 'asset', 'liability'] as const).map(value => (
                  <button
                    key={value}
                    onClick={() => setKind(value)}
                    className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${
                      kind === value ? 'bg-brand text-white' : 'bg-surface-dark text-ink-muted'
                    }`}
                  >
                    {value === 'all' ? '全部' : value === 'asset' ? '资产' : '负债'}
                  </button>
                ))}
                <button
                  onClick={() => setCategory('all')}
                  className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${
                    category === 'all' ? 'bg-brand text-white' : 'bg-surface-dark text-ink-muted'
                  }`}
                >
                  全分类
                </button>
                {CATEGORY_META.map(meta => (
                  <button
                    key={meta.value}
                    onClick={() => setCategory(meta.value)}
                    className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${
                      category === meta.value ? 'bg-brand text-white' : 'bg-surface-dark text-ink-muted'
                    }`}
                  >
                    {meta.label}
                  </button>
                ))}
              </div>
            </div>
          </details>
        </Card>
        <Link to="/ledger/new" className="shrink-0">
          <Button size="icon" aria-label="新增记录" className="h-[54px] w-[54px] rounded-[20px] shadow-[0_10px_22px_rgba(79,155,121,0.22)]">
            <Plus className="h-5 w-5" />
          </Button>
        </Link>
      </div>

      {grouped.length === 0 ? (
        <Card className="p-6 text-center text-sm text-ink-muted">暂无符合条件的台账记录。</Card>
      ) : (
        <div className="space-y-5">
          {grouped.map(group => (
            <LedgerCategorySection
              key={group.meta.value}
              meta={group.meta}
              items={group.items}
              hidden={hidden}
              forceExpanded={hasFocusedFilter}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function LedgerCategorySection({
  meta,
  items,
  hidden,
  forceExpanded
}: {
  meta: CategoryMeta
  items: LedgerItem[]
  hidden: boolean
  forceExpanded: boolean
}) {
  const [showEnded, setShowEnded] = useState(false)
  const currentItems = items.filter(item => item.status !== 'ended')
  const endedItems = items.filter(item => item.status === 'ended')
  const visual = CATEGORY_VISUALS[meta.value]
  const Icon = visual.icon
  const currentTotal = sumAmounts(currentItems)
  const hasPending = items.some(item => item.status === 'pending_confirmation' || item.status === 'draft')
  const shouldDefaultExpand = forceExpanded || hasPending || meta.value === 'cash_accounts' || meta.value === 'investments' || meta.value === 'liabilities_loans'
  const [expanded, setExpanded] = useState(shouldDefaultExpand)

  useEffect(() => {
    if (forceExpanded || hasPending) setExpanded(true)
  }, [forceExpanded, hasPending])

  return (
    <section className="space-y-2">
      <button
        type="button"
        className={cn('flex w-full items-center justify-between gap-3 rounded-[18px] border border-white/80 px-3 py-2.5 text-left shadow-[0_10px_24px_rgba(36,53,47,0.05)] transition active:scale-[0.995]', visual.tint)}
        aria-expanded={expanded}
        onClick={() => setExpanded(value => !value)}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm', visual.accent)}>
            <Icon className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-black">{meta.label}</h2>
            <p className="mt-0.5 text-[11px] text-ink-muted">
              当前 {currentItems.length} 项{endedItems.length > 0 ? ` · 已结束 ${endedItems.length} 项` : ''}
            </p>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[10px] text-ink-muted">小计</p>
          <p className={cn('mt-0.5 text-sm font-black', visual.amount)}>{formatWan(currentTotal, hidden)}</p>
        </div>
        <ChevronDown className={cn('h-4 w-4 shrink-0 text-ink-muted transition-transform', expanded && 'rotate-180')} />
      </button>
      {items.length === 0 ? (
        <Card className="p-6 text-center text-sm text-ink-muted">暂无记录</Card>
      ) : expanded ? (
        <div className="space-y-2">
          {currentItems.length === 0 && (
            <Card className="p-4 text-sm text-ink-muted">暂无当前记录，已结束项目在下方折叠。</Card>
          )}
          {currentItems.map(item => (
            <LedgerCard key={item.id} item={item} hidden={hidden} />
          ))}
          {endedItems.length > 0 && (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowEnded(value => !value)}
                className="flex w-full items-center justify-between rounded-xl border border-dashed border-surface-border bg-surface-dim px-3 py-2 text-xs font-semibold text-ink-muted active:bg-surface-dark"
              >
                <span>已结束项目 {endedItems.length} 项</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${showEnded ? 'rotate-180' : ''}`} />
              </button>
              {showEnded && (
                <div className="mt-2 space-y-2">
                  {endedItems.map(item => (
                    <LedgerCard key={item.id} item={item} muted hidden={hidden} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : null}
    </section>
  )
}

function LedgerCard({ item, muted = false, hidden }: { item: LedgerItem; muted?: boolean; hidden: boolean }) {
  const visual = CATEGORY_VISUALS[item.category]
  const sourceLabel = getSourceLabel(item)
  const statusTone = getStatusTone(item.status)

  return (
    <Link className="block" to={`/ledger/${item.id}`}>
      <Card className={cn('relative overflow-hidden active:bg-surface-dim', muted ? 'border-surface-border bg-surface-dim/80 p-3 opacity-70 grayscale' : 'bg-white/86 p-3')}>
        <span className={cn('absolute left-0 top-0 h-full w-1', visual.accent)} />
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <p className="truncate text-[15px] font-black leading-tight">{item.name}</p>
              <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold', muted ? 'bg-surface-border text-ink-muted' : statusTone)}>
                {getStatusLabel(item.status)}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-ink-muted">
              <span className={cn('rounded-full px-2 py-0.5 font-semibold', muted ? 'bg-surface-border text-ink-muted' : visual.chip)}>
                {getSubTypeLabel(item.category, item.subType)}
              </span>
              {sourceLabel && <span>{sourceLabel}</span>}
              <span>开始 {item.startMonth}</span>
            </div>
          </div>
          <p className={cn('shrink-0 text-right text-base font-black leading-tight', muted ? 'text-ink-light' : item.kind === 'asset' ? visual.amount : 'text-danger')}>
            {item.kind === 'asset' ? '+' : '-'}
            {formatWan(item.amount, hidden)}
          </p>
        </div>
        {(item.note || item.migrationWarnings?.length) && (
          <p className="mt-2 line-clamp-1 rounded-lg bg-surface-dim px-2.5 py-1.5 text-xs text-ink-muted">
            {item.note || item.migrationWarnings?.[0]}
          </p>
        )}
      </Card>
    </Link>
  )
}

function sumAmounts(items: LedgerItem[]) {
  return items.reduce((total, item) => total + item.amount, 0)
}

function getStatusTone(status: LedgerStatus) {
  if (status === 'active') return 'bg-brand-light/70 text-brand-dark'
  if (status === 'pending_confirmation') return 'bg-[#fff1c2] text-[#8a6a21]'
  if (status === 'draft') return 'bg-surface-dark text-ink-muted'
  return 'bg-surface-border text-ink-muted'
}

function getSourceLabel(item: LedgerItem) {
  if (item.source.system === 'ai_entry') return 'AI 录入'
  if (item.source.system === 'v1_migration' || item.source.system === 'ai_migration') return '迁移'
  return ''
}

function getFilterLabel(kind: LedgerKind | 'all', category: LedgerCategory | 'all', query: string) {
  const parts = []
  if (kind !== 'all') parts.push(kind === 'asset' ? '资产' : '负债')
  if (category !== 'all') parts.push(getCategoryLabel(category))
  if (query.trim()) parts.push('已搜索')
  return parts.length > 0 ? parts.join(' · ') : '默认'
}
