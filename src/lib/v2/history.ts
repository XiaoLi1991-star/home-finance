import { LEDGER_AMOUNT_UNIT, type LedgerItem, type ValuationChangeReason, type ValuationHistory } from '@/types/ledger'
import { createLedgerId, currentMonthKey } from './migration'

export interface AmountEditResult {
  item: LedgerItem
  history?: ValuationHistory
}

export function createValuationHistory(
  item: LedgerItem,
  nextAmount: number,
  options: {
    now?: string
    month?: string
    reason?: ValuationChangeReason
    note?: string
  } = {}
): ValuationHistory {
  const now = options.now || new Date().toISOString()
  return {
    id: createLedgerId('hist'),
    itemId: item.id,
    amount: nextAmount,
    previousAmount: item.amount,
    amountUnit: LEDGER_AMOUNT_UNIT,
    month: options.month || currentMonthKey(new Date(now)),
    changedAt: now,
    reason: options.reason || 'manual_edit',
    note: options.note
  }
}

export function applyAmountEdit(
  item: LedgerItem,
  nextAmount: number,
  options: {
    now?: string
    month?: string
    reason?: ValuationChangeReason
    note?: string
  } = {}
): AmountEditResult {
  const now = options.now || new Date().toISOString()
  const normalizedAmount = Number(nextAmount)
  if (!Number.isFinite(normalizedAmount) || normalizedAmount < 0) {
    throw new Error('Amount must be a non-negative finite number.')
  }

  if (normalizedAmount === item.amount) {
    return {
      item: {
        ...item,
        updatedAt: now
      }
    }
  }

  const history = createValuationHistory(item, normalizedAmount, { ...options, now })
  return {
    item: {
      ...item,
      amount: normalizedAmount,
      updatedAt: now,
      lastValuationAt: now
    },
    history
  }
}

export function getHistoryForItem(histories: ValuationHistory[], itemId: string): ValuationHistory[] {
  return histories
    .filter(history => history.itemId === itemId)
    .sort((a, b) => b.changedAt.localeCompare(a.changedAt))
}

