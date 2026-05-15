import type { FinancialProfileSettings, LedgerTotals } from '@/types/ledger'

export interface FamilyStatusScore {
  score: number
  level: 'missing_profile' | 'empty' | 'slow' | 'baseline' | 'good' | 'excellent'
  title: string
  reasons: string[]
  age?: number
  expectedNetWorth?: number
  accumulationRatio?: number
}

export function calculateFamilyStatusScore(
  totals: LedgerTotals,
  profile?: FinancialProfileSettings,
  currentYear = new Date().getFullYear()
): FamilyStatusScore {
  const birthYear = profile?.birthYear
  const annualIncomeWan = profile?.annualIncomeWan
  const hasProfile = Boolean(
    birthYear &&
    annualIncomeWan &&
    birthYear > 1900 &&
    birthYear <= currentYear &&
    annualIncomeWan > 0
  )

  if (!hasProfile) {
    return {
      score: 0,
      level: 'missing_profile',
      title: '先填写健康度参数',
      reasons: ['填写出生年份和家庭税前年收入后，再计算资产健康度。']
    }
  }

  const hasMeaningfulTotals =
    totals.totalAssets !== 0 ||
    totals.totalLiabilities !== 0 ||
    totals.netWorth !== 0 ||
    totals.liquidityAmount !== 0

  if (!hasMeaningfulTotals) {
    return {
      score: 0,
      level: 'empty',
      title: '还没有可计算数据',
      reasons: ['先添加资产或负债记录，再计算资产健康度。'],
      age: currentYear - birthYear!,
      expectedNetWorth: ((currentYear - birthYear!) * annualIncomeWan!) / 10,
      accumulationRatio: 0
    }
  }

  const age = currentYear - birthYear!
  const expectedNetWorth = (age * annualIncomeWan!) / 10
  const accumulationRatio = expectedNetWorth > 0 ? totals.netWorth / expectedNetWorth : 0
  let score = 0
  const reasons: string[] = []

  if (accumulationRatio >= 2) {
    score = 100
  } else if (accumulationRatio >= 1) {
    score = 80 + (accumulationRatio - 1) * 20
  } else if (accumulationRatio >= 0.5) {
    score = 60 + (accumulationRatio - 0.5) * 40
  } else {
    score = (Math.max(0, accumulationRatio) / 0.5) * 60
  }

  if (totals.netWorth < 0) {
    score = 0
  }

  reasons.push(`预期净资产为 ${expectedNetWorth.toFixed(2)} 万。`)
  reasons.push(`当前达到预期的 ${(Math.max(0, accumulationRatio) * 100).toFixed(1)}%。`)

  if (totals.debtRatio >= 0.6) {
    reasons.push('负债率偏高，资产积累之外也要关注还款压力。')
  } else if (totals.debtRatio >= 0.4) {
    reasons.push('负债率处在中等区间，整体仍可控。')
  }

  if (totals.totalLiabilities > 0 && totals.liquidityRatio < 0.08) {
    reasons.push('现金缓冲有限，建议月度确认时重点看现金和贷款。')
  }

  const bounded = Math.max(0, Math.min(100, Math.round(score)))
  const level =
    bounded >= 95 ? 'excellent' :
      bounded >= 80 ? 'good' :
        bounded >= 60 ? 'baseline' :
          'slow'
  const title =
    level === 'excellent' ? '表现突出' :
      level === 'good' ? '积累良好' :
        level === 'baseline' ? '基本达标' :
          '积累偏慢'

  return { score: bounded, level, title, reasons, age, expectedNetWorth, accumulationRatio }
}
