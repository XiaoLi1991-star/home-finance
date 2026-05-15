import { Link, useNavigate, useParams } from 'react-router-dom'
import { CheckCircle2, Pencil, XCircle } from 'lucide-react'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { PageHeader } from '@/components/PageHeader'
import { getCategoryLabel, getOwnerLabel, getStatusLabel, getSubTypeLabel } from '@/lib/v2/categories'
import { formatWan } from '@/lib/utils'
import { useLedgerStore } from '@/store/useLedgerStore'

export default function LedgerDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const item = useLedgerStore(state => state.items.find(entry => entry.id === id))
  const histories = useLedgerStore(state => state.histories.filter(history => history.itemId === id))
  const confirmItem = useLedgerStore(state => state.confirmItem)
  const endItem = useLedgerStore(state => state.endItem)

  if (!item) {
    return (
      <div className="space-y-4 pb-24">
        <PageHeader title="记录不存在" back />
        <Card className="p-6 text-center text-sm text-[#76877e]">这条记录可能已经被删除。</Card>
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
        <p className="text-xs text-[#76877e]">当前金额</p>
        <p className={`mt-1 text-3xl font-black ${item.kind === 'asset' ? 'text-[#287a5c]' : 'text-[#a44f4f]'}`}>
          {item.kind === 'asset' ? '+' : '-'}
          {formatWan(item.amount)}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <Info label="归属人" value={getOwnerLabel(item.owner)} />
          <Info label="状态" value={getStatusLabel(item.status)} />
          <Info label="开始月份" value={item.startMonth} />
          <Info label="结束月份" value={item.endMonth || '长期'} />
        </div>
        {item.note && <p className="mt-4 rounded-xl bg-[#f7faf8] p-3 text-sm text-[#55645e]">{item.note}</p>}
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

      {item.status !== 'ended' && (
        <Button variant="danger" className="w-full" onClick={() => {
          if (confirm('确认将该记录标记为已结束？')) {
            endItem(item.id)
            navigate('/ledger')
          }
        }}>
          <XCircle className="h-4 w-4" />
          标记已结束
        </Button>
      )}

      <details className="rounded-lg border border-[#dce8e2] bg-white p-4">
        <summary className="cursor-pointer font-bold">历史记录（默认归档）</summary>
        {histories.length === 0 ? (
          <p className="mt-3 text-sm text-[#8c9b94]">暂无金额变动历史。</p>
        ) : (
          <div className="mt-3 space-y-2">
            {histories.map(history => (
              <div key={history.id} className="rounded-xl bg-[#f7faf8] p-3 text-sm">
                <div className="flex justify-between">
                  <span>{history.month}</span>
                  <b>{formatWan(history.amount)}</b>
                </div>
                <p className="mt-1 text-xs text-[#76877e]">{history.reason}</p>
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
    <div className="rounded-xl bg-[#f7faf8] p-3">
      <p className="text-xs text-[#76877e]">{label}</p>
      <p className="mt-1 font-bold">{value}</p>
    </div>
  )
}
