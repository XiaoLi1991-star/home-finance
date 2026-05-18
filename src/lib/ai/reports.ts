import { requestChatCompletion } from './modelClient'
import { monthlyReportMessages } from './prompts'
import { buildPrivacySummary } from './privacy'
import { generateMonthlyReportBackground } from './imageGeneration'
import { createLedgerId } from '@/lib/v2/migration'
import type { AiReport, LedgerItem, ModelSettings, MonthlySnapshot } from '@/types/ledger'

export function parseReportSections(content: string): AiReport['sections'] {
  const sections: AiReport['sections'] = []
  const parts = content.split(/^##\s+/m).map(part => part.trim()).filter(Boolean)

  for (const part of parts) {
    const [titleLine, ...body] = part.split('\n')
    if (!titleLine) continue
    sections.push({
      title: titleLine.trim(),
      content: body.join('\n').trim()
    })
  }

  if (sections.length === 0) {
    return [{ title: '月度报告', content: content.trim() }]
  }

  return sections
}

export function createFailedReport(snapshot: MonthlySnapshot, error: string): AiReport {
  return {
    id: createLedgerId('report'),
    snapshotId: snapshot.id,
    month: snapshot.month,
    status: 'failed',
    generatedAt: new Date().toISOString(),
    sections: [],
    disclaimer: 'AI 内容仅用于家庭复盘参考，不构成投资、法律或税务建议。',
    error
  }
}

export async function generateMonthlyAiReport(options: {
  settings: ModelSettings
  apiKey: string
  snapshot: MonthlySnapshot
  items: LedgerItem[]
  snapshots: MonthlySnapshot[]
}): Promise<AiReport> {
  const summary = buildPrivacySummary(options.items, options.snapshots, options.snapshot.month)
  const result = await requestChatCompletion(
    options.settings,
    options.apiKey,
    monthlyReportMessages(summary),
    { temperature: 0.2, maxTokens: options.settings.maxTokens }
  )

  const sections = parseReportSections(result.content)
  const report: AiReport = {
    id: createLedgerId('report'),
    snapshotId: options.snapshot.id,
    month: options.snapshot.month,
    status: 'completed',
    generatedAt: new Date().toISOString(),
    model: result.model,
    providerBaseUrl: options.settings.baseUrl,
    summary: sections[0]?.content || result.content.slice(0, 120),
    sections,
    disclaimer: 'AI 内容仅用于家庭复盘参考，不构成投资、法律或税务建议。'
  }

  try {
    report.imageCard = await generateMonthlyReportBackground({
      settings: options.settings,
      apiKey: options.apiKey,
      report,
      snapshot: options.snapshot
    })
  } catch {
    // 背景图是增强体验，不让它影响月报文本生成。
  }

  return report
}
