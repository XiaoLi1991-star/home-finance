import {
  LEDGER_AMOUNT_UNIT,
  type LedgerCategory,
  type LedgerItem,
  type LedgerKind,
  type LedgerOwner,
  type LedgerStatus,
  type TemplateFields
} from '@/types/ledger'
import { getCategoryMeta } from './categories'
import { createLedgerId, currentMonthKey } from './migration'

export interface CreateLedgerItemInput {
  kind: LedgerKind
  category: LedgerCategory
  subType?: string
  name: string
  owner?: LedgerOwner
  amount: number
  startMonth?: string
  endMonth?: string
  note?: string
  status?: LedgerStatus
  templateFields?: TemplateFields
}

export function createManualLedgerItem(input: CreateLedgerItemInput, now = new Date().toISOString()): LedgerItem {
  const meta = getCategoryMeta(input.category)
  const amount = Number(input.amount)
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error('Amount must be a non-negative number.')
  }

  return {
    id: createLedgerId('item'),
    kind: input.kind,
    category: input.category,
    subType: input.subType || meta.defaultSubType,
    name: input.name.trim(),
    owner: input.owner || 'joint',
    amount,
    amountUnit: LEDGER_AMOUNT_UNIT,
    startMonth: input.startMonth || currentMonthKey(new Date(now)),
    endMonth: input.endMonth || undefined,
    note: input.note || '',
    status: input.status || 'active',
    templateFields: input.templateFields || {},
    customFields: [],
    createdAt: now,
    updatedAt: now,
    lastValuationAt: now,
    source: { system: 'manual' }
  }
}

