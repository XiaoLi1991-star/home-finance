import { describe, expect, it } from 'vitest'
import { applyAmountEdit } from './history'
import { createMonthlySnapshot, upsertSnapshot } from './snapshots'
import { buildTrendFromSnapshots } from './calculations'
import type { LedgerItem } from '@/types/ledger'

const baseItem: LedgerItem = {
  id: 'asset-1',
  kind: 'asset',
  category: 'cash_accounts',
  subType: 'wallet_cash',
  name: 'Cash',
  owner: 'joint',
  amount: 10,
  amountUnit: 'wan_cny',
  startMonth: '2026-05',
  status: 'active',
  templateFields: {},
  customFields: [],
  createdAt: '2026-05-01T00:00:00.000Z',
  updatedAt: '2026-05-01T00:00:00.000Z',
  source: { system: 'manual' }
}

describe('snapshots and history', () => {
  it('creates valuation history when amount changes', () => {
    const result = applyAmountEdit(baseItem, 12, {
      now: '2026-05-15T00:00:00.000Z',
      month: '2026-05',
      reason: 'manual_edit'
    })

    expect(result.item.amount).toBe(12)
    expect(result.history?.previousAmount).toBe(10)
    expect(result.history?.amount).toBe(12)
  })

  it('creates monthly snapshots and trend points', () => {
    const may = createMonthlySnapshot([baseItem], {
      month: '2026-05',
      now: '2026-05-31T00:00:00.000Z'
    })
    const juneItem = { ...baseItem, amount: 12, updatedAt: '2026-06-01T00:00:00.000Z' }
    const june = createMonthlySnapshot([juneItem], {
      month: '2026-06',
      now: '2026-06-30T00:00:00.000Z'
    })

    const snapshots = upsertSnapshot(upsertSnapshot([], may), june)
    const trend = buildTrendFromSnapshots(snapshots)

    expect(snapshots).toHaveLength(2)
    expect(trend.map(point => point.netWorth)).toEqual([10, 12])
  })
})

