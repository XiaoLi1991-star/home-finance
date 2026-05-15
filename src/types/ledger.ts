export const LEDGER_SCHEMA_VERSION = 2
export const LEDGER_AMOUNT_UNIT = 'wan_cny' as const

export type LedgerKind = 'asset' | 'liability'

export type LedgerCategory =
  | 'cash_accounts'
  | 'investments'
  | 'insurance_pensions'
  | 'property_real_estate'
  | 'vehicles_goods'
  | 'liabilities_loans'

export type LedgerOwner = 'me' | 'spouse' | 'joint' | 'child' | 'parents' | 'other'

export type LedgerStatus = 'active' | 'ended' | 'pending_confirmation' | 'draft'

export type CustomFieldType = 'text' | 'number' | 'date'

export type TemplateFields = Record<string, string | number | boolean | null | undefined>

export interface CustomField {
  id: string
  key: string
  value: string | number
  type: CustomFieldType
}

export interface LedgerSource {
  system: 'manual' | 'v1_migration' | 'ai_entry' | 'ai_migration'
  sourceId?: string
  rawType?: string
  rawSubType?: string
}

export interface LedgerItem {
  id: string
  kind: LedgerKind
  category: LedgerCategory
  subType: string
  name: string
  owner: LedgerOwner
  amount: number
  amountUnit: typeof LEDGER_AMOUNT_UNIT
  startMonth: string
  endMonth?: string
  note?: string
  status: LedgerStatus
  templateFields: TemplateFields
  customFields: CustomField[]
  createdAt: string
  updatedAt: string
  lastValuationAt?: string
  source: LedgerSource
  confidence?: number
  migrationWarnings?: string[]
}

export type ValuationChangeReason =
  | 'manual_edit'
  | 'monthly_confirmation'
  | 'migration'
  | 'ai_entry'
  | 'restore'

export interface ValuationHistory {
  id: string
  itemId: string
  amount: number
  previousAmount?: number
  amountUnit: typeof LEDGER_AMOUNT_UNIT
  month: string
  changedAt: string
  reason: ValuationChangeReason
  note?: string
}

export interface SnapshotItemSummary {
  itemId: string
  kind: LedgerKind
  category: LedgerCategory
  owner: LedgerOwner
  amount: number
  status: LedgerStatus
}

export interface LedgerTotals {
  totalAssets: number
  totalLiabilities: number
  netWorth: number
  debtRatio: number
  liquidityAmount: number
  liquidityRatio: number
}

export interface MonthlySnapshot {
  id: string
  month: string
  createdAt: string
  totals: LedgerTotals
  byCategory: Record<LedgerCategory, number>
  byOwner: Record<LedgerOwner, number>
  itemCount: number
  items: SnapshotItemSummary[]
}

export type AiReportStatus = 'pending' | 'completed' | 'failed'

export interface AiReportSection {
  title: string
  content: string
}

export interface AiReport {
  id: string
  snapshotId: string
  month: string
  status: AiReportStatus
  generatedAt: string
  model?: string
  providerBaseUrl?: string
  score?: number
  summary?: string
  sections: AiReportSection[]
  disclaimer: string
  error?: string
}

export interface DraftItem {
  id: string
  item: LedgerItem
  source: 'ai_entry' | 'ai_migration' | 'v1_migration'
  confidence: number
  warnings: string[]
  createdAt: string
}

export interface ModelSettings {
  baseUrl: string
  model: string
  requestPath?: string
  compatibilityMode?: 'openai_chat_completions' | 'custom'
  temperature?: number
  maxTokens?: number
  stream?: boolean
  timeoutMs?: number
  retryCount?: number
  customHeaders?: Record<string, string>
}

export interface PrivacySettings {
  hideAmounts: boolean
  blurInBackground: boolean
  launchProtectionEnabled: boolean
}

export interface FinancialProfileSettings {
  birthYear?: number
  annualIncomeWan?: number
}

export interface AppSettings {
  schemaVersion: typeof LEDGER_SCHEMA_VERSION
  model: ModelSettings
  privacy: PrivacySettings
  financialProfile: FinancialProfileSettings
  aiAuthorizations: Record<string, boolean>
  monthlyReportAutoGenerate: boolean
}

export interface LedgerData {
  schemaVersion: typeof LEDGER_SCHEMA_VERSION
  items: LedgerItem[]
  histories: ValuationHistory[]
  snapshots: MonthlySnapshot[]
  reports: AiReport[]
  drafts: DraftItem[]
  settings?: AppSettings
}

export interface V1AssetLike {
  id?: string
  name?: string
  type?: string
  subType?: string
  amount?: number
  description?: string
  purchaseDate?: string
  maturityDate?: string
  interestRate?: number
  createdAt?: string
}

export interface V1LiabilityLike {
  id?: string
  name?: string
  type?: string
  subType?: string
  amount?: number
  description?: string
  startDate?: string
  endDate?: string
  interestRate?: number
  monthlyPayment?: number
  remainingPayments?: number
  createdAt?: string
}

export interface V1BackupLike {
  version?: number
  timestamp?: string
  assets?: V1AssetLike[]
  liabilities?: V1LiabilityLike[]
}
