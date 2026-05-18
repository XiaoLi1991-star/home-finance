import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useMemo, useState, type ReactNode } from 'react'
import { ChevronDown, Share2 } from 'lucide-react'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { PageHeader } from '@/components/PageHeader'
import { createMonthlyReportBackgroundPrompt, generateMonthlyReportBackground } from '@/lib/ai/imageGeneration'
import { createInsightsDemoData, isInsightsDemoMode } from '@/lib/demo/insightsDemo'
import { getAiApiKey } from '@/lib/native/secrets'
import {
  getReportCardContent,
  getReportCardPreviewTheme,
  getReportSeed,
  shareMonthlyReportCardImage
} from '@/lib/reportCardImage'
import { buildTrendFromSnapshots, calculateLedgerStats, type TrendPoint } from '@/lib/v2/calculations'
import { getCategoryLabel } from '@/lib/v2/categories'
import { cn, formatDateTimeLabel, formatPercent, formatWan, maskSensitiveNumbers } from '@/lib/utils'
import { useLedgerStore } from '@/store/useLedgerStore'
import { useSettingsStore } from '@/store/useSettingsStore'
import type { AiReport, LedgerCategory, MonthlySnapshot } from '@/types/ledger'

export default function Insights() {
  const storedItems = useLedgerStore(state => state.items)
  const storedSnapshots = useLedgerStore(state => state.snapshots)
  const storedReports = useLedgerStore(state => state.reports)
  const addReport = useLedgerStore(state => state.addReport)
  const model = useSettingsStore(state => state.model)
  const hidden = useSettingsStore(state => state.privacy.hideAmounts)
  const [sharingCardId, setSharingCardId] = useState<string | null>(null)
  const [generatingBackgroundId, setGeneratingBackgroundId] = useState<string | null>(null)
  const [cardError, setCardError] = useState<{ id: string; text: string } | null>(null)
  const [backgroundError, setBackgroundError] = useState<{ id: string; text: string } | null>(null)
  const [backgroundPrompts, setBackgroundPrompts] = useState<Record<string, string>>({})
  const demoMode = isInsightsDemoMode()
  const demoData = useMemo(() => demoMode ? createInsightsDemoData() : null, [demoMode])
  const items = demoData?.items ?? storedItems
  const snapshots = demoData?.snapshots ?? storedSnapshots
  const reports = demoData?.reports ?? storedReports
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
  const latestReport = visibleReports[0]
  const archivedReports = visibleReports.slice(1)
  const categoryRows = Object.entries(stats.byCategory)
    .map(([category, amount]) => ({ category: category as LedgerCategory, label: getCategoryLabel(category as LedgerCategory), amount }))
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
      await shareMonthlyReportCardImage({ report, snapshot, hidden })
    } catch (err) {
      setCardError({ id: report.id, text: err instanceof Error ? err.message : '分享图片生成失败。' })
    } finally {
      setSharingCardId(null)
    }
  }

  function getBackgroundPrompt(report: AiReport) {
    const snapshot = findReportSnapshot(report, snapshots)
    if (!snapshot) return backgroundPrompts[report.id] ?? report.imageCard?.prompt ?? ''
    return backgroundPrompts[report.id] ?? report.imageCard?.prompt ?? createMonthlyReportBackgroundPrompt(report, snapshot)
  }

  async function handleGenerateBackground(report: AiReport) {
    const snapshot = findReportSnapshot(report, snapshots)
    if (!snapshot) {
      setBackgroundError({ id: report.id, text: '这份月报缺少对应快照，暂时不能生成背景。' })
      return
    }
    if (demoMode) {
      setBackgroundError({ id: report.id, text: '演示模式只用于预览，不会调用 MiniMax 生成图片。' })
      return
    }

    setGeneratingBackgroundId(report.id)
    setBackgroundError(null)
    try {
      const apiKey = await getAiApiKey()
      const imageCard = await generateMonthlyReportBackground({
        settings: model,
        apiKey,
        report,
        snapshot,
        prompt: getBackgroundPrompt(report)
      })
      addReport({ ...report, imageCard })
      setBackgroundPrompts(state => ({ ...state, [report.id]: imageCard.prompt }))
    } catch (err) {
      setBackgroundError({ id: report.id, text: err instanceof Error ? err.message : '背景图生成失败。' })
    } finally {
      setGeneratingBackgroundId(null)
    }
  }

  return (
    <div className="space-y-4 pb-24">
      <PageHeader title="洞察" subtitle={demoMode ? '两年演示数据，仅用于预览走势效果' : '先看趋势，再看月报和结构'} />

      <TrendCard trend={trend} hidden={hidden} demoMode={demoMode} />

      <Card className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-bold">AI 月报</h2>
            <p className="mt-1 text-xs leading-5 text-ink-muted">最新月报默认展开，历史月份会先收起来。</p>
          </div>
          {visibleReports.length > 0 && (
            <span className="rounded-full bg-surface-dim px-2.5 py-1 text-[11px] font-bold text-ink-muted">
              {visibleReports.length} 份
            </span>
          )}
        </div>

        {visibleReports.length === 0 ? (
          <p className="mt-3 text-sm text-ink-muted">在设置里开启自动月报后，月度确认会生成 AI 报告。</p>
        ) : (
          <div className="mt-3 space-y-3">
            {latestReport && (
              <ReportPanel
                report={latestReport}
                snapshots={snapshots}
                hidden={hidden}
                sharingCardId={sharingCardId}
                generatingBackgroundId={generatingBackgroundId}
                cardError={cardError}
                backgroundError={backgroundError}
                backgroundPrompt={getBackgroundPrompt(latestReport)}
                demoMode={demoMode}
                onShare={handleShareImageCard}
                onGenerateBackground={handleGenerateBackground}
                onPromptChange={(value) => setBackgroundPrompts(state => ({ ...state, [latestReport.id]: value }))}
                featured
              />
            )}

            {archivedReports.length > 0 && (
              <details className="group rounded-2xl border border-surface-border bg-surface-dim/60 p-3">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-bold [&::-webkit-details-marker]:hidden">
                  <span>历史月报</span>
                  <span className="flex items-center gap-1 text-xs text-ink-muted">
                    {archivedReports.length} 份
                    <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
                  </span>
                </summary>
                <div className="mt-3 space-y-3">
                  {archivedReports.map(report => (
                    <ReportPanel
                      key={report.id}
                      report={report}
                      snapshots={snapshots}
                      hidden={hidden}
                      sharingCardId={sharingCardId}
                      generatingBackgroundId={generatingBackgroundId}
                      cardError={cardError}
                      backgroundError={backgroundError}
                      backgroundPrompt={getBackgroundPrompt(report)}
                      demoMode={demoMode}
                      onShare={handleShareImageCard}
                      onGenerateBackground={handleGenerateBackground}
                      onPromptChange={(value) => setBackgroundPrompts(state => ({ ...state, [report.id]: value }))}
                    />
                  ))}
                </div>
              </details>
            )}
          </div>
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
                  <div className="mb-1 flex justify-between gap-3 text-sm">
                    <span>{row.label}</span>
                    <b className={tone.text}>{formatWan(row.amount, hidden)}</b>
                  </div>
                  <div className={cn('h-2 overflow-hidden rounded-full', tone.track)}>
                    <div
                      className={cn('h-full rounded-full', tone.bar)}
                      style={{ width: hidden ? '24%' : `${Math.max(4, (row.amount / maxCategory) * 100)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}

function TrendCard({ trend, hidden, demoMode }: { trend: TrendPoint[]; hidden: boolean; demoMode: boolean }) {
  const latest = trend[trend.length - 1]
  const first = trend[0]
  const netChange = latest && first ? latest.netWorth - first.netWorth : 0

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-bold">资产负债走势</h2>
          <p className="mt-1 text-xs leading-5 text-ink-muted">
            记录多个月度快照后，可以更直观看到家庭净资产和负债节奏。
          </p>
        </div>
        {demoMode ? (
          <span className="shrink-0 rounded-full bg-brand-light px-2.5 py-1 text-[11px] font-bold text-brand-dark">
            演示
          </span>
        ) : trend.length === 1 && (
          <span className="shrink-0 rounded-full bg-brand-light px-2.5 py-1 text-[11px] font-bold text-brand-dark">
            1 个月
          </span>
        )}
      </div>

      {hidden ? (
        <p className="mt-3 rounded-xl bg-surface-dim p-3 text-sm text-ink-muted">隐私模式已隐藏走势图和趋势数值。</p>
      ) : trend.length === 0 ? (
        <p className="mt-3 text-sm text-ink-muted">生成月度快照后，这里会显示资产、负债、净资产走势。</p>
      ) : (
        <>
          <div className="mt-4 h-60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid stroke="#e6ede9" strokeDasharray="3 5" vertical={false} />
                <XAxis
                  dataKey="month"
                  interval={trend.length > 12 ? 2 : 0}
                  minTickGap={12}
                  tick={{ fontSize: 11, fill: '#76877e' }}
                  tickFormatter={formatTrendMonthTick}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#76877e' }}
                  tickFormatter={(value) => String(Math.round(Number(value)))}
                  tickLine={false}
                  axisLine={false}
                  width={48}
                />
                <Tooltip
                  formatter={(value, name) => [formatWan(Number(value), hidden), name]}
                  contentStyle={{ borderRadius: 14, borderColor: '#dfe8e2', boxShadow: '0 12px 30px rgba(36,53,47,0.10)' }}
                  labelStyle={{ color: '#24352f', fontWeight: 800 }}
                />
                <Line type="monotone" dataKey="totalAssets" name="资产" stroke="#4f9b79" strokeWidth={2.4} dot={trend.length <= 1} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="totalLiabilities" name="负债" stroke="#b65d5d" strokeWidth={2.4} dot={trend.length <= 1} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="netWorth" name="净资产" stroke="#486c9f" strokeWidth={2.8} dot={trend.length <= 1} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
            <TrendMetric label="最新净资产" value={formatWan(latest.netWorth, hidden)} />
            <TrendMetric label="累计变化" value={formatSignedWan(netChange)} tone={netChange >= 0 ? 'good' : 'risk'} />
            <TrendMetric label="最新负债率" value={formatPercent(latest.totalAssets > 0 ? latest.totalLiabilities / latest.totalAssets : 0, hidden)} tone="risk" />
          </div>
        </>
      )}
    </Card>
  )
}

function TrendMetric({ label, value, tone = 'neutral' }: { label: string; value: string; tone?: 'neutral' | 'good' | 'risk' }) {
  return (
    <div className="rounded-2xl bg-surface-dim px-3 py-2">
      <p className="text-[11px] text-ink-muted">{label}</p>
      <p className={cn('mt-1 truncate text-sm font-black', tone === 'good' && 'text-brand-dark', tone === 'risk' && 'text-danger')}>
        {value}
      </p>
    </div>
  )
}

function ReportPanel({
  report,
  snapshots,
  hidden,
  sharingCardId,
  generatingBackgroundId,
  cardError,
  backgroundError,
  backgroundPrompt,
  demoMode,
  onShare,
  onGenerateBackground,
  onPromptChange,
  featured = false
}: {
  report: AiReport
  snapshots: MonthlySnapshot[]
  hidden: boolean
  sharingCardId: string | null
  generatingBackgroundId: string | null
  cardError: { id: string; text: string } | null
  backgroundError: { id: string; text: string } | null
  backgroundPrompt: string
  demoMode: boolean
  onShare: (report: AiReport) => void
  onGenerateBackground: (report: AiReport) => void
  onPromptChange: (value: string) => void
  featured?: boolean
}) {
  const snapshot = findReportSnapshot(report, snapshots)

  if (!featured) {
    return (
      <details className="group rounded-2xl border border-surface-border bg-white/70 p-3">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-bold [&::-webkit-details-marker]:hidden">
          <ReportHeader report={report} />
          <ChevronDown className="h-4 w-4 shrink-0 text-ink-muted transition group-open:rotate-180" />
        </summary>
        <ReportPanelBody
          report={report}
          snapshot={snapshot}
          hidden={hidden}
          sharingCardId={sharingCardId}
          generatingBackgroundId={generatingBackgroundId}
          cardError={cardError}
          backgroundError={backgroundError}
          backgroundPrompt={backgroundPrompt}
          demoMode={demoMode}
          onShare={onShare}
          onGenerateBackground={onGenerateBackground}
          onPromptChange={onPromptChange}
        />
      </details>
    )
  }

  return (
    <section className="rounded-[20px] border border-surface-border bg-surface-dim/70 p-3">
      <ReportHeader report={report} featured />
      <ReportPanelBody
        report={report}
        snapshot={snapshot}
        hidden={hidden}
        sharingCardId={sharingCardId}
        generatingBackgroundId={generatingBackgroundId}
        cardError={cardError}
        backgroundError={backgroundError}
        backgroundPrompt={backgroundPrompt}
        demoMode={demoMode}
        onShare={onShare}
        onGenerateBackground={onGenerateBackground}
        onPromptChange={onPromptChange}
      />
    </section>
  )
}

function ReportHeader({ report, featured = false }: { report: AiReport; featured?: boolean }) {
  return (
    <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
      <div className="min-w-0">
        <p className={cn('truncate font-bold', featured ? 'text-base' : 'text-sm')}>
          {report.month} · {report.status === 'completed' ? '已完成' : report.status === 'failed' ? '失败' : '生成中'}
        </p>
        <p className="mt-0.5 text-xs text-ink-muted">生成于 {formatDateTimeLabel(report.generatedAt)}</p>
      </div>
      {featured && (
        <span className="shrink-0 rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-bold text-brand-dark">
          最新
        </span>
      )}
    </div>
  )
}

function ReportPanelBody({
  report,
  snapshot,
  hidden,
  sharingCardId,
  generatingBackgroundId,
  cardError,
  backgroundError,
  backgroundPrompt,
  demoMode,
  onShare,
  onGenerateBackground,
  onPromptChange
}: {
  report: AiReport
  snapshot?: MonthlySnapshot
  hidden: boolean
  sharingCardId: string | null
  generatingBackgroundId: string | null
  cardError: { id: string; text: string } | null
  backgroundError: { id: string; text: string } | null
  backgroundPrompt: string
  demoMode: boolean
  onShare: (report: AiReport) => void
  onGenerateBackground: (report: AiReport) => void
  onPromptChange: (value: string) => void
}) {
  if (report.error) {
    return <p className="mt-3 text-sm text-danger">{report.error}</p>
  }

  return (
    <div className="mt-3 space-y-3">
      {snapshot && (
        <ReportImageCard report={report} snapshot={snapshot} hidden={hidden} />
      )}
      <details className="group rounded-2xl border border-surface-border bg-white/70 p-3" open={!report.imageCard}>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-bold [&::-webkit-details-marker]:hidden">
          <span>背景提示词</span>
          <span className="flex items-center gap-1 text-xs text-ink-muted">
            可修改
            <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
          </span>
        </summary>
        <textarea
          className="mt-3 min-h-32 w-full resize-y rounded-2xl border border-surface-border bg-white/80 p-3 text-xs leading-5 text-ink outline-none transition focus:border-brand"
          value={backgroundPrompt}
          onChange={event => onPromptChange(event.target.value)}
        />
        <p className="mt-2 text-xs leading-5 text-ink-muted">
          建议保留“无文字、留出可读区域、低对比纹理”等限制，只微调大理石、淡彩、纸张颗粒这些风格词。
        </p>
      </details>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="secondary"
          disabled={generatingBackgroundId === report.id || !snapshot || demoMode}
          onClick={() => onGenerateBackground(report)}
        >
          {generatingBackgroundId === report.id ? '生成背景中...' : report.imageCard ? '替换背景' : '生成质感背景'}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={sharingCardId === report.id || !snapshot}
          onClick={() => onShare(report)}
        >
          <Share2 className="h-4 w-4" />
          {sharingCardId === report.id ? '准备图片...' : '保存并分享图片'}
        </Button>
      </div>
      <div>
        {backgroundError?.id === report.id && (
          <p className="text-xs text-danger">{backgroundError.text}</p>
        )}
        {cardError?.id === report.id && (
          <p className="mt-2 text-xs text-danger">{cardError.text}</p>
        )}
      </div>
    </div>
  )
}

function ReportImageCard({ report, snapshot, hidden }: { report: AiReport; snapshot: MonthlySnapshot; hidden: boolean }) {
  const content = getReportCardContent(report, hidden)
  const theme = getReportCardPreviewTheme(getReportSeed(report, snapshot))
  const background = report.imageCard?.backgroundDataUrl
    ? `linear-gradient(135deg, rgba(255,255,255,0.62), rgba(255,255,255,0.38) 50%, rgba(255,255,255,0.68)), url(${report.imageCard.backgroundDataUrl}) center / cover`
    : theme.background

  return (
    <div
      className="relative aspect-[2/3] overflow-hidden rounded-[22px] border border-white/70 shadow-[0_18px_36px_rgba(36,53,47,0.12)]"
      style={{ background, color: theme.ink, fontFamily: theme.fontFamily }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0)_35%,rgba(15,23,42,0.08)_100%)]" />
      <div className="relative flex h-full flex-col p-3.5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black" style={{ color: theme.accent }}>家庭月报</p>
            <h3 className="mt-0.5 text-xl font-black tracking-normal">{report.month}</h3>
          </div>
          <span className="rounded-full px-2.5 py-1 text-[10px] font-bold" style={{ backgroundColor: theme.surfaceTint, color: theme.muted }}>
            {report.imageCard ? 'MiniMax 背景' : '待生成背景'}
          </span>
        </div>

        <div className="mt-4">
          <p className="text-xs font-bold" style={{ color: theme.muted }}>家庭净资产</p>
          <p className="mt-0.5 text-2xl font-black">{formatWan(snapshot.totals.netWorth, hidden)}</p>
          <div className="mt-2 grid grid-cols-3 gap-1.5 text-[9px]">
            <PreviewMetric label="资产" value={formatWan(snapshot.totals.totalAssets, hidden)} color={theme.accent} background={theme.metricTint} />
            <PreviewMetric label="负债" value={formatWan(snapshot.totals.totalLiabilities, hidden)} color={theme.debt} background={theme.metricTint} />
            <PreviewMetric label="负债率" value={formatPercent(snapshot.totals.debtRatio, hidden)} color={theme.debt} background={theme.metricTint} />
          </div>
        </div>

        <div className="mt-3 border-t pt-3" style={{ borderColor: theme.divider }}>
          <p className="text-xs font-black" style={{ color: theme.accent }}>本月一句话</p>
          <p className="mt-1 line-clamp-2 text-sm font-black leading-5">{content.headline}</p>
        </div>

        <div className="mt-3 space-y-2 text-[10px] leading-4">
          <PreviewSection title="主要变化" items={content.changes.slice(0, 2)} color={theme.accent} />
          <PreviewSection title="风险提醒" items={content.risks.slice(0, 1)} color={theme.debt} />
          <PreviewSection title="下月建议" items={content.nextSteps.slice(0, 2)} color={theme.accent} />
        </div>

        <p className="mt-auto text-[9px] font-semibold leading-4" style={{ color: theme.muted }}>
          AI 内容仅用于家庭复盘参考，不构成投资、法律或税务建议。
        </p>
      </div>
    </div>
  )
}

function PreviewMetric({ label, value, color, background }: { label: string; value: string; color: string; background: string }) {
  return (
    <div className="min-w-0 rounded-xl px-2 py-1.5" style={{ backgroundColor: background }}>
      <p className="truncate font-bold opacity-70">{label}</p>
      <p className="mt-0.5 truncate font-black" style={{ color }}>{value}</p>
    </div>
  )
}

function PreviewSection({ title, items, color }: { title: string; items: string[]; color: string }) {
  return (
    <section className="border-l-2 pl-2" style={{ borderColor: color }}>
      <h4 className="font-black" style={{ color }}>{title}</h4>
      <ul className="mt-0.5 space-y-0.5 text-ink/80">
        {items.map((item, index) => (
          <li key={index} className="line-clamp-1">· {item}</li>
        ))}
      </ul>
    </section>
  )
}

function findReportSnapshot(report: AiReport, snapshots: MonthlySnapshot[]) {
  return snapshots.find(snapshot => snapshot.id === report.snapshotId)
    || snapshots.find(snapshot => snapshot.month === report.month)
}

function getCategoryTone(category: LedgerCategory) {
  const isLiability = category === 'liabilities_loans'
  return {
    bar: isLiability ? 'bg-danger' : 'bg-brand',
    track: isLiability ? 'bg-danger-light/70' : 'bg-surface-dark',
    text: isLiability ? 'text-danger' : 'text-ink'
  }
}

function formatTrendMonthTick(month: string) {
  return month.slice(2)
}

function formatSignedWan(amount: number) {
  const prefix = amount > 0 ? '+' : ''
  return `${prefix}${formatWan(amount)}`
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
