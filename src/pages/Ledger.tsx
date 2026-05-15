import { Link } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { PageHeader } from '@/components/PageHeader'
import { CATEGORY_META, getCategoryLabel, getStatusLabel, getSubTypeLabel } from '@/lib/v2/categories'
import { formatWan } from '@/lib/utils'
import { useLedgerStore } from '@/store/useLedgerStore'
import type { LedgerCategory, LedgerKind } from '@/types/ledger'
import { useMemo, useState } from 'react'

export default function Ledger() {
  const items = useLedgerStore(state => state.items)
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
        action={
          <Link to="/ledger/new">
            <Button size="icon" aria-label="新增记录">
              <Plus className="h-5 w-5" />
            </Button>
          </Link>
        }
      />

      <Card className="p-3">
        <label className="flex items-center gap-2 rounded-xl bg-[#f1f6f4] px-3 py-2">
          <Search className="h-4 w-4 text-[#8c9b94]" />
          <input
            value={query}
            onChange={event => setQuery(event.target.value)}
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#9aa7a1]"
            placeholder="搜索名称、备注、分类"
          />
        </label>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {(['all', 'asset', 'liability'] as const).map(value => (
            <button
              key={value}
              onClick={() => setKind(value)}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${
                kind === value ? 'bg-[#4f9b79] text-white' : 'bg-[#eef3f0] text-[#4f6f62]'
              }`}
            >
              {value === 'all' ? '全部' : value === 'asset' ? '资产' : '负债'}
            </button>
          ))}
          <button
            onClick={() => setCategory('all')}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${
              category === 'all' ? 'bg-[#4f9b79] text-white' : 'bg-[#eef3f0] text-[#4f6f62]'
            }`}
          >
            全分类
          </button>
          {CATEGORY_META.map(meta => (
            <button
              key={meta.value}
              onClick={() => setCategory(meta.value)}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${
                category === meta.value ? 'bg-[#4f9b79] text-white' : 'bg-[#eef3f0] text-[#4f6f62]'
              }`}
            >
              {meta.label}
            </button>
          ))}
        </div>
      </Card>

      <LedgerSection title="资产" items={assets} empty="暂无资产记录" />
      <LedgerSection title="负债" items={liabilities} empty="暂无负债记录" />
    </div>
  )
}

function LedgerSection({ title, items, empty }: { title: string; items: ReturnType<typeof useLedgerStore.getState>['items']; empty: string }) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between px-1">
        <h2 className="font-bold">{title}</h2>
        <span className="text-xs text-[#76877e]">{items.length} 项</span>
      </div>
      {items.length === 0 ? (
        <Card className="p-6 text-center text-sm text-[#8c9b94]">{empty}</Card>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <Link key={item.id} to={`/ledger/${item.id}`}>
              <Card className="p-4 active:bg-[#f7faf8]">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-bold">{item.name}</p>
                      <span className="rounded-full bg-[#eef3f0] px-2 py-0.5 text-[10px] text-[#4f6f62]">
                        {getStatusLabel(item.status)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[#76877e]">
                      {getCategoryLabel(item.category)} · {getSubTypeLabel(item.category, item.subType)}
                    </p>
                  </div>
                  <p className={`shrink-0 text-right font-black ${item.kind === 'asset' ? 'text-[#287a5c]' : 'text-[#a44f4f]'}`}>
                    {item.kind === 'asset' ? '+' : '-'}
                    {formatWan(item.amount)}
                  </p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
