import { calculateLedgerStats, buildTrendFromSnapshots } from '@/lib/v2/calculations'
import { getCategoryLabel, getOwnerLabel } from '@/lib/v2/categories'
import type { LedgerItem, MonthlySnapshot } from '@/types/ledger'

export interface PrivacySummary {
  month: string
  totals: ReturnType<typeof calculateLedgerStats>['totals']
  categoryTotals: Array<{ category: string; amount: number }>
  ownerTotals: Array<{ owner: string; amount: number }>
  activeCounts: { assets: number; liabilities: number }
  trend: Array<{ month: string; totalAssets: number; totalLiabilities: number; netWorth: number }>
  notes: string[]
}

export function buildPrivacySummary(
  items: LedgerItem[],
  snapshots: MonthlySnapshot[],
  month: string
): PrivacySummary {
  const stats = calculateLedgerStats(items)
  return {
    month,
    totals: stats.totals,
    categoryTotals: Object.entries(stats.byCategory).map(([category, amount]) => ({
      category: getCategoryLabel(category as LedgerItem['category']),
      amount
    })),
    ownerTotals: Object.entries(stats.byOwner).map(([owner, amount]) => ({
      owner: getOwnerLabel(owner as LedgerItem['owner']),
      amount
    })),
    activeCounts: {
      assets: stats.activeAssetCount,
      liabilities: stats.activeLiabilityCount
    },
    trend: buildTrendFromSnapshots(snapshots).slice(-12),
    notes: [
      'This summary omits ledger item names and raw notes.',
      'Amounts are already entered in ten-thousand CNY units.'
    ]
  }
}
