import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useMemo, useState, type ReactNode } from 'react'
import { Share2 } from 'lucide-react'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { PageHeader } from '@/components/PageHeader'
import { REPORT_CARD_TEMPLATES, shareMonthlyReportCardImage, type ReportCardTemplateId } from '@/lib/reportCardImage'
import { buildTrendFromSnapshots, calculateLedgerStats } from '@/lib/v2/calculations'
import { getCategoryLabel } from '@/lib/v2/categories'
import { cn, formatDateTimeLabel, formatPercent, formatWan, maskSensitiveNumbers } from '@/lib/utils'
import { useLedgerStore } from '@/store/useLedgerStore'
import { useSettingsStore } from '@/store/useSettingsStore'
import type { AiReport, MonthlySnapshot } from '@/types/ledger'

export default function Insights() {
  const items = useLedgerStore(state => state.items)
  const snapshots = useLedgerStore(state => state.snapshots)
  const reports = useLedgerStore(state => state.reports)
  const hidden = useSettingsStore(state => state.privacy.hideAmounts)
  const [sharingCardId, setSharingCardId] = useState<string | null>(null)
  const [cardError, setCardError] = useState<{ id: string; text: string } | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<ReportCardTemplateId>('family')
  const stats = calculateLedgerStats(items)
  const trend = buildTrendFromSnapshots(snapshots)
  const visibleReports = useMemo(() => {
    const seen = new Set<string>()
    return reports.filter(report => {
      if (seen.has(report.month)) return false
      seen.add(report.month)
      return true
    })
  }, [reports])
  const categoryRows = Object.entries(stats.byCategory)
    .map(([category, amount]) => ({ category, label: getCategoryLabel(category as keyof typeof stats.byCategory), amount }))
    .filter(row => row.amount > 0)
    .sort((a, b) => b.amount - a.amount)
  const maxCategory = Math.max(...categoryRows.map(row => row.amount), 1)

  async function handleShareImageCard(report: AiReport) {
    const snapshot = findReportSnapshot(report, snapshots)
    if (!snapshot) {
      setCardError({ id: report.id, text: '这份月报缺少对应快照，暂时不能生成分享图片。' })
      return
    }

    setSharingCardId(report.id)
    setCardError(null)
    try {
      await shareMonthlyReportCardImage({ report, snapshot, hidden, template: selectedTemplate })
    } catch (err) {
      setCardError({ id: report.id, text: err instanceof Error ? err.message : '分享图片生成失败。' })
    } finally {
      setSharingCardId(null)
    }
  }

  return (
    <div className="space-y-4 pb-24">
      <PageHeader title="洞察" subtitle="走势、结构和月报会集中在这里" />

      <Card className="p-4">
        <h2 className="font-bold">当前结构</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <Metric label="资产" value={formatWan(stats.totals.totalAssets, hidden)} />
          <Metric label="负债" value={formatWan(stats.totals.totalLiabilities, hidden)} />
          <Metric label="净资产" value={formatWan(stats.totals.netWorth, hidden)} />
          <Metric label="负债率" value={formatPercent(stats.totals.debtRatio, hidden)} />
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="font-bold">资产负债走势</h2>
        {hidden ? (
          <p className="mt-3 rounded-xl bg-surface-dim p-3 text-sm text-ink-muted">隐私模式已隐藏走势图和趋势数值。</p>
        ) : trend.length === 0 ? (
          <p className="mt-3 text-sm text-ink-muted">生成月度快照后，这里会显示资产、负债、净资产走势。</p>
        ) : (
          <>
            <div className="mt-3 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#76877e' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#76877e' }} tickLine={false} axisLine={false} width={48} />
                  <Tooltip formatter={(value) => formatWan(Number(value), hidden)} />
                  <Line type="monotone" dataKey="totalAssets" name="资产" stroke="#4f9b79" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="totalLiabilities" name="负债" stroke="#b65d5d" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="netWorth" name="净资产" stroke="#486c9f" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 space-y-2">
              {trend.slice(-3).map(point => (
                <div key={point.month} className="rounded-lg bg-surface-dim p-3 text-sm">
                  <div className="flex justify-between font-bold">
                    <span>{point.month}</span>
                    <span>{formatWan(point.netWorth, hidden)}</span>
                  </div>
                  <p className="mt-1 text-xs text-ink-muted">
                    资产 {formatWan(point.totalAssets, hidden)} · 负债 {formatWan(point.totalLiabilities, hidden)}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      <Card className="p-4">
        <h2 className="font-bold">分类结构</h2>
        {categoryRows.length === 0 ? (
          <p className="mt-3 text-sm text-ink-muted">暂无有效记录。</p>
        ) : (
          <div className="mt-3 space-y-3">
            {categoryRows.map(row => {
              const tone = getCategoryTone(row.category)
              return (
              <div key={row.category}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{row.label}</span>
                  <b className={tone.text}>{formatWan(row.amount, hidden)}</b>
                </div>
                <div className={`h-2 overflow-hidden rounded-full ${tone.track}`}>
                  <div className={`h-full rounded-full ${tone.bar}`} style={{ width: hidden ? '24%' : `${Math.max(4, (row.amount / maxCategory) * 100)}%` }} />
                </div>
              </div>
              )
            })}
          </div>
        )}
      </Card>

      <Card className="p-4">
        <h2 className="font-bold">AI 月报</h2>
        {visibleReports.length === 0 ? (
          <p className="mt-3 text-sm text-ink-muted">在设置里开启自动月报后，月度确认会生成 AI 报告。</p>
        ) : (
          <div className="mt-3 space-y-3">
            {visibleReports.map(report => {
              const snapshot = findReportSnapshot(report, snapshots)
              return (
              <details key={report.id} className="rounded-xl border border-surface-border bg-surface-dim/70 p-3">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-bold [&::-webkit-details-marker]:hidden">
                  <span>{report.month} · {report.status === 'completed' ? '已完成' : report.status === 'failed' ? '失败' : '生成中'}</span>
                  <span className="shrink-0 rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-semibold text-ink-muted">
                    {formatDateTimeLabel(report.generatedAt)}
                  </span>
                </summary>
                {report.error ? (
                  <p className="mt-2 text-sm text-danger">{report.error}</p>
                ) : (
                  <div className="mt-3 space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      {REPORT_CARD_TEMPLATES.map(template => (
                        <button
                          key={template.id}
                          type="button"
                          onClick={() => setSelectedTemplate(template.id)}
                          className={cn(
                            'rounded-xl border px-2 py-2 text-left transition',
                            selectedTemplate === template.id
                              ? 'border-brand bg-brand-light/70 text-brand-dark shadow-[0_8px_18px_rgba(16,185,129,0.12)]'
                              : 'border-surface-border bg-white/70 text-ink-muted'
                          )}
                        >
                          <span className="block text-xs font-black">{template.label}</span>
                          <span className="mt-0.5 block text-[10px] leading-4">{template.description}</span>
                        </button>
                      ))}
                    </div>
                    {snapshot && (
                      <ReportImageCard report={report} snapshot={snapshot} hidden={hidden} template={selectedTemplate} />
                    )}
                    <div>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={sharingCardId === report.id || !snapshot}
                        onClick={() => handleShareImageCard(report)}
                      >
                        <Share2 className="h-4 w-4" />
                        {sharingCardId === report.id ? '准备图片...' : '保存并分享图片'}
                      </Button>
                      {cardError?.id === report.id && (
                        <p className="mt-2 text-xs text-danger">{cardError.text}</p>
                      )}
                    </div>
                    {report.sections.map(section => (
                      <section key={section.title} className="rounded-xl bg-white/80 p-3">
                        <h3 className="text-sm font-bold">{section.title}</h3>
                        <FormattedReportText content={section.content} hidden={hidden} />
                      </section>
                    ))}
                    <p className="text-xs text-ink-muted">{report.disclaimer}</p>
                  </div>
                )}
              </details>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface-dim p-3">
      <p className="text-xs text-ink-muted">{label}</p>
      <p className="mt-1 font-black">{value}</p>
    </div>
  )
}

function findReportSnapshot(report: AiReport, snapshots: MonthlySnapshot[]) {
  return snapshots.find(snapshot => snapshot.id === report.snapshotId)
    || snapshots.find(snapshot => snapshot.month === report.month)
}

function getCategoryTone(category: string) {
  const isLiability = category === 'liabilities_loans'
  return {
    bar: isLiability ? 'bg-danger' : 'bg-brand',
    track: isLiability ? 'bg-danger-light/70' : 'bg-surface-dark',
    text: isLiability ? 'text-danger' : 'text-ink'
  }
}

function ReportImageCard({
  report,
  snapshot,
  hidden,
  template
}: {
  report: AiReport
  snapshot: MonthlySnapshot
  hidden: boolean
  template: ReportCardTemplateId
}) {
  const headline = getReportSectionLine(report, '一句话') || getReportSectionLine(report)
  const suggestion = getReportSectionLine(report, '建议') || getReportSectionLine(report, '提醒') || '继续保持月度确认，把现金、负债和长期目标放在一起看。'
  const style = getPreviewTemplateStyle(template)

  return (
    <div
      className="relative aspect-[3/4] overflow-hidden rounded-[20px] border border-white/80 bg-surface-dim shadow-[0_16px_34px_rgba(36,53,47,0.10)]"
      style={{ background: style.background }}
    >
      <div className="absolute inset-3 rounded-[18px] shadow-[0_14px_32px_rgba(15,23,42,0.08)]" style={{ backgroundColor: style.shell }} />
      <div className="relative flex h-full flex-col p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold" style={{ color: style.muted }}>{style.kicker}</p>
            <h3 className="mt-1 text-2xl font-black tracking-normal" style={{ color: style.net }}>{report.month}</h3>
          </div>
          <span className="rounded-full px-2.5 py-1 text-[10px] font-bold" style={{ backgroundColor: style.badgeFill, color: style.accent }}>本地生成</span>
        </div>

        <div className="mt-4 rounded-2xl p-3 shadow-[0_8px_18px_rgba(36,53,47,0.06)]" style={{ backgroundColor: style.panel }}>
          <p className="text-xs" style={{ color: style.muted }}>家庭净资产</p>
          <p className="mt-1 text-3xl font-black" style={{ color: style.net }}>{formatWan(snapshot.totals.netWorth, hidden)}</p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl p-2" style={{ backgroundColor: style.assetFill }}>
              <p style={{ color: style.muted }}>资产</p>
              <b style={{ color: style.accent }}>{formatWan(snapshot.totals.totalAssets, hidden)}</b>
            </div>
            <div className="rounded-xl p-2" style={{ backgroundColor: style.debtFill }}>
              <p style={{ color: style.debt }}>负债</p>
              <b style={{ color: style.debt }}>{formatWan(snapshot.totals.totalLiabilities, hidden)}</b>
            </div>
          </div>
        </div>

        <div className="mt-3 rounded-2xl p-3" style={{ backgroundColor: style.softPanel }}>
          <div className="flex items-center justify-between text-xs">
            <span style={{ color: style.muted }}>负债率</span>
            <b style={{ color: style.debt }}>{formatPercent(snapshot.totals.debtRatio, hidden)}</b>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full" style={{ backgroundColor: style.debtFill }}>
            <div
              className="h-full rounded-full"
              style={{
                backgroundColor: style.debt,
                width: hidden ? '0%' : `${Math.min(100, Math.max(4, snapshot.totals.debtRatio * 100))}%`
              }}
            />
          </div>
        </div>

        <div className="mt-auto space-y-2 rounded-2xl p-3" style={{ backgroundColor: style.panel }}>
          <p className="text-xs font-bold" style={{ color: style.net }}>本月一句话</p>
          <p className="line-clamp-2 text-sm leading-5" style={{ color: style.muted }}>{maskSensitiveNumbers(headline, hidden)}</p>
          <p className="border-t pt-2 text-xs leading-5" style={{ borderColor: style.divider, color: style.muted }}>{maskSensitiveNumbers(suggestion, hidden)}</p>
        </div>
      </div>
    </div>
  )
}

function getPreviewTemplateStyle(template: ReportCardTemplateId) {
  if (template === 'statement') {
    return {
      kicker: '月度资产单',
      background: 'radial-gradient(circle at 14% 16%, rgba(47,110,85,0.18), transparent 36%), radial-gradient(circle at 82% 86%, rgba(210,168,58,0.18), transparent 40%), #f6f8f6',
      shell: 'rgba(255,255,255,0.82)',
      panel: 'rgba(255,255,255,0.86)',
      softPanel: 'rgba(246,248,246,0.84)',
      assetFill: '#e2f1e7',
      debtFill: '#f7e7e5',
      accent: '#2f6e55',
      debt: '#b65d5d',
      net: '#20342f',
      muted: '#6b7b72',
      divider: '#d9e3dd',
      badgeFill: '#e2f1e7'
    }
  }

  if (template === 'focus') {
    return {
      kicker: '本月重点',
      background: 'radial-gradient(circle at 18% 12%, rgba(72,108,159,0.22), transparent 38%), radial-gradient(circle at 84% 30%, rgba(16,185,129,0.14), transparent 36%), radial-gradient(circle at 78% 88%, rgba(194,91,102,0.16), transparent 38%), #f7fbff',
      shell: 'rgba(255,255,255,0.78)',
      panel: 'rgba(255,255,255,0.84)',
      softPanel: 'rgba(244,248,252,0.82)',
      assetFill: '#e2f1e7',
      debtFill: '#f8e6e8',
      accent: '#486c9f',
      debt: '#c25b66',
      net: '#1f2f46',
      muted: '#66758b',
      divider: '#dce6ef',
      badgeFill: '#e5edf7'
    }
  }

  return {
    kicker: '家庭月报卡片',
    background: 'radial-gradient(circle at 16% 12%, rgba(16,185,129,0.26), transparent 34%), radial-gradient(circle at 88% 34%, rgba(225,29,72,0.15), transparent 38%), radial-gradient(circle at 78% 92%, rgba(59,130,246,0.14), transparent 36%), #f8fafc',
    shell: 'rgba(255,255,255,0.70)',
    panel: 'rgba(255,255,255,0.80)',
    softPanel: 'rgba(255,255,255,0.72)',
    assetFill: 'rgba(209,250,229,0.70)',
    debtFill: 'rgba(255,228,230,0.80)',
    accent: '#047857',
    debt: '#e11d48',
    net: '#0f172a',
    muted: '#64748b',
    divider: '#e2e8f0',
    badgeFill: 'rgba(209,250,229,0.80)'
  }
}

function getReportSectionLine(report: AiReport, titleIncludes?: string) {
  const section = titleIncludes
    ? report.sections.find(item => item.title.includes(titleIncludes))
    : report.sections[0]
  return cleanReportText(section?.content || '').slice(0, 64)
}

function cleanReportText(text: string) {
  return text
    .replace(/\*\*/g, '')
    .replace(/^(?:[-*]|\d+\.)\s+/gm, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^---+$/gm, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function FormattedReportText({ content, hidden }: { content: string; hidden: boolean }) {
  const lines = mergeWrappedBulletLines(normalizeReportContent(maskSensitiveNumbers(content, hidden)).split('\n'))
  const blocks: ReactNode[] = []
  let bullets: string[] = []

  const flushBullets = (key: string) => {
    if (bullets.length === 0) return
    const current = bullets
    bullets = []
    blocks.push(
      <ul key={key} className="space-y-1.5">
        {current.map((bullet, index) => (
          <li key={`${key}-${index}`} className="flex gap-2 text-sm leading-6 text-ink-muted">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand/70" />
            <span>{renderInlineMarkdown(bullet)}</span>
          </li>
        ))}
      </ul>
    )
  }

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim()
    if (!line) {
      flushBullets(`bullets-${index}`)
      return
    }

    const bullet = line.match(/^(?:[-*]|\d+\.)\s+(.+)$/)
    if (bullet) {
      bullets.push(bullet[1])
      return
    }

    flushBullets(`bullets-${index}`)
    const heading = line.replace(/^#{1,6}\s+/, '')
    const isHeading = heading !== line
    blocks.push(
      <p key={`line-${index}`} className={isHeading ? 'text-sm font-bold leading-6 text-ink' : 'text-sm leading-6 text-ink-muted'}>
        {renderInlineMarkdown(heading)}
      </p>
    )
  })

  flushBullets('bullets-end')

  return <div className="mt-1 space-y-2">{blocks}</div>
}

function normalizeReportContent(content: string) {
  return content
    .replace(/\*\*([^*\n]+?)\s*\n\s*\*\*/g, '**$1**')
    .replace(/^---+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
}

function mergeWrappedBulletLines(lines: string[]) {
  return lines.reduce<string[]>((merged, rawLine) => {
    const line = rawLine.trim()
    const last = merged[merged.length - 1]
    if (
      line &&
      last &&
      /^(?:[-*]|\d+\.)\s+/.test(last.trim()) &&
      !/^(?:[-*]|\d+\.)\s+/.test(line) &&
      !/^#{1,6}\s+/.test(line)
    ) {
      merged[merged.length - 1] = `${last.trim()} ${line}`
      return merged
    }
    merged.push(rawLine)
    return merged
  }, [])
}

function renderInlineMarkdown(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} className="font-black text-ink">{part.slice(2, -2)}</strong>
    }
    return <span key={index}>{part.replace(/\*\*/g, '')}</span>
  })
}
