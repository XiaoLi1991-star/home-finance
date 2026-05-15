import { describe, expect, it } from 'vitest'
import { readChatContent, stripReasoningText } from './modelClient'

describe('model client helpers', () => {
  it('strips model reasoning blocks before parsing content', () => {
    expect(stripReasoningText('<think>hidden</think>\nOK')).toBe('OK')
  })

  it('returns empty text when the model only emitted reasoning', () => {
    expect(stripReasoningText('<think>still thinking')).toBe('')
  })

  it('reads OpenAI-compatible chat content', () => {
    expect(readChatContent({
      choices: [{ message: { content: '<think>hidden</think>\nOK' } }]
    })).toBe('<think>hidden</think>\nOK')
  })

  it('reads content arrays from alternative response shapes', () => {
    expect(readChatContent({
      output: [
        {
          content: [
            { type: 'output_text', text: 'OK' }
          ]
        }
      ]
    })).toBe('OK')
  })
})
