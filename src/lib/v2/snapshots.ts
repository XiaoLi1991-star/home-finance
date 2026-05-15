import type { LedgerItem, MonthlySnapshot } from '@/types/ledger'
import { calculateLedgerStats } from './calculations'
import { createLedgerId, currentMonthKey } from './migration'

export function createMonthlySnapshot(
  items: LedgerItem[],
  options: {
    month?: string
    now?: string
  } = {}
): MonthlySnapshot {
  const now = options.now || new Date().toISOString()
  const month = options.month || currentMonthKey(new Date(now))
  const stats = calculateLedgerStats(items)

  return {
    id: createLedgerId('snap'),
    month,
    createdAt: now,
    totals: stats.totals,
    byCategory: stats.byCategory,
    byOwner: stats.byOwner,
    itemCount: stats.activeItems.length,
    items: stats.activeItems.map(item => ({
      itemId: item.id,
      kind: item.kind,
      category: item.category,
      owner: item.owner,
      amount: item.amount,
      status: item.status
    }))
  }
}

export function upsertSnapshot(snapshots: MonthlySnapshot[], snapshot: MonthlySnapshot): MonthlySnapshot[] {
  const withoutCurrentMonth = snapshots.filter(item => item.month !== snapshot.month)
  return [...withoutCurrentMonth, snapshot].sort((a, b) => a.month.localeCompare(b.month))
}

export function getLatestSnapshot(snapshots: MonthlySnapshot[]): MonthlySnapshot | undefined {
  return [...snapshots].sort((a, b) => b.month.localeCompare(a.month))[0]
}

