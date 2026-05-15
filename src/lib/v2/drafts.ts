import { createLedgerId } from './migration'
import type { DraftItem, LedgerItem } from '@/types/ledger'

export function createMigrationDrafts(items: LedgerItem[], now = new Date().toISOString()): DraftItem[] {
  return items.map(item => ({
    id: createLedgerId('draft'),
    item,
    source: 'v1_migration',
    confidence: item.confidence ?? 0.8,
    warnings: item.migrationWarnings || [],
    createdAt: now
  }))
}

export function getDraftSourceLabel(source: DraftItem['source']): string {
  if (source === 'ai_entry') return 'AI 录入'
  if (source === 'ai_migration') return 'AI 迁移'
  return 'v1 迁移'
}
