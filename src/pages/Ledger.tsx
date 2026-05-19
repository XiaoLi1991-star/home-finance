import { Link } from 'react-router-dom'
import { ChevronDown, Plus, Search } from 'lucide-react'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { PageHeader } from '@/components/PageHeader'
import { CATEGORY_META, getCategoryLabel, getStatusLabel, getSubTypeLabel } from '@/lib/v2/categories'
import { formatWan } from '@/lib/utils'
import { useLedgerStore } from '@/store/useLedgerStore'
import { useSettingsStore } from '@/store/useSettingsStore'
import type { LedgerCategory, LedgerItem, LedgerKind } from '@/types/ledger'
import { useMemo, useState } from 'react'

export default function Ledger() {
  const items = useLedgerStore(state => state.items)
  const hidden = useSettingsStore(state => state.privacy.hideAmounts)
  const [query, setQuery] = useState('')
  const [kind, setKind] = useState<LedgerKind | 'all'>('all')
  const [category, setCategory] = useState<LedgerCategory | 'all'>('all')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter(item => {
      if (kind !== 'all' && item.kind !== kind) return false
      if (category !== 'all' && item.category !== category) return false
      if (!q) return true
      return `${item.name} ${item.note || ''} ${item.subType}`.toLowerCase().includes(q)
    })
  }, [category, items, kind, query])

  const assets = filtered.filter(item => item.kind === 'asset')
  const liabilities = filtered.filter(item => item.kind === 'liability')

  return (
    <div className="space-y-4 pb-24">
      <PageHeader
        title="台账"
        subtitle="资产和负债都在这里"
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

      <LedgerSection title="资产" items={assets} empty="暂无资产记录" hidden={hidden} />
      <LedgerSection title="负债" items={liabilities} empty="暂无负债记录" hidden={hidden} />
    </div>
  )
}

function LedgerSection({ title, items, empty, hidden }: { title: string; items: LedgerItem[]; empty: string; hidden: boolean }) {
  const [showEnded, setShowEnded] = useState(false)
  const currentItems = items.filter(item => item.status !== 'ended')
  const endedItems = items.filter(item => item.status === 'ended')

  return (
    <section>
      <div className="mb-2 flex items-center justify-between px-1">
        <h2 className="font-bold">{title}</h2>
        <span className="text-xs text-ink-muted">
          {currentItems.length} 项
        </span>
      </div>
      {items.length === 0 ? (
        <Card className="p-6 text-center text-sm text-ink-muted">{empty}</Card>
      ) : (
        <div className="space-y-2">
          {currentItems.length === 0 && (
            <Card className="p-4 text-sm text-ink-muted">暂无有效记录，已结束项目在下方折叠。</Card>
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
                <span>已结束{title} {endedItems.length} 项</span>
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
      )}
    </section>
  )
}

function LedgerCard({ item, muted = false, hidden }: { item: LedgerItem; muted?: boolean; hidden: boolean }) {
  return (
    <Link className="block" to={`/ledger/${item.id}`}>
      <Card className={`${muted ? 'border-surface-border bg-surface-dim/80 p-3 opacity-70 grayscale' : 'p-4'} active:bg-surface-dim`}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate font-bold">{item.name}</p>
              <span className={`rounded-full px-2 py-0.5 text-[10px] ${muted ? 'bg-surface-border text-ink-muted' : 'bg-surface-dark text-ink-muted'}`}>
                {getStatusLabel(item.status)}
              </span>
            </div>
            <p className="mt-1 text-xs text-ink-muted">
              {getCategoryLabel(item.category)} · {getSubTypeLabel(item.category, item.subType)}
            </p>
          </div>
          <p className={`shrink-0 text-right font-black ${muted ? 'text-ink-light' : item.kind === 'asset' ? 'text-brand-dark' : 'text-danger'}`}>
            {item.kind === 'asset' ? '+' : '-'}
            {formatWan(item.amount, hidden)}
          </p>
        </div>
      </Card>
    </Link>
  )
}

function getFilterLabel(kind: LedgerKind | 'all', category: LedgerCategory | 'all', query: string) {
  const parts = []
  if (kind !== 'all') parts.push(kind === 'asset' ? '资产' : '负债')
  if (category !== 'all') parts.push(getCategoryLabel(category))
  if (query.trim()) parts.push('已搜索')
  return parts.length > 0 ? parts.join(' · ') : '默认'
}
