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

  it('calculates asset health from expected net worth', () => {
    const stats = calculateLedgerStats([
      item({ id: 'cash', kind: 'asset', category: 'cash_accounts', amount: 10 }),
      item({ id: 'home', kind: 'asset', category: 'property_real_estate', amount: 190 })
    ])

    const score = calculateFamilyStatusScore(stats.totals, { birthYear: 1986, annualIncomeWan: 50 }, 2026)

    expect(score.expectedNetWorth).toBe(200)
    expect(score.accumulationRatio).toBe(1)
    expect(score.score).toBe(80)
    expect(score.title).toBe('积累良好')
  })

  it('caps asset health score at 100 for twice expected net worth', () => {
    const stats = calculateLedgerStats([
      item({ id: 'home', kind: 'asset', category: 'property_real_estate', amount: 500 })
    ])

    const score = calculateFamilyStatusScore(stats.totals, { birthYear: 1986, annualIncomeWan: 50 }, 2026)

    expect(score.accumulationRatio).toBeGreaterThan(2)
    expect(score.score).toBe(100)
    expect(score.title).toBe('表现突出')
  })

  it('does not produce a misleading score when totals are empty', () => {
    const stats = calculateLedgerStats([])
    const score = calculateFamilyStatusScore(stats.totals, { birthYear: 1986, annualIncomeWan: 50 }, 2026)

    expect(score.level).toBe('empty')
    expect(score.score).toBe(0)
    expect(score.title).toBe('还没有可计算数据')
  })

  it('requires birth year and annual income before scoring', () => {
    const stats = calculateLedgerStats([
      item({ id: 'home', kind: 'asset', category: 'property_real_estate', amount: 200 })
    ])
    const score = calculateFamilyStatusScore(stats.totals, undefined, 2026)

    expect(score.level).toBe('missing_profile')
    expect(score.score).toBe(0)
    expect(score.title).toBe('先填写健康度参数')
  })
})
