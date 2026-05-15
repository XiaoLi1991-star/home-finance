import { describe, expect, it } from 'vitest'
import { calculateLedgerStats } from './calculations'
import { calculateFamilyStatusScore } from './scoring'
import type { LedgerItem } from '@/types/ledger'

function item(patch: Partial<LedgerItem>): LedgerItem {
  return {
    id: patch.id || 'item',
    kind: patch.kind || 'asset',
    category: patch.category || 'cash_accounts',
    subType: patch.subType || 'wallet_cash',
    name: patch.name || 'Item',
    owner: patch.owner || 'joint',
    amount: patch.amount ?? 0,
    amountUnit: 'wan_cny',
    startMonth: patch.startMonth || '2026-05',
    endMonth: patch.endMonth,
    note: patch.note,
    status: patch.status || 'active',
    templateFields: patch.templateFields || {},
    customFields: patch.customFields || [],
    createdAt: patch.createdAt || '2026-05-15T00:00:00.000Z',
    updatedAt: patch.updatedAt || '2026-05-15T00:00:00.000Z',
    source: patch.source || { system: 'manual' }
  }
}

describe('ledger calculations', () => {
  it('only includes active records in current totals', () => {
    const stats = calculateLedgerStats([
      item({ id: 'cash', kind: 'asset', category: 'cash_accounts', amount: 10, status: 'active' }),
      item({ id: 'home', kind: 'asset', category: 'property_real_estate', amount: 190, status: 'active' }),
      item({ id: 'draft', kind: 'asset', category: 'investments', amount: 999, status: 'draft' }),
      item({ id: 'pending', kind: 'asset', category: 'investments', amount: 999, status: 'pending_confirmation' }),
      item({ id: 'ended', kind: 'asset', category: 'cash_accounts', amount: 999, status: 'ended' }),
      item({ id: 'loan', kind: 'liability', category: 'liabilities_loans', amount: 100, status: 'active' })
    ])

    expect(stats.totals.totalAssets).toBe(200)
    expect(stats.totals.totalLiabilities).toBe(100)
    expect(stats.totals.netWorth).toBe(100)
    expect(stats.byCategory.cash_accounts).toBe(10)
    expect(stats.activeItems).toHaveLength(3)
  })

  it('calculates a rule-based family status score from debt and liquidity pressure', () => {
    const stats = calculateLedgerStats([
      item({ id: 'cash', kind: 'asset', category: 'cash_accounts', amount: 1 }),
      item({ id: 'home', kind: 'asset', category: 'property_real_estate', amount: 190 }),
      item({ id: 'loan', kind: 'liability', category: 'liabilities_loans', amount: 180 })
    ])

    const score = calculateFamilyStatusScore(stats.totals)

    expect(score.score).toBeLessThan(75)
    expect(score.reasons.some(reason => reason.includes('Debt'))).toBe(true)
  })
})

