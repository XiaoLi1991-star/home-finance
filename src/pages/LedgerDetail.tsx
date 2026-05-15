import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CheckCircle2, Pencil, XCircle } from 'lucide-react'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { PageHeader } from '@/components/PageHeader'
import { getCategoryLabel, getOwnerLabel, getStatusLabel, getSubTypeLabel } from '@/lib/v2/categories'
import { formatWan } from '@/lib/utils'
import { useLedgerStore } from '@/store/useLedgerStore'
import type { ValuationChangeReason } from '@/types/ledger'

const historyReasonLabels: Record<ValuationChangeReason, string> = {
  manual_edit: '手动修改',
  monthly_confirmation: '月度确认',
  migration: '迁移导入',
  ai_entry: 'AI 录入',
  restore: '备份恢复'
}

export default function LedgerDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [confirmingEnd, setConfirmingEnd] = useState(false)
  const items = useLedgerStore(state => state.items)
  const allHistories = useLedgerStore(state => state.histories)
  const item = useMemo(() => items.find(entry => entry.id === id), [id, items])
  const histories = useMemo(() => allHistories.filter(history => history.itemId === id), [allHistories, id])
  const confirmItem = useLedgerStore(state => state.confirmItem)
  const endItem = useLedgerStore(state => state.endItem)

  if (!item) {
    return (
      <div className="space-y-4 pb-24">
        <PageHeader title="记录不存在" back />
        <Card className="p-6 text-center text-sm text-ink-muted">这条记录可能已经被删除。</Card>
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-24">
      <PageHeader
        title={item.name}
        subtitle={`${getCategoryLabel(item.category)} · ${getSubTypeLabel(item.category, item.subType)}`}
        back
        action={
          <Link to={`/ledger/${item.id}/edit`}>
            <Button size="icon" variant="secondary" aria-label="编辑">
              <Pencil className="h-4 w-4" />
            </Button>
          </Link>
        }
      />

      <Card className="p-5">
        <p className="text-xs text-ink-muted">当前金额</p>
        <p className={`mt-1 text-3xl font-black ${item.kind === 'asset' ? 'text-brand-dark' : 'text-danger'}`}>
          {item.kind === 'asset' ? '+' : '-'}
          {formatWan(item.amount)}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <Info label="归属人" value={getOwnerLabel(item.owner)} />
          <Info label="状态" value={getStatusLabel(item.status)} />
          <Info label="开始月份" value={item.startMonth} />
          <Info label="结束月份" value={item.endMonth || '长期'} />
        </div>
        {item.note && <p className="mt-4 rounded-xl bg-surface-dim p-3 text-sm text-ink-muted">{item.note}</p>}
      </Card>

      {(item.status === 'draft' || item.status === 'pending_confirmation') && (
        <Button className="w-full" onClick={() => {
          confirmItem(item.id)
          navigate('/ledger')
        }}>
          <CheckCircle2 className="h-4 w-4" />
          确认为有效
        </Button>
      )}

      {item.status !== 'ended' && !confirmingEnd && (
        <Button variant="danger" className="w-full" onClick={() => {
          setConfirmingEnd(true)
        }}>
          <XCircle className="h-4 w-4" />
          标记已结束
        </Button>
      )}

      {item.status !== 'ended' && confirmingEnd && (
        <Card className="space-y-3 border-danger-light bg-danger-light p-4 text-sm text-[#8d4b4b]">
          <p className="font-semibold">确认将这条记录标记为已结束？</p>
          <p>结束后它不会再作为当前有效记录参与月度确认。</p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" type="button" onClick={() => setConfirmingEnd(false)}>取消</Button>
            <Button
              variant="danger"
              type="button"
              onClick={() => {
                endItem(item.id)
                navigate('/ledger')
              }}
            >
              确认结束
            </Button>
          </div>
        </Card>
      )}

      <details className="rounded-lg border border-surface-border bg-white p-4">
        <summary className="cursor-pointer font-bold">历史记录（默认归档）</summary>
        {histories.length === 0 ? (
          <p className="mt-3 text-sm text-ink-muted">暂无金额变动历史。</p>
        ) : (
          <div className="mt-3 space-y-2">
            {histories.map(history => (
              <div key={history.id} className="rounded-xl bg-surface-dim p-3 text-sm">
                <div className="flex justify-between">
                  <span>{history.month}</span>
                  <b>{formatWan(history.amount)}</b>
                </div>
                <p className="mt-1 text-xs text-ink-muted">{historyReasonLabels[history.reason] || '金额更新'}</p>
              </div>
            ))}
          </div>
        )}
      </details>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface-dim p-3">
      <p className="text-xs text-ink-muted">{label}</p>
      <p className="mt-1 font-bold">{value}</p>
    </div>
  )
}
