import { describe, expect, it } from 'vitest'
import { stripReasoningText } from './modelClient'

describe('model client helpers', () => {
  it('strips model reasoning blocks before parsing content', () => {
    expect(stripReasoningText('<think>hidden</think>\nOK')).toBe('OK')
  })
})
