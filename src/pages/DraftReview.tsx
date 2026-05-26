import { Link } from 'react-router-dom'
import { CheckCircle2, Trash2 } from 'lucide-react'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { PageHeader } from '@/components/PageHeader'
import { getCategoryLabel, getStatusLabel, getSubTypeLabel } from '@/lib/v2/categories'
import { getDraftSourceLabel } from '@/lib/v2/drafts'
import { formatWan } from '@/lib/utils'
import { useLedgerStore } from '@/store/useLedgerStore'
import { useSettingsStore } from '@/store/useSettingsStore'

const CONFIRM_BUTTON_CLASS = 'bg-[#78b7a8] shadow-[0_8px_18px_rgba(120,183,168,0.20)] active:bg-[#6aa79a]'

export default function DraftReview() {
  const drafts = useLedgerStore(state => state.drafts)
  const hidden = useSettingsStore(state => state.privacy.hideAmounts)
  const confirmDraft = useLedgerStore(state => state.confirmDraft)
  const confirmAllDrafts = useLedgerStore(state => state.confirmAllDrafts)
  const discardDraft = useLedgerStore(state => state.discardDraft)
  const clearDrafts = useLedgerStore(state => state.clearDrafts)

  return (
    <div className="space-y-4 pb-24">
      <PageHeader title="待确认记录" subtitle="确认后才会写入正式台账" back />

      {drafts.length === 0 ? (
        <Card className="p-6 text-center text-sm text-ink-muted">
          暂无待确认记录。
          <Link className="mt-3 block font-semibold text-brand" to="/ledger">返回台账</Link>
        </Card>
      ) : (
        <>
          <Card className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-bold">共 {drafts.length} 条</h2>
                <p className="mt-1 text-xs text-ink-muted">待确认和草稿不会计入当前统计。</p>
              </div>
              <Button size="sm" variant="ghost" onClick={clearDrafts}>清空</Button>
            </div>
            <Button className={`mt-4 w-full ${CONFIRM_BUTTON_CLASS}`} onClick={confirmAllDrafts}>
              <CheckCircle2 className="h-4 w-4" />
              全部加入台账
            </Button>
          </Card>

          <div className="space-y-3">
            {drafts.map(draft => {
              const amountColor = draft.item.kind === 'asset' ? '#3f776d' : '#8f5f5e'

              return (
                <Card key={draft.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold">{draft.item.name}</h3>
                        <span className="rounded-full bg-surface-dark px-2 py-0.5 text-[10px] text-ink-muted">
                          {getDraftSourceLabel(draft.source)}
                        </span>
                        <span className="rounded-full bg-[#fff6df] px-2 py-0.5 text-[10px] text-[#8d6c23]">
                          {getStatusLabel(draft.item.status)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-ink-muted">
                        {getCategoryLabel(draft.item.category)} · {getSubTypeLabel(draft.item.category, draft.item.subType)}
                      </p>
                    </div>
                    <b className="shrink-0 text-right" style={{ color: amountColor }}>
                      {formatWan(draft.item.amount, hidden)}
                    </b>
                  </div>

                  {draft.warnings.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {draft.warnings.map(warning => (
                        <p key={warning} className="rounded-lg bg-[#fff6df] px-3 py-2 text-xs text-[#7b6427]">{warning}</p>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Button size="sm" className={CONFIRM_BUTTON_CLASS} onClick={() => confirmDraft(draft.id)}>加入台账</Button>
                    <Button size="sm" variant="secondary" onClick={() => discardDraft(draft.id)}>
                      <Trash2 className="h-4 w-4" />
                      丢弃
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
