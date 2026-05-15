import { LEDGER_SCHEMA_VERSION, type LedgerData, type V1BackupLike } from '@/types/ledger'

export const V2_STORAGE_KEY = 'ledger-v2-store'
export const V1_FINANCE_STORAGE_KEY = 'finance-store'

export function createEmptyLedgerData(): LedgerData {
  return {
    schemaVersion: LEDGER_SCHEMA_VERSION,
    items: [],
    histories: [],
    snapshots: [],
    reports: [],
    drafts: []
  }
}

export function loadStoredV1FinanceData(): V1BackupLike | null {
  if (typeof localStorage === 'undefined') return null
  const raw = localStorage.getItem(V1_FINANCE_STORAGE_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw)
    const state = parsed?.state || parsed
    if (!Array.isArray(state?.assets) || !Array.isArray(state?.liabilities)) return null
    return {
      version: 1,
      timestamp: new Date().toISOString(),
      assets: state.assets,
      liabilities: state.liabilities
    }
  } catch {
    return null
  }
}

