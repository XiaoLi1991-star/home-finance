import { describe, expect, it } from 'vitest'
import { migrateV1Backup } from './migration'
import type { V1BackupLike } from '@/types/ledger'

const sampleBackup: V1BackupLike = {
  version: 1,
  timestamp: '2026-05-15T01:16:30.112Z',
  assets: [
    {
      id: 'asset-insurance',
      name: '保险',
      type: 'investment',
      subType: 'insurance',
      amount: 12.6,
      description: '养老保险',
      purchaseDate: '2026-01-01',
      createdAt: '2026-01-31T19:37:23.350Z'
    },
    {
      id: 'asset-fund',
      name: '基金',
      type: 'investment',
      subType: 'fund',
      amount: 2.4,
      description: '个人养老金',
      purchaseDate: '2025-12-01',
      createdAt: '2026-01-31T19:36:34.243Z'
    },
    {
      id: 'asset-car',
      name: '自用车',
      type: 'vehicle',
      subType: 'personal_car',
      amount: 5,
      description: '领克',
      purchaseDate: '2025-12-01',
      createdAt: '2026-01-31T19:34:52.308Z'
    },
    {
      id: 'asset-home',
      name: '住宅',
      type: 'property',
      subType: 'residence',
      amount: 190,
      purchaseDate: '2025-12-01',
      createdAt: '2026-01-31T17:53:59.355Z'
    },
    {
      id: 'asset-cash-ended',
      name: '钱包现金',
      type: 'cash',
      subType: 'wallet_cash',
      amount: 10,
      purchaseDate: '2026-01-01',
      maturityDate: '2026-01-01',
      createdAt: '2026-01-31T17:48:20.189Z'
    }
  ],
  liabilities: [
    {
      id: 'loan-active',
      name: '住房贷款',
      type: 'mortgage',
      subType: 'housing_loan',
      amount: 57.1,
      startDate: '2026-02-01',
      createdAt: '2026-02-03T08:08:41.322Z'
    },
    {
      id: 'loan-ended',
      name: '公积金贷款',
      type: 'mortgage',
      subType: 'provident_loan',
      amount: 29.4,
      startDate: '2025-12-01',
      endDate: '2026-01-01',
      createdAt: '2026-01-31T19:12:49.869Z'
    }
  ]
}

describe('v1 migration', () => {
  it('maps the confirmed v1 categories into v2 ledger categories', () => {
    const result = migrateV1Backup(sampleBackup, {
      now: '2026-05-15T00:00:00.000Z',
      currentMonth: '2026-05'
    })

    expect(result.summary.assetsRead).toBe(5)
    expect(result.summary.liabilitiesRead).toBe(2)
    expect(result.summary.itemsCreated).toBe(7)

    expect(result.items.find(item => item.source.sourceId === 'asset-insurance')?.category).toBe('insurance_pensions')
    expect(result.items.find(item => item.source.sourceId === 'asset-fund')?.category).toBe('insurance_pensions')
    expect(result.items.find(item => item.source.sourceId === 'asset-car')?.category).toBe('vehicles_goods')
    expect(result.items.find(item => item.source.sourceId === 'asset-home')?.category).toBe('property_real_estate')
    expect(result.items.find(item => item.source.sourceId === 'loan-active')?.category).toBe('liabilities_loans')
    expect(result.items.find(item => item.source.sourceId === 'loan-ended')?.subType).toBe('provident_loan')
  })

  it('marks past-ended records as pending confirmation instead of ending them automatically', () => {
    const result = migrateV1Backup(sampleBackup, {
      now: '2026-05-15T00:00:00.000Z',
      currentMonth: '2026-05'
    })

    const endedCash = result.items.find(item => item.source.sourceId === 'asset-cash-ended')
    const endedLoan = result.items.find(item => item.source.sourceId === 'loan-ended')

    expect(endedCash?.status).toBe('pending_confirmation')
    expect(endedLoan?.status).toBe('pending_confirmation')
    expect(result.summary.pendingConfirmationCount).toBeGreaterThanOrEqual(2)
  })
})

