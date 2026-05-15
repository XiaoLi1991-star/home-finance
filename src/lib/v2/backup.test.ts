import { describe, expect, it } from 'vitest'
import { LEDGER_SCHEMA_VERSION, type LedgerData } from '@/types/ledger'
import { createEmptyLedgerData } from './storage'
import { createV2Backup, parseBackupJson, serializeV2Backup } from './backup'

describe('v2 backup', () => {
  it('round-trips schemaVersion JSON backups', () => {
    const data: LedgerData = createEmptyLedgerData()
    const backup = createV2Backup(data, '2026-05-15T00:00:00.000Z')

    expect(backup.schemaVersion).toBe(LEDGER_SCHEMA_VERSION)
    expect(backup.data.schemaVersion).toBe(LEDGER_SCHEMA_VERSION)

    const parsed = parseBackupJson(JSON.stringify(backup))
    expect(parsed.kind).toBe('v2')
  })

  it('serializes readable JSON', () => {
    const json = serializeV2Backup(createEmptyLedgerData(), '2026-05-15T00:00:00.000Z')
    expect(json).toContain('"schemaVersion": 2')
    expect(json).toContain('"items": []')
  })
})

