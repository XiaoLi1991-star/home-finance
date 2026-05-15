import {
  LEDGER_AMOUNT_UNIT,
  type LedgerItem,
  type LedgerStatus,
  type TemplateFields,
  type V1AssetLike,
  type V1BackupLike,
  type V1LiabilityLike
} from '@/types/ledger'
import { mapV1AssetCategory, mapV1LiabilityCategory } from './categories'

export interface MigrationSummary {
  sourceVersion: number
  assetsRead: number
  liabilitiesRead: number
  itemsCreated: number
  activeCount: number
  pendingConfirmationCount: number
  lowConfidenceCount: number
  warnings: string[]
}

export interface MigrationResult {
  items: LedgerItem[]
  summary: MigrationSummary
}

export interface MigrationOptions {
  now?: string
  currentMonth?: string
  defaultOwner?: LedgerItem['owner']
}

export function createLedgerId(prefix = 'ledger'): string {
  const random = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID().slice(0, 12)
    : Math.random().toString(36).slice(2, 14)
  return `${prefix}_${random}`
}

export function toMonthKey(value?: string): string {
  if (!value) return ''
  const match = value.match(/^(\d{4})-(\d{2})/)
  if (!match) return ''
  return `${match[1]}-${match[2]}`
}

export function currentMonthKey(now = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${now.getFullYear()}-${month}`
}

export function compareMonth(a: string, b: string): number {
  const aMatch = a.match(/^(\d{4})-(\d{2})$/)
  const bMatch = b.match(/^(\d{4})-(\d{2})$/)
  if (!aMatch || !bMatch) return 0
  const aIndex = Number(aMatch[1]) * 12 + Number(aMatch[2])
  const bIndex = Number(bMatch[1]) * 12 + Number(bMatch[2])
  return aIndex - bIndex
}

export function isPastMonth(month: string | undefined, currentMonth: string): boolean {
  if (!month) return false
  return compareMonth(month, currentMonth) < 0
}

function normalizeAmount(amount?: number): number {
  const parsed = Number(amount)
  return Number.isFinite(parsed) ? parsed : 0
}

function buildStatus(confidence: number, warnings: string[], endMonth: string | undefined, currentMonth: string): LedgerStatus {
  if (confidence < 0.75) return 'pending_confirmation'
  if (isPastMonth(endMonth, currentMonth)) return 'pending_confirmation'
  if (warnings.length > 0) return 'pending_confirmation'
  return 'active'
}

function buildAssetTemplateFields(asset: V1AssetLike, category: LedgerItem['category']): TemplateFields {
  if (category === 'vehicles_goods') {
    return { brandModel: asset.description || asset.name || '' }
  }
  if (category === 'cash_accounts') {
    return { institution: asset.name || '' }
  }
  if (category === 'investments') {
    return { platform: '' }
  }
  return {}
}

function buildLiabilityTemplateFields(liability: V1LiabilityLike): TemplateFields {
  return {
    interestRate: liability.interestRate ?? null,
    monthlyPayment: liability.monthlyPayment ?? null,
    remainingPayments: liability.remainingPayments ?? null,
    repaymentDay: null
  }
}

export function migrateV1Asset(asset: V1AssetLike, options: MigrationOptions = {}): LedgerItem {
  const now = options.now || new Date().toISOString()
  const currentMonth = options.currentMonth || currentMonthKey(new Date(now))
  const mapping = mapV1AssetCategory(asset.type, asset.subType, asset.name, asset.description)
  const startMonth = toMonthKey(asset.purchaseDate || asset.createdAt) || currentMonth
  const endMonth = toMonthKey(asset.maturityDate) || undefined
  const warnings = [...mapping.warnings]
  if (endMonth && isPastMonth(endMonth, currentMonth)) {
    warnings.push(`结束月份为 ${endMonth}，请确认这条记录是否已经结束。`)
  }

  const status = buildStatus(mapping.confidence, warnings, endMonth, currentMonth)
  const updatedAt = asset.createdAt || now

  return {
    id: createLedgerId('item'),
    kind: 'asset',
    category: mapping.category,
    subType: mapping.subType,
    name: asset.name || mapping.subType,
    owner: options.defaultOwner || 'joint',
    amount: normalizeAmount(asset.amount),
    amountUnit: LEDGER_AMOUNT_UNIT,
    startMonth,
    endMonth,
    note: asset.description || '',
    status,
    templateFields: buildAssetTemplateFields(asset, mapping.category),
    customFields: [],
    createdAt: asset.createdAt || now,
    updatedAt,
    lastValuationAt: updatedAt,
    source: {
      system: 'v1_migration',
      sourceId: asset.id,
      rawType: asset.type,
      rawSubType: asset.subType
    },
    confidence: mapping.confidence,
    migrationWarnings: warnings
  }
}

export function migrateV1Liability(liability: V1LiabilityLike, options: MigrationOptions = {}): LedgerItem {
  const now = options.now || new Date().toISOString()
  const currentMonth = options.currentMonth || currentMonthKey(new Date(now))
  const mapping = mapV1LiabilityCategory(liability.type, liability.subType)
  const startMonth = toMonthKey(liability.startDate || liability.createdAt) || currentMonth
  const endMonth = toMonthKey(liability.endDate) || undefined
  const warnings = [...mapping.warnings]
  if (endMonth && isPastMonth(endMonth, currentMonth)) {
    warnings.push(`结束月份为 ${endMonth}，请确认这笔负债是否已经结束。`)
  }

  const status = buildStatus(mapping.confidence, warnings, endMonth, currentMonth)
  const updatedAt = liability.createdAt || now

  return {
    id: createLedgerId('item'),
    kind: 'liability',
    category: 'liabilities_loans',
    subType: mapping.subType,
    name: liability.name || mapping.subType,
    owner: options.defaultOwner || 'joint',
    amount: normalizeAmount(liability.amount),
    amountUnit: LEDGER_AMOUNT_UNIT,
    startMonth,
    endMonth,
    note: liability.description || '',
    status,
    templateFields: buildLiabilityTemplateFields(liability),
    customFields: [],
    createdAt: liability.createdAt || now,
    updatedAt,
    lastValuationAt: updatedAt,
    source: {
      system: 'v1_migration',
      sourceId: liability.id,
      rawType: liability.type,
      rawSubType: liability.subType
    },
    confidence: mapping.confidence,
    migrationWarnings: warnings
  }
}

export function migrateV1Backup(backup: V1BackupLike, options: MigrationOptions = {}): MigrationResult {
  const assets = Array.isArray(backup.assets) ? backup.assets : []
  const liabilities = Array.isArray(backup.liabilities) ? backup.liabilities : []
  const items = [
    ...assets.map(asset => migrateV1Asset(asset, options)),
    ...liabilities.map(liability => migrateV1Liability(liability, options))
  ]
  const warnings = items.flatMap(item => item.migrationWarnings || [])
  const pendingConfirmationCount = items.filter(item => item.status === 'pending_confirmation').length

  return {
    items,
    summary: {
      sourceVersion: backup.version || 1,
      assetsRead: assets.length,
      liabilitiesRead: liabilities.length,
      itemsCreated: items.length,
      activeCount: items.filter(item => item.status === 'active').length,
      pendingConfirmationCount,
      lowConfidenceCount: items.filter(item => (item.confidence ?? 0) < 0.75).length,
      warnings
    }
  }
}

export function parseV1BackupJson(jsonText: string): V1BackupLike {
  const parsed = JSON.parse(jsonText)
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('备份内容格式不正确。')
  }
  if (!Array.isArray(parsed.assets) || !Array.isArray(parsed.liabilities)) {
    throw new Error('没有识别到可导入的旧版备份内容。')
  }
  return parsed as V1BackupLike
}
