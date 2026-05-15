import { createManualLedgerItem } from '@/lib/v2/items'
import { createLedgerId } from '@/lib/v2/migration'
import type { DraftItem, LedgerCategory, LedgerKind, LedgerOwner } from '@/types/ledger'

export interface AiEntryRecord {
  kind?: LedgerKind
  category?: LedgerCategory
  subType?: string
  name?: string
  owner?: LedgerOwner
  amount?: number
  startMonth?: string
  endMonth?: string
  note?: string
  confidence?: number
  warnings?: string[]
}

function stripJsonFence(text: string): string {
  const trimmed = text.trim()
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/)
  return fenced?.[1]?.trim() || trimmed
}

function extractJson(text: string): unknown {
  const stripped = stripJsonFence(text)
  try {
    return JSON.parse(stripped)
  } catch {
    const objectStart = stripped.indexOf('{')
    const objectEnd = stripped.lastIndexOf('}')
    if (objectStart >= 0 && objectEnd > objectStart) {
      return JSON.parse(stripped.slice(objectStart, objectEnd + 1))
    }
    const arrayStart = stripped.indexOf('[')
    const arrayEnd = stripped.lastIndexOf(']')
    if (arrayStart >= 0 && arrayEnd > arrayStart) {
      return JSON.parse(stripped.slice(arrayStart, arrayEnd + 1))
    }
    throw new Error('AI 返回格式不符合要求，请稍后重试或调整描述。')
  }
}

export function parseAiEntryRecords(text: string): AiEntryRecord[] {
  const parsed = extractJson(text) as { records?: AiEntryRecord[] } | AiEntryRecord[]
  const records = Array.isArray(parsed) ? parsed : parsed.records
  if (!Array.isArray(records)) throw new Error('AI 返回格式不符合要求，请稍后重试或调整描述。')
  return records
}

export function createDraftsFromAiRecords(records: AiEntryRecord[], now = new Date().toISOString()): DraftItem[] {
  return records.map((record, index) => {
    const warnings = [...(record.warnings || [])]
    const kind = record.kind || 'asset'
    const category = record.category || (kind === 'asset' ? 'cash_accounts' : 'liabilities_loans')
    const amount = Number(record.amount)
    if (!record.name) warnings.push('缺少名称，已使用临时名称。')
    if (!Number.isFinite(amount)) warnings.push('金额无法确认，已按 0 处理。')

    const item = createManualLedgerItem({
      kind,
      category,
      subType: record.subType,
      name: record.name || `待确认记录 ${index + 1}`,
      owner: record.owner || 'joint',
      amount: Number.isFinite(amount) ? amount : 0,
      startMonth: record.startMonth,
      endMonth: record.endMonth || undefined,
      note: record.note,
      status: 'draft',
      templateFields: {}
    }, now)

    return {
      id: createLedgerId('draft'),
      item: {
        ...item,
        source: { system: 'ai_entry' },
        confidence: record.confidence ?? 0.7,
        migrationWarnings: warnings
      },
      source: 'ai_entry',
      confidence: record.confidence ?? 0.7,
      warnings,
      createdAt: now
    }
  })
}
