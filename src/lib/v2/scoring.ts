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
    reasons.push('Debt ratio is high.')
  } else if (totals.debtRatio >= 0.6) {
    score -= 22
    reasons.push('Debt ratio needs attention.')
  } else if (totals.debtRatio >= 0.4) {
    score -= 10
    reasons.push('Debt ratio is moderate.')
  } else {
    reasons.push('Debt pressure is currently light.')
  }

  if (totals.liquidityRatio < 0.02) {
    score -= 25
    reasons.push('Liquid buffer is very thin relative to liabilities.')
  } else if (totals.liquidityRatio < 0.08) {
    score -= 14
    reasons.push('Liquid buffer is limited.')
  } else {
    reasons.push('Liquid buffer is acceptable.')
  }

  if (totals.netWorth < 0) {
    score -= 20
    reasons.push('Net worth is negative.')
  }

  const bounded = Math.max(0, Math.min(100, Math.round(score)))
  const level = bounded >= 75 ? 'stable' : bounded >= 55 ? 'watch' : 'pressure'
  const title = level === 'stable' ? 'Stable' : level === 'watch' ? 'Stable With Pressure' : 'Pressure'

  return { score: bounded, level, title, reasons }
}

