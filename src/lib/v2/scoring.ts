import type { LedgerTotals } from '@/types/ledger'

export interface FamilyStatusScore {
  score: number
  level: 'stable' | 'watch' | 'pressure'
  title: string
  reasons: string[]
}

export function calculateFamilyStatusScore(totals: LedgerTotals): FamilyStatusScore {
  let score = 100
  const reasons: string[] = []

  if (totals.debtRatio >= 0.8) {
    score -= 35
    reasons.push('负债率偏高，需要优先关注还款压力。')
  } else if (totals.debtRatio >= 0.6) {
    score -= 22
    reasons.push('负债率需要留意，适合把大额支出放慢一点。')
  } else if (totals.debtRatio >= 0.4) {
    score -= 10
    reasons.push('负债率处在中等区间，整体仍可控。')
  } else {
    reasons.push('当前负债压力较轻。')
  }

  if (totals.liquidityRatio < 0.02) {
    score -= 25
    reasons.push('现金缓冲相对负债偏薄，建议优先补一点流动资金。')
  } else if (totals.liquidityRatio < 0.08) {
    score -= 14
    reasons.push('现金缓冲有限，月度确认时可以重点看现金和投资账户。')
  } else {
    reasons.push('现金缓冲处在可接受范围。')
  }

  if (totals.netWorth < 0) {
    score -= 20
    reasons.push('净资产为负，需要把债务压降作为主线。')
  }

  const bounded = Math.max(0, Math.min(100, Math.round(score)))
  const level = bounded >= 75 ? 'stable' : bounded >= 55 ? 'watch' : 'pressure'
  const title = level === 'stable' ? '比较稳' : level === 'watch' ? '稳中有压' : '压力偏高'

  return { score: bounded, level, title, reasons }
}
