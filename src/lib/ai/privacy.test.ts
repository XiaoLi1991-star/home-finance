import { describe, expect, it } from 'vitest'
import { buildPrivacySummary } from './privacy'
import { createManualLedgerItem } from '@/lib/v2/items'

describe('AI privacy summary', () => {
  it('omits raw ledger item names', () => {
    const items = [
      createManualLedgerItem({
        kind: 'asset',
        category: 'cash_accounts',
        name: '我的具体银行卡',
        amount: 3
      }, '2026-05-15T00:00:00.000Z')
    ]
    const summary = buildPrivacySummary(items, [], '2026-05')

    expect(JSON.stringify(summary)).not.toContain('我的具体银行卡')
    expect(summary.totals.totalAssets).toBe(3)
  })
})
