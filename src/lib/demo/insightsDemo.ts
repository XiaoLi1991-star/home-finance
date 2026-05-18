import type { AiReport, LedgerData, LedgerItem, LedgerTotals, MonthlySnapshot } from '@/types/ledger'

const DEMO_ITEM_IDS = {
  cash: 'demo-cash',
  investment: 'demo-investment',
  pension: 'demo-pension',
  property: 'demo-property',
  loan: 'demo-loan'
}

export function isInsightsDemoMode() {
  if (!import.meta.env.DEV || typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).get('demo') === 'insights'
}

export function createInsightsDemoData(): Pick<LedgerData, 'items' | 'snapshots' | 'reports'> {
  const months = createMonthRange(24)
  const snapshots = months.map((month, index) => createDemoSnapshot(month, index))
  const latestSnapshot = snapshots[snapshots.length - 1]
  const previousSnapshot = snapshots[snapshots.length - 2]

  return {
    items: createDemoItems(latestSnapshot),
    snapshots,
    reports: [
      createDemoReport(latestSnapshot, 0),
      createDemoReport(previousSnapshot, 1)
    ]
  }
}

function createMonthRange(length: number) {
  const end = new Date()
  end.setDate(1)
  return Array.from({ length }, (_, index) => {
    const date = new Date(end)
    date.setMonth(end.getMonth() - (length - index - 1))
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  })
}

function createDemoSnapshot(month: string, index: number): MonthlySnapshot {
  const cash = 32 + index * 0.55 + Math.sin(index / 2.4) * 1.6
  const investments = 86 + index * 2.2 + Math.sin(index / 1.8) * 5.2
  const pension = 24 + index * 0.8
  const property = 238 + index * 1.1
  const vehicles = 13 - Math.min(index * 0.25, 5)
  const loans = Math.max(62, 116 - index * 1.9 + Math.cos(index / 2) * 2.6)

  const totalAssets = roundWan(cash + investments + pension + property + vehicles)
  const totalLiabilities = roundWan(loans)
  const totals: LedgerTotals = {
    totalAssets,
    totalLiabilities,
    netWorth: roundWan(totalAssets - totalLiabilities),
    debtRatio: totalAssets > 0 ? totalLiabilities / totalAssets : 0,
    liquidityAmount: roundWan(cash),
    liquidityRatio: totalLiabilities > 0 ? cash / totalLiabilities : 0
  }

  return {
    id: `demo-snap-${month}`,
    month,
    createdAt: `${month}-28T20:30:00.000Z`,
    totals,
    byCategory: {
      cash_accounts: roundWan(cash),
      investments: roundWan(investments),
      insurance_pensions: roundWan(pension),
      property_real_estate: roundWan(property),
      vehicles_goods: roundWan(vehicles),
      liabilities_loans: totalLiabilities
    },
    byOwner: {
      me: roundWan(totalAssets * 0.28),
      spouse: roundWan(totalAssets * 0.22),
      joint: roundWan(totals.netWorth * 0.5),
      child: 0,
      parents: 0,
      other: 0
    },
    itemCount: 5,
    items: [
      { itemId: DEMO_ITEM_IDS.cash, kind: 'asset', category: 'cash_accounts', owner: 'joint', amount: roundWan(cash), status: 'active' },
      { itemId: DEMO_ITEM_IDS.investment, kind: 'asset', category: 'investments', owner: 'joint', amount: roundWan(investments), status: 'active' },
      { itemId: DEMO_ITEM_IDS.pension, kind: 'asset', category: 'insurance_pensions', owner: 'me', amount: roundWan(pension), status: 'active' },
      { itemId: DEMO_ITEM_IDS.property, kind: 'asset', category: 'property_real_estate', owner: 'joint', amount: roundWan(property), status: 'active' },
      { itemId: DEMO_ITEM_IDS.loan, kind: 'liability', category: 'liabilities_loans', owner: 'joint', amount: totalLiabilities, status: 'active' }
    ]
  }
}

function createDemoItems(snapshot: MonthlySnapshot): LedgerItem[] {
  const categoryAmount = snapshot.byCategory
  const now = new Date().toISOString()
  return [
    createDemoItem('asset', DEMO_ITEM_IDS.cash, 'cash_accounts', '现金储备', categoryAmount.cash_accounts, now),
    createDemoItem('asset', DEMO_ITEM_IDS.investment, 'investments', '长期投资账户', categoryAmount.investments, now),
    createDemoItem('asset', DEMO_ITEM_IDS.pension, 'insurance_pensions', '保险与养老金', categoryAmount.insurance_pensions, now),
    createDemoItem('asset', DEMO_ITEM_IDS.property, 'property_real_estate', '自住房估值', categoryAmount.property_real_estate, now),
    createDemoItem('liability', DEMO_ITEM_IDS.loan, 'liabilities_loans', '住房贷款余额', categoryAmount.liabilities_loans, now)
  ]
}

function createDemoItem(
  kind: LedgerItem['kind'],
  id: string,
  category: LedgerItem['category'],
  name: string,
  amount: number,
  now: string
): LedgerItem {
  return {
    id,
    kind,
    category,
    subType: name,
    name,
    owner: 'joint',
    amount,
    amountUnit: 'wan_cny',
    startMonth: '2024-06',
    status: 'active',
    templateFields: {},
    customFields: [],
    createdAt: now,
    updatedAt: now,
    source: { system: 'manual' }
  }
}

function createDemoReport(snapshot: MonthlySnapshot, offset: number): AiReport {
  const generatedAt = new Date(`${snapshot.month}-28T21:00:00.000Z`)
  generatedAt.setMinutes(generatedAt.getMinutes() + offset)

  return {
    id: `demo-report-${snapshot.month}`,
    snapshotId: snapshot.id,
    month: snapshot.month,
    status: 'completed',
    generatedAt: generatedAt.toISOString(),
    model: 'demo-local-preview',
    summary: '净资产稳步抬升，负债率继续缓慢下降。',
    sections: [
      {
        title: '本月一句话',
        content: '这个月整体节奏比较稳，资产在缓慢增长，负债压力也在一点点变轻。'
      },
      {
        title: '主要变化',
        content: [
          '- 投资和养老金账户延续增长，净资产曲线更平滑。',
          '- 房贷余额继续下降，负债率比两年前明显更轻。',
          '- 现金储备保持在一个比较舒服的缓冲区间。'
        ].join('\n')
      },
      {
        title: '风险提醒',
        content: [
          '- 投资类资产占比提高后，短期波动可能会更明显。',
          '- 大额支出前，建议先确认现金储备是否覆盖 6 个月家庭开销。'
        ].join('\n')
      },
      {
        title: '下月建议',
        content: [
          '- 继续做一次月度确认，重点看现金储备和房贷余额。',
          '- 如果收入稳定，可以把年度保险、教育、旅行等大额支出提前标记。',
          '- 不需要追求每个月都大幅增长，保持记录和复盘节奏更重要。'
        ].join('\n')
      }
    ],
    disclaimer: 'AI 内容仅用于家庭复盘参考，不构成投资、法律或税务建议。'
  }
}

function roundWan(value: number) {
  return Math.round(value * 100) / 100
}
