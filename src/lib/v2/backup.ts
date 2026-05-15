import { LEDGER_SCHEMA_VERSION, type LedgerData, type V1BackupLike } from '@/types/ledger'
import { migrateV1Backup, parseV1BackupJson, type MigrationResult } from './migration'

export interface V2Backup {
  schemaVersion: typeof LEDGER_SCHEMA_VERSION
  exportedAt: string
  app: 'family-finance'
  data: LedgerData
}

export type ParsedBackup =
  | { kind: 'v2'; backup: V2Backup }
  | { kind: 'v1'; backup: V1BackupLike; migration: MigrationResult }

export function createV2Backup(data: LedgerData, exportedAt = new Date().toISOString()): V2Backup {
  return {
    schemaVersion: LEDGER_SCHEMA_VERSION,
    exportedAt,
    app: 'family-finance',
    data: {
      ...data,
      schemaVersion: LEDGER_SCHEMA_VERSION
    }
  }
}

export function serializeV2Backup(data: LedgerData, exportedAt?: string): string {
  return JSON.stringify(createV2Backup(data, exportedAt), null, 2)
}

export function parseBackupJson(jsonText: string): ParsedBackup {
  const parsed = JSON.parse(jsonText)
  if (parsed?.schemaVersion === LEDGER_SCHEMA_VERSION && parsed?.data) {
    return { kind: 'v2', backup: parsed as V2Backup }
  }

  const v1 = parseV1BackupJson(jsonText)
  return {
    kind: 'v1',
    backup: v1,
    migration: migrateV1Backup(v1)
  }
}

export function createPreMigrationBackup(v1Backup: V1BackupLike, exportedAt = new Date().toISOString()): string {
  return JSON.stringify({
    schemaVersion: 1,
    exportedAt,
    app: 'family-finance',
    original: v1Backup
  }, null, 2)
}

