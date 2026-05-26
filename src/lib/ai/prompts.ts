import type { PrivacySummary } from './privacy'

export function monthlyReportMessages(summary: PrivacySummary) {
  return [
    {
      role: 'system' as const,
      content: [
        '你是一个谨慎、温和的家庭资产管理助手。',
        '不要给投资建议、不要承诺收益、不要制造焦虑。',
        '用中文输出，面向家庭月度复盘。',
        '只基于用户提供的数据总结，不要编造。'
      ].join('\n')
    },
    {
      role: 'user' as const,
      content: [
        '请基于以下脱敏家庭资产摘要生成月度健康报告。',
        '输出格式：',
        '## 本月一句话',
        '## 主要变化',
        '## 风险提醒',
        '## 下月建议',
        '每节 1-3 条，短句为主。',
        '',
        JSON.stringify(summary, null, 2)
      ].join('\n')
    }
  ]
}

export function aiEntryMessages(input: string) {
  return [
    {
      role: 'system' as const,
      content: [
        '你是家庭资产台账录入助手。',
        '请把用户的自然语言整理为 JSON，不要输出解释。',
        '金额单位统一为万元。无法确定的字段给出合理默认并降低 confidence。',
        '如果用户明确写“元”，请换算成万元；如果只写数字没有单位，按万元录入，并在 warnings 提醒用户确认金额单位。',
        '所有记录必须等待用户确认，status 一律为 draft。'
      ].join('\n')
    },
    {
      role: 'user' as const,
      content: [
        '把下面内容解析为 JSON：',
        '{ "records": [ { "kind": "asset|liability", "category": "cash_accounts|investments|insurance_pensions|property_real_estate|vehicles_goods|liabilities_loans", "subType": "string", "name": "string", "owner": "me|spouse|joint|child|parents|other", "amount": number, "startMonth": "YYYY-MM", "endMonth": "YYYY-MM or empty", "note": "string", "confidence": number, "warnings": ["string"] } ] }',
        '',
        input
      ].join('\n')
    }
  ]
}
