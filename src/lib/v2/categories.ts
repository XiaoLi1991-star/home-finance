import type { LedgerCategory, LedgerKind, LedgerOwner, LedgerStatus } from '@/types/ledger'

export interface SubTypeMeta {
  value: string
  label: string
  v1SubTypes?: string[]
}

export interface CategoryMeta {
  value: LedgerCategory
  label: string
  kind: LedgerKind | 'mixed'
  defaultSubType: string
  subTypes: SubTypeMeta[]
  priorityForMonthlyConfirmation: boolean
  stableByDefault: boolean
}

export const OWNER_OPTIONS: { value: LedgerOwner; label: string }[] = [
  { value: 'me', label: '我' },
  { value: 'spouse', label: '配偶' },
  { value: 'joint', label: '共同' },
  { value: 'child', label: '孩子' },
  { value: 'parents', label: '父母' },
  { value: 'other', label: '其他' }
]

export const STATUS_LABELS: Record<LedgerStatus, string> = {
  active: '有效',
  ended: '已结束',
  pending_confirmation: '待确认',
  draft: '草稿'
}

export const CATEGORY_META: CategoryMeta[] = [
  {
    value: 'cash_accounts',
    label: '现金与账户',
    kind: 'asset',
    defaultSubType: 'wallet_cash',
    priorityForMonthlyConfirmation: true,
    stableByDefault: false,
    subTypes: [
      { value: 'wallet_cash', label: '钱包现金', v1SubTypes: ['wallet_cash'] },
      { value: 'reserve_cash', label: '备用金', v1SubTypes: ['reserve_cash'] },
      { value: 'bank_account', label: '银行账户', v1SubTypes: ['demand_deposit', 'time_deposit'] },
      { value: 'bank_wealth', label: '银行理财', v1SubTypes: ['bank_wealth'] },
      { value: 'other', label: '其他现金', v1SubTypes: ['other'] }
    ]
  },
  {
    value: 'investments',
    label: '投资账户',
    kind: 'asset',
    defaultSubType: 'stock',
    priorityForMonthlyConfirmation: true,
    stableByDefault: false,
    subTypes: [
      { value: 'stock', label: '股票', v1SubTypes: ['stock'] },
      { value: 'fund', label: '基金', v1SubTypes: ['fund'] },
      { value: 'bond', label: '债券', v1SubTypes: ['bond'] },
      { value: 'gold', label: '黄金', v1SubTypes: ['gold'] },
      { value: 'bank_wealth', label: '银行理财', v1SubTypes: ['bank_wealth'] },
      { value: 'other', label: '其他投资', v1SubTypes: ['other'] }
    ]
  },
  {
    value: 'insurance_pensions',
    label: '保险与养老金',
    kind: 'asset',
    defaultSubType: 'insurance',
    priorityForMonthlyConfirmation: false,
    stableByDefault: true,
    subTypes: [
      { value: 'insurance', label: '保险', v1SubTypes: ['insurance'] },
      { value: 'personal_pension', label: '个人养老金' },
      { value: 'commercial_insurance', label: '商业保险' },
      { value: 'other', label: '其他保险养老金', v1SubTypes: ['other'] }
    ]
  },
  {
    value: 'property_real_estate',
    label: '房产与车位',
    kind: 'asset',
    defaultSubType: 'residence',
    priorityForMonthlyConfirmation: false,
    stableByDefault: true,
    subTypes: [
      { value: 'residence', label: '住宅', v1SubTypes: ['residence'] },
      { value: 'parking', label: '车位', v1SubTypes: ['parking'] },
      { value: 'shop', label: '商铺', v1SubTypes: ['shop'] },
      { value: 'land', label: '土地', v1SubTypes: ['land'] },
      { value: 'other', label: '其他房产', v1SubTypes: ['other'] }
    ]
  },
  {
    value: 'vehicles_goods',
    label: '车辆与大件',
    kind: 'asset',
    defaultSubType: 'personal_car',
    priorityForMonthlyConfirmation: false,
    stableByDefault: true,
    subTypes: [
      { value: 'personal_car', label: '自用车', v1SubTypes: ['personal_car'] },
      { value: 'business_car', label: '经营用车', v1SubTypes: ['business_car'] },
      { value: 'high_value_goods', label: '高值物品' },
      { value: 'other', label: '其他车辆大件', v1SubTypes: ['other'] }
    ]
  },
  {
    value: 'liabilities_loans',
    label: '负债与贷款',
    kind: 'liability',
    defaultSubType: 'housing_loan',
    priorityForMonthlyConfirmation: true,
    stableByDefault: false,
    subTypes: [
      { value: 'housing_loan', label: '住房贷款', v1SubTypes: ['housing_loan'] },
      { value: 'provident_loan', label: '公积金贷款', v1SubTypes: ['provident_loan'] },
      { value: 'car_loan', label: '车贷', v1SubTypes: ['auto_loan', 'car_loan'] },
      { value: 'credit_card', label: '信用卡', v1SubTypes: ['bill', 'installment'] },
      { value: 'consumer_loan', label: '消费贷', v1SubTypes: ['consumption_loan'] },
      { value: 'other', label: '其他贷款', v1SubTypes: ['other'] }
    ]
  }
]

export function getCategoryMeta(category: LedgerCategory): CategoryMeta {
  const meta = CATEGORY_META.find(item => item.value === category)
  if (!meta) throw new Error(`Unknown ledger category: ${category}`)
  return meta
}

export function getCategoryLabel(category: LedgerCategory): string {
  return getCategoryMeta(category).label
}

export function getSubTypeLabel(category: LedgerCategory, subType: string): string {
  const meta = getCategoryMeta(category)
  return meta.subTypes.find(item => item.value === subType)?.label || '其他'
}

export function getOwnerLabel(owner: LedgerOwner): string {
  return OWNER_OPTIONS.find(item => item.value === owner)?.label || '其他'
}

export function getStatusLabel(status: LedgerStatus): string {
  return STATUS_LABELS[status]
}

export interface MappingResult {
  category: LedgerCategory
  subType: string
  confidence: number
  warnings: string[]
}

function containsAny(text: string, terms: string[]): boolean {
  return terms.some(term => text.includes(term))
}

export function mapV1AssetCategory(type?: string, subType?: string, name = '', description = ''): MappingResult {
  const rawType = type || ''
  const rawSubType = subType || ''
  const text = `${name} ${description}`.toLowerCase()
  const warnings: string[] = []

  if (rawType === 'cash' || rawType === 'bank_deposit') {
    if (rawSubType === 'bank_wealth') return { category: 'investments', subType: 'bank_wealth', confidence: 0.9, warnings }
    if (rawSubType === 'time_deposit' || rawSubType === 'demand_deposit') return { category: 'cash_accounts', subType: 'bank_account', confidence: 0.95, warnings }
    return { category: 'cash_accounts', subType: rawSubType || 'wallet_cash', confidence: 0.95, warnings }
  }

  if (rawType === 'investment') {
    if (rawSubType === 'insurance' || containsAny(text, ['保险', 'pension', '养老金', 'annuity'])) {
      return { category: 'insurance_pensions', subType: containsAny(text, ['养老金', 'pension']) ? 'personal_pension' : 'insurance', confidence: 0.9, warnings }
    }
    if (['fund', 'stock', 'bond', 'gold', 'bank_wealth'].includes(rawSubType)) {
      return { category: 'investments', subType: rawSubType, confidence: 0.95, warnings }
    }
    warnings.push(`Unrecognized investment subtype: ${rawSubType || 'empty'}`)
    return { category: 'investments', subType: 'other', confidence: 0.65, warnings }
  }

  if (rawType === 'property') {
    const mapped = ['residence', 'parking', 'shop', 'land'].includes(rawSubType) ? rawSubType : 'other'
    if (mapped === 'other' && rawSubType) warnings.push(`Unrecognized property subtype: ${rawSubType}`)
    return { category: 'property_real_estate', subType: mapped, confidence: mapped === 'other' ? 0.75 : 0.95, warnings }
  }

  if (rawType === 'vehicle') {
    const mapped = ['personal_car', 'business_car'].includes(rawSubType) ? rawSubType : 'other'
    if (mapped === 'other' && rawSubType) warnings.push(`Unrecognized vehicle subtype: ${rawSubType}`)
    return { category: 'vehicles_goods', subType: mapped, confidence: mapped === 'other' ? 0.75 : 0.95, warnings }
  }

  warnings.push(`Unrecognized asset type: ${rawType || 'empty'}`)
  return { category: 'investments', subType: 'other', confidence: 0.45, warnings }
}

export function mapV1LiabilityCategory(type?: string, subType?: string): MappingResult {
  const rawType = type || ''
  const rawSubType = subType || ''
  const warnings: string[] = []

  if (rawType === 'mortgage') {
    if (rawSubType === 'provident_loan') {
      return { category: 'liabilities_loans', subType: 'provident_loan', confidence: 0.98, warnings }
    }
    return { category: 'liabilities_loans', subType: 'housing_loan', confidence: 0.95, warnings }
  }

  if (rawType === 'car_loan') {
    return { category: 'liabilities_loans', subType: 'car_loan', confidence: 0.95, warnings }
  }

  if (rawType === 'credit_card') {
    return { category: 'liabilities_loans', subType: 'credit_card', confidence: 0.95, warnings }
  }

  if (rawType === 'personal_loan') {
    return { category: 'liabilities_loans', subType: 'consumer_loan', confidence: 0.85, warnings }
  }

  warnings.push(`Unrecognized liability type: ${rawType || 'empty'}`)
  return { category: 'liabilities_loans', subType: 'other', confidence: 0.55, warnings }
}
