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
      title: '先补上家庭信息',
      reasons: ['补上出生年份和家庭年收入后，再一起看看家里的资产节奏。']
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
      title: '先记下家里的底数',
      reasons: ['添加几笔资产或负债后，健康度会更贴近真实情况。'],
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

  reasons.push(`按当前年龄和收入估算，参考净资产约为 ${expectedNetWorth.toFixed(2)} 万。`)
  reasons.push(`现在大约走到参考线的 ${(Math.max(0, accumulationRatio) * 100).toFixed(1)}%，可以当作家庭复盘的温度计。`)

  if (totals.debtRatio >= 0.6) {
    reasons.push('负债占比有点高，后续可以把还款节奏放在更靠前的位置。')
  } else if (totals.debtRatio >= 0.4) {
    reasons.push('负债占比在可控区间，继续留意每月现金流就好。')
  }

  if (totals.totalLiabilities > 0 && totals.liquidityRatio < 0.08) {
    reasons.push('现金缓冲还不算厚，月度确认时可以多看一眼现金和贷款。')
  }

  const bounded = Math.max(0, Math.min(100, Math.round(score)))
  const level =
    bounded >= 95 ? 'excellent' :
      bounded >= 80 ? 'good' :
        bounded >= 60 ? 'baseline' :
          'slow'
  const title =
    level === 'excellent' ? '家底很扎实' :
      level === 'good' ? '积累节奏不错' :
        level === 'baseline' ? '整体在稳步走' :
          '慢慢把底子垫厚'

  return { score: bounded, level, title, reasons, age, expectedNetWorth, accumulationRatio }
}
