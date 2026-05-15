import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { PageHeader } from '@/components/PageHeader'
import { CATEGORY_META, OWNER_OPTIONS, getCategoryMeta } from '@/lib/v2/categories'
import { createManualLedgerItem } from '@/lib/v2/items'
import { getCurrentMonth } from '@/lib/utils'
import { useLedgerStore } from '@/store/useLedgerStore'
import type { LedgerCategory, LedgerKind, LedgerOwner, LedgerStatus } from '@/types/ledger'

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
    const parsedAmount = Number(amount)
    if (!name.trim()) {
      alert('请输入名称')
      return
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
      alert('请输入有效金额')
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
      <Card className="space-y-4 p-4">
        <Field label="类型">
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant={kind === 'asset' ? 'primary' : 'secondary'} onClick={() => onKindChange('asset')}>资产</Button>
            <Button type="button" variant={kind === 'liability' ? 'primary' : 'secondary'} onClick={() => onKindChange('liability')}>负债</Button>
          </div>
        </Field>

        <Field label="大类">
          <select className="input" value={category} onChange={event => {
            const value = event.target.value as LedgerCategory
            setCategory(value)
            setSubType(getCategoryMeta(value).defaultSubType)
          }}>
            {categoryOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </Field>

        <Field label="子类">
          <select className="input" value={subType} onChange={event => setSubType(event.target.value)}>
            {meta.subTypes.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </Field>

        <Field label="名称">
          <input className="input" value={name} onChange={event => setName(event.target.value)} placeholder="例如 住宅、领克、住房贷款" />
        </Field>

        <Field label="归属人">
          <select className="input" value={owner} onChange={event => setOwner(event.target.value as LedgerOwner)}>
            {OWNER_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
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
          <select className="input" value={status} onChange={event => setStatus(event.target.value as LedgerStatus)}>
            <option value="active">有效</option>
            <option value="pending_confirmation">待确认</option>
            <option value="draft">草稿</option>
            <option value="ended">已结束</option>
          </select>
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
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-[#4f6f62]">{label}</span>
      {children}
    </label>
  )
}
