import { LEDGER_AMOUNT_UNIT, type LedgerItem } from '@/types/ledger'

export function isLedgerDemoMode() {
  if (!import.meta.env.DEV || typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).get('demo') === 'ledger'
}

export function createLedgerDemoItems(): LedgerItem[] {
  const now = new Date().toISOString()
  return [
    createDemoItem({
      id: 'ledger-demo-cmb',
      category: 'cash_accounts',
      subType: 'bank_account',
      name: '招商银行活期',
      amount: 8.6,
      startMonth: '2024-01',
      note: '日常周转账户'
    }),
    createDemoItem({
      id: 'ledger-demo-alipay',
      category: 'cash_accounts',
      subType: 'bank_account',
      name: '余额宝',
      amount: 3.2,
      startMonth: '2024-03',
      source: 'ai_entry'
    }),
    createDemoItem({
      id: 'ledger-demo-reserve',
      category: 'cash_accounts',
      subType: 'reserve_cash',
      name: '家庭备用金',
      amount: 12,
      startMonth: '2025-01'
    }),
    createDemoItem({
      id: 'ledger-demo-fund',
      category: 'investments',
      subType: 'fund',
      name: '沪深300基金',
      amount: 12.5,
      startMonth: '2023-06',
      source: 'ai_entry'
    }),
    createDemoItem({
      id: 'ledger-demo-stock',
      category: 'investments',
      subType: 'stock',
      name: '长期股票账户',
      amount: 28.4,
      startMonth: '2022-09'
    }),
    createDemoItem({
      id: 'ledger-demo-gold',
      category: 'investments',
      subType: 'gold',
      name: '黄金账户',
      amount: 6.8,
      startMonth: '2024-11'
    }),
    createDemoItem({
      id: 'ledger-demo-pension',
      category: 'insurance_pensions',
      subType: 'personal_pension',
      name: '个人养老金',
      amount: 7.6,
      startMonth: '2023-12',
      owner: 'me'
    }),
    createDemoItem({
      id: 'ledger-demo-insurance',
      category: 'insurance_pensions',
      subType: 'commercial_insurance',
      name: '商业保险现金价值',
      amount: 4.2,
      startMonth: '2021-08',
      owner: 'spouse',
      note: '每年复核一次即可'
    }),
    createDemoItem({
      id: 'ledger-demo-home',
      category: 'property_real_estate',
      subType: 'residence',
      name: '自住房估值',
      amount: 260,
      startMonth: '2020-05',
      note: '估值可能有偏差'
    }),
    createDemoItem({
      id: 'ledger-demo-parking',
      category: 'property_real_estate',
      subType: 'parking',
      name: '小区车位',
      amount: 18,
      startMonth: '2021-04'
    }),
    createDemoItem({
      id: 'ledger-demo-car',
      category: 'vehicles_goods',
      subType: 'personal_car',
      name: '家用车估值',
      amount: 9.8,
      startMonth: '2022-02'
    }),
    createDemoItem({
      id: 'ledger-demo-camera-ended',
      category: 'vehicles_goods',
      subType: 'high_value_goods',
      name: '旧相机设备',
      amount: 1.1,
      startMonth: '2021-10',
      endMonth: '2025-12',
      status: 'ended',
      note: '已处理'
    }),
    createDemoItem({
      id: 'ledger-demo-mortgage',
      kind: 'liability',
      category: 'liabilities_loans',
      subType: 'housing_loan',
      name: '共同房贷余额',
      amount: 68,
      startMonth: '2020-05'
    }),
    createDemoItem({
      id: 'ledger-demo-car-loan',
      kind: 'liability',
      category: 'liabilities_loans',
      subType: 'car_loan',
      name: '车贷余额',
      amount: 5.4,
      startMonth: '2022-02',
      source: 'ai_entry'
    }),
    createDemoItem({
      id: 'ledger-demo-card-pending',
      kind: 'liability',
      category: 'liabilities_loans',
      subType: 'credit_card',
      name: '信用卡本期账单',
      amount: 1.36,
      startMonth: '2026-05',
      status: 'pending_confirmation',
      note: '待确认是否已还清'
    })
  ].map(item => ({ ...item, createdAt: now, updatedAt: now, lastValuationAt: now }))
}

function createDemoItem(options: {
  id: string
  kind?: LedgerItem['kind']
  category: LedgerItem['category']
  subType: string
  name: string
  amount: number
  startMonth: string
  endMonth?: string
  status?: LedgerItem['status']
  owner?: LedgerItem['owner']
  source?: LedgerItem['source']['system']
  note?: string
}): LedgerItem {
  return {
    id: options.id,
    kind: options.kind || 'asset',
    category: options.category,
    subType: options.subType,
    name: options.name,
    owner: options.owner || 'joint',
    amount: options.amount,
    amountUnit: LEDGER_AMOUNT_UNIT,
    startMonth: options.startMonth,
    endMonth: options.endMonth,
    note: options.note,
    status: options.status || 'active',
    templateFields: {},
    customFields: [],
    createdAt: '',
    updatedAt: '',
    source: { system: options.source || 'manual' }
  }
}
