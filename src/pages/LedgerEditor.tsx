import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Check, CreditCard, WalletCards, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { PageHeader } from '@/components/PageHeader'
import { CATEGORY_META, OWNER_OPTIONS, getCategoryMeta } from '@/lib/v2/categories'
import { createManualLedgerItem } from '@/lib/v2/items'
import { cn, getCurrentMonth } from '@/lib/utils'
import { useLedgerStore } from '@/store/useLedgerStore'
import type { LedgerCategory, LedgerKind, LedgerOwner, LedgerStatus } from '@/types/ledger'

const STATUS_OPTIONS: { value: LedgerStatus; label: string; hint: string; tone: ChoiceTone }[] = [
  { value: 'active', label: '有效', hint: '纳入统计', tone: 'asset' },
  { value: 'pending_confirmation', label: '待确认', hint: '月度核对', tone: 'info' },
  { value: 'draft', label: '草稿', hint: '暂不统计', tone: 'neutral' },
  { value: 'ended', label: '已结束', hint: '保留历史', tone: 'neutral' }
]

type ChoiceTone = 'asset' | 'liability' | 'info' | 'neutral'

export default function LedgerEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const items = useLedgerStore(state => state.items)
  const addItem = useLedgerStore(state => state.addItem)
  const updateItem = useLedgerStore(state => state.updateItem)
  const updateItemAmount = useLedgerStore(state => state.updateItemAmount)
  const existing = items.find(item => item.id === id)
  const editing = Boolean(existing)

  const [kind, setKind] = useState<LedgerKind>('asset')
  const [category, setCategory] = useState<LedgerCategory>('cash_accounts')
  const [subType, setSubType] = useState('wallet_cash')
  const [name, setName] = useState('')
  const [owner, setOwner] = useState<LedgerOwner>('joint')
  const [amount, setAmount] = useState('')
  const [startMonth, setStartMonth] = useState(getCurrentMonth())
  const [endMonth, setEndMonth] = useState('')
  const [note, setNote] = useState('')
  const [status, setStatus] = useState<LedgerStatus>('active')
  const [templateValue, setTemplateValue] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!existing) return
    setKind(existing.kind)
    setCategory(existing.category)
    setSubType(existing.subType)
    setName(existing.name)
    setOwner(existing.owner)
    setAmount(String(existing.amount))
    setStartMonth(existing.startMonth)
    setEndMonth(existing.endMonth || '')
    setNote(existing.note || '')
    setStatus(existing.status)
    setTemplateValue(String(existing.templateFields.brandModel || existing.templateFields.platform || existing.templateFields.institution || ''))
  }, [existing])

  const categoryOptions = useMemo(() => {
    return CATEGORY_META.filter(meta => meta.kind === kind || meta.kind === 'mixed')
  }, [kind])
  const meta = getCategoryMeta(category)
  const templateLabel = category === 'vehicles_goods'
    ? '品牌/型号'
    : category === 'investments'
      ? '持仓平台/账户'
      : category === 'cash_accounts'
        ? '机构/银行名'
        : ''

  const save = () => {
    setError('')
    const parsedAmount = Number(amount)
    if (!name.trim()) {
      setError('请先填写记录名称。')
      return
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
      setError('请填写有效金额，金额不能小于 0。')
      return
    }

    const templateFields = templateLabel
      ? category === 'vehicles_goods'
        ? { brandModel: templateValue }
        : category === 'investments'
          ? { platform: templateValue }
          : { institution: templateValue }
      : {}

    if (existing) {
      if (parsedAmount !== existing.amount) {
        updateItemAmount(existing.id, parsedAmount)
      }
      updateItem(existing.id, {
        kind,
        category,
        subType,
        name: name.trim(),
        owner,
        startMonth,
        endMonth: endMonth || undefined,
        note,
        status,
        templateFields
      })
    } else {
      addItem(createManualLedgerItem({
        kind,
        category,
        subType,
        name,
        owner,
        amount: parsedAmount,
        startMonth,
        endMonth: endMonth || undefined,
        note,
        status,
        templateFields
      }))
    }
    navigate('/ledger')
  }

  const onKindChange = (nextKind: LedgerKind) => {
    const nextCategory = nextKind === 'asset' ? 'cash_accounts' : 'liabilities_loans'
    setKind(nextKind)
    setCategory(nextCategory)
    setSubType(getCategoryMeta(nextCategory).defaultSubType)
  }

  return (
    <div className="space-y-4 pb-24">
      <PageHeader title={editing ? '编辑记录' : '新增记录'} back />
      {error && <Card className="border-danger-light bg-danger-light p-4 text-sm text-danger">{error}</Card>}
      <Card className="space-y-5 p-4">
        <Field label="类型">
          <div className="grid grid-cols-2 gap-2">
            <KindChoice
              selected={kind === 'asset'}
              tone="asset"
              icon={WalletCards}
              title="资产"
              subtitle="现金、投资、房车"
              onClick={() => onKindChange('asset')}
            />
            <KindChoice
              selected={kind === 'liability'}
              tone="liability"
              icon={CreditCard}
              title="负债"
              subtitle="贷款、账单"
              onClick={() => onKindChange('liability')}
            />
          </div>
        </Field>

        <Field label="大类">
          <div className="grid grid-cols-2 gap-2">
            {categoryOptions.map(option => (
              <ChoiceTile
                key={option.value}
                selected={category === option.value}
                tone={option.kind === 'liability' ? 'liability' : 'asset'}
                title={option.label}
                subtitle={getCategoryHint(option)}
                onClick={() => {
                  setCategory(option.value)
                  setSubType(getCategoryMeta(option.value).defaultSubType)
                }}
              />
            ))}
          </div>
        </Field>

        <Field label="子类">
          <div className="flex flex-wrap gap-2">
            {meta.subTypes.map(option => (
              <PillChoice
                key={option.value}
                selected={subType === option.value}
                tone={kind === 'liability' ? 'liability' : 'asset'}
                onClick={() => setSubType(option.value)}
              >
                {option.label}
              </PillChoice>
            ))}
          </div>
        </Field>

        <Field label="名称">
          <input className="input" value={name} onChange={event => setName(event.target.value)} placeholder="例如 住宅、领克、住房贷款" />
        </Field>

        <Field label="归属人">
          <div className="grid grid-cols-3 gap-2">
            {OWNER_OPTIONS.map(option => (
              <PillChoice
                key={option.value}
                selected={owner === option.value}
                tone="neutral"
                onClick={() => setOwner(option.value)}
              >
                {option.label}
              </PillChoice>
            ))}
          </div>
        </Field>

        <Field label="金额（万元）">
          <input className="input" type="number" step="0.01" value={amount} onChange={event => setAmount(event.target.value)} placeholder="0.00" />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="开始月份">
            <input className="input" type="month" value={startMonth} onChange={event => setStartMonth(event.target.value)} />
          </Field>
          <Field label="结束月份">
            <input className="input" type="month" value={endMonth} onChange={event => setEndMonth(event.target.value)} />
          </Field>
        </div>

        {templateLabel && (
          <Field label={templateLabel}>
            <input className="input" value={templateValue} onChange={event => setTemplateValue(event.target.value)} placeholder="选填" />
          </Field>
        )}

        <Field label="状态">
          <div className="grid grid-cols-2 gap-2">
            {STATUS_OPTIONS.map(option => (
              <ChoiceTile
                key={option.value}
                selected={status === option.value}
                tone={option.tone}
                title={option.label}
                subtitle={option.hint}
                compact
                onClick={() => setStatus(option.value)}
              />
            ))}
          </div>
        </Field>

        <Field label="备注">
          <textarea className="input min-h-24 resize-none py-3" value={note} onChange={event => setNote(event.target.value)} placeholder="选填" />
        </Field>

        <Button type="button" size="lg" onClick={save} className="w-full">保存</Button>
      </Card>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <span className="text-sm font-semibold text-ink-muted">{label}</span>
      {children}
    </div>
  )
}

function KindChoice({
  selected,
  tone,
  icon: Icon,
  title,
  subtitle,
  onClick
}: {
  selected: boolean
  tone: ChoiceTone
  icon: LucideIcon
  title: string
  subtitle: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className={cn(
        'flex min-h-[76px] items-center gap-3 rounded-2xl border p-3 text-left transition focus:outline-none focus:ring-2 focus:ring-brand/15 active:scale-[0.99]',
        selected ? selectedChoiceClass(tone) : 'border-surface-border bg-surface-dim/70 text-ink'
      )}
      onClick={onClick}
    >
      <span
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
          selected ? selectedIconClass(tone) : 'bg-white text-ink-muted'
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-black">{title}</span>
        <span className="mt-0.5 block text-xs text-ink-muted">{subtitle}</span>
      </span>
    </button>
  )
}

function ChoiceTile({
  selected,
  tone,
  title,
  subtitle,
  compact = false,
  onClick
}: {
  selected: boolean
  tone: ChoiceTone
  title: string
  subtitle: string
  compact?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className={cn(
        'relative rounded-2xl border text-left transition focus:outline-none focus:ring-2 focus:ring-brand/15 active:scale-[0.99]',
        compact ? 'min-h-[62px] p-3' : 'min-h-[78px] p-3.5',
        selected ? selectedChoiceClass(tone) : 'border-surface-border bg-surface-dim/70 text-ink'
      )}
      onClick={onClick}
    >
      <span className="block pr-6 text-sm font-black leading-5">{title}</span>
      <span className="mt-1 block text-xs text-ink-muted">{subtitle}</span>
      {selected && (
        <span className={cn('absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full', selectedIconClass(tone))}>
          <Check className="h-3.5 w-3.5" />
        </span>
      )}
    </button>
  )
}

function PillChoice({
  selected,
  tone,
  children,
  onClick
}: {
  selected: boolean
  tone: ChoiceTone
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className={cn(
        'min-h-10 rounded-full border px-3.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-brand/15 active:scale-[0.98]',
        selected ? selectedChoiceClass(tone) : 'border-surface-border bg-surface-dim/70 text-ink-muted'
      )}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

function selectedChoiceClass(tone: ChoiceTone) {
  if (tone === 'liability') return 'border-danger-light bg-danger-light/75 text-danger shadow-[0_8px_20px_rgba(225,29,72,0.08)] focus:ring-danger/15'
  if (tone === 'info') return 'border-info-light bg-info-light/80 text-info shadow-[0_8px_20px_rgba(59,130,246,0.08)] focus:ring-info/15'
  if (tone === 'asset') return 'border-brand-light bg-brand-light/75 text-brand-dark shadow-[0_8px_20px_rgba(16,185,129,0.08)] focus:ring-brand/15'
  return 'border-surface-border bg-white text-ink shadow-[0_8px_20px_rgba(36,53,47,0.06)] focus:ring-ink/10'
}

function selectedIconClass(tone: ChoiceTone) {
  if (tone === 'liability') return 'bg-danger text-white'
  if (tone === 'info') return 'bg-info text-white'
  if (tone === 'asset') return 'bg-brand text-white'
  return 'bg-ink text-white'
}

function getCategoryHint(option: (typeof CATEGORY_META)[number]) {
  if (option.kind === 'liability') return '负债项目'
  if (option.priorityForMonthlyConfirmation) return '月度重点'
  if (option.stableByDefault) return '长期记录'
  return '常规记录'
}
