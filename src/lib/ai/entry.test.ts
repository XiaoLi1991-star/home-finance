import { describe, expect, it } from 'vitest'
import { createDraftsFromAiRecords, parseAiEntryRecords } from './entry'

describe('AI entry parsing', () => {
  it('parses fenced JSON and creates draft records', () => {
    const records = parseAiEntryRecords('```json\n{"records":[{"kind":"asset","category":"cash_accounts","name":"现金","amount":1.2}]}\n```')
    const drafts = createDraftsFromAiRecords(records, '2026-05-15T00:00:00.000Z')

    expect(drafts).toHaveLength(1)
    expect(drafts[0]?.item.status).toBe('draft')
    expect(drafts[0]?.item.name).toBe('现金')
    expect(drafts[0]?.item.amount).toBe(1.2)
  })
})
