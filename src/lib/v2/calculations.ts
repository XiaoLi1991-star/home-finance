import type { LedgerCategory, LedgerItem, LedgerOwner, LedgerTotals, MonthlySnapshot } from '@/types/ledger'

export interface LedgerStats {
  totals: LedgerTotals
  byCategory: Record<LedgerCategory, number>
  byOwner: Record<LedgerOwner, number>
  activeItems: LedgerItem[]
  activeAssetCount: number
  activeLiabilityCount: number
}

const CATEGORIES: LedgerCategory[] = [
  'cash_accounts',
  'investments',
  'insurance_pensions',
  'property_real_estate',
  'vehicles_goods',
  'liabilities_loans'
]

const OWNERS: LedgerOwner[] = ['me', 'spouse', 'joint', 'child', 'parents', 'other']

export function emptyCategoryTotals(): Record<LedgerCategory, number> {
  return CATEGORIES.reduce((acc, category) => {
    acc[category] = 0
    return acc
  }, {} as Record<LedgerCategory, number>)
}

export function emptyOwnerTotals(): Record<LedgerOwner, number> {
  return OWNERS.reduce((acc, owner) => {
    acc[owner] = 0
    return acc
  }, {} as Record<LedgerOwner, number>)
}

export function getActiveItems(items: LedgerItem[]): LedgerItem[] {
  return items.filter(item => item.status === 'active')
}

export function calculateLedgerStats(items: LedgerItem[]): LedgerStats {
  const activeItems = getActiveItems(items)
  const byCategory = emptyCategoryTotals()
  const byOwner = emptyOwnerTotals()

  let totalAssets = 0
  let totalLiabilities = 0
  let liquidityAmount = 0

  for (const item of activeItems) {
    byCategory[item.category] += item.amount
    byOwner[item.owner] += item.kind === 'asset' ? item.amount : -item.amount

    if (item.kind === 'asset') {
      totalAssets += item.amount
      if (item.category === 'cash_accounts') liquidityAmount += item.amount
    } else {
      totalLiabilities += item.amount
    }
  }

  const netWorth = totalAssets - totalLiabilities
  const debtRatio = totalAssets > 0 ? totalLiabilities / totalAssets : 0
  const liquidityRatio = totalLiabilities > 0 ? liquidityAmount / totalLiabilities : (liquidityAmount > 0 ? 1 : 0)

  return {
    totals: {
      totalAssets,
      totalLiabilities,
      netWorth,
      debtRatio,
      liquidityAmount,
      liquidityRatio
    },
    byCategory,
    byOwner,
    activeItems,
    activeAssetCount: activeItems.filter(item => item.kind === 'asset').length,
    activeLiabilityCount: activeItems.filter(item => item.kind === 'liability').length
  }
}

export interface TrendPoint {
  month: string
  totalAssets: number
  totalLiabilities: number
  netWorth: number
}

export function buildTrendFromSnapshots(snapshots: MonthlySnapshot[]): TrendPoint[] {
  return [...snapshots]
    .sort((a, b) => a.month.localeCompare(b.month))
    .map(snapshot => ({
      month: snapshot.month,
      totalAssets: snapshot.totals.totalAssets,
      totalLiabilities: snapshot.totals.totalLiabilities,
      netWorth: snapshot.totals.netWorth
    }))
}

