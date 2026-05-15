import { describe, expect, it } from 'vitest'
import { parseReportSections } from './reports'

describe('AI report parsing', () => {
  it('parses markdown report sections', () => {
    const sections = parseReportSections('## 本月一句话\n比较稳。\n## 风险提醒\n关注现金。')

    expect(sections).toHaveLength(2)
    expect(sections[0]?.title).toBe('本月一句话')
    expect(sections[1]?.content).toContain('关注现金')
  })
})
