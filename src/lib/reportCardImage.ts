import { Capacitor } from '@capacitor/core'
import { Directory, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import type { AiReport, MonthlySnapshot } from '@/types/ledger'
import { formatDateTimeLabel, formatPercent, formatWan, maskSensitiveNumbers } from '@/lib/utils'

const CARD_WIDTH = 1080
const CARD_HEIGHT = 1440
const FONT_FAMILY = '"SF Pro Display", "Microsoft YaHei", "PingFang SC", "Noto Sans SC", sans-serif'

export type ReportCardTemplateId = 'family' | 'statement' | 'focus'

export const REPORT_CARD_TEMPLATES = [
  { id: 'family', label: '温和家庭', description: '柔和、适合发给家人看' },
  { id: 'statement', label: '清爽账单', description: '更像一张月度资产单' },
  { id: 'focus', label: '重点卡片', description: '突出结论和行动提醒' }
] as const satisfies ReadonlyArray<{ id: ReportCardTemplateId; label: string; description: string }>

interface ReportCardImageOptions {
  report: AiReport
  snapshot: MonthlySnapshot
  hidden: boolean
  template?: ReportCardTemplateId
}

export async function shareMonthlyReportCardImage(options: ReportCardImageOptions): Promise<void> {
  const dataUrl = createMonthlyReportCardImage(options)
  const filename = `family-report-${options.report.month}-${options.template ?? 'family'}.png`

  if (!Capacitor.isNativePlatform()) {
    downloadDataUrl(filename, dataUrl)
    return
  }

  const base64 = dataUrl.replace(/^data:image\/png;base64,/, '')
  const saved = await writeReportImageFile(filename, base64)

  const canShare = await Share.canShare()
  if (!canShare.value) return

  await Share.share({
    title: `${options.report.month} 家庭月报`,
    text: '家庭月报图片',
    files: [saved.uri],
    dialogTitle: '分享月报图片'
  })
}

async function writeReportImageFile(filename: string, base64: string) {
  try {
    return await Filesystem.writeFile({
      path: filename,
      data: base64,
      directory: Directory.Documents
    })
  } catch {
    return Filesystem.writeFile({
      path: filename,
      data: base64,
      directory: Directory.Cache
    })
  }
}

export function createMonthlyReportCardImage({ report, snapshot, hidden, template = 'family' }: ReportCardImageOptions): string {
  const canvas = document.createElement('canvas')
  canvas.width = CARD_WIDTH
  canvas.height = CARD_HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('当前设备暂时不能生成图片。')

  const style = getTemplateStyle(template)
  const copy = getReportCardCopy(report, hidden)
  drawBackground(ctx, style)
  drawHeader(ctx, report, style)
  drawNetWorthPanel(ctx, snapshot, hidden, style)
  drawDebtPanel(ctx, snapshot, hidden, style)
  drawCopyPanel(ctx, copy, style)
  drawFooter(ctx, report, style)

  return canvas.toDataURL('image/png')
}

interface ReportCardTemplateStyle {
  kicker: string
  subtitle: string
  footer: string
  background: string
  shellFill: string
  panelFill: string
  secondaryPanelFill: string
  accent: string
  accentDark: string
  debt: string
  debtFill: string
  assetFill: string
  net: string
  muted: string
  divider: string
  badgeFill: string
  badgeText: string
  dateBadgeFill: string
  dateBadgeText: string
  glows: Array<{ x: number; y: number; radius: number; color: string }>
}

const TEMPLATE_STYLES: Record<ReportCardTemplateId, ReportCardTemplateStyle> = {
  family: {
    kicker: '家庭月报',
    subtitle: '一张适合保存和分享的家庭资产小结',
    footer: '家庭资产月报 · 本地生成图片',
    background: '#f8fafc',
    shellFill: 'rgba(255,255,255,0.86)',
    panelFill: 'rgba(255,255,255,0.84)',
    secondaryPanelFill: 'rgba(255,255,255,0.76)',
    accent: '#059669',
    accentDark: '#047857',
    debt: '#e11d48',
    debtFill: '#ffe4e6',
    assetFill: '#d1fae5',
    net: '#0f172a',
    muted: '#64748b',
    divider: '#e2e8f0',
    badgeFill: '#d1fae5',
    badgeText: '#059669',
    dateBadgeFill: '#f1f5f9',
    dateBadgeText: '#64748b',
    glows: [
      { x: 180, y: 160, radius: 520, color: 'rgba(16,185,129,0.28)' },
      { x: 900, y: 460, radius: 560, color: 'rgba(225,29,72,0.18)' },
      { x: 820, y: 1260, radius: 520, color: 'rgba(59,130,246,0.16)' }
    ]
  },
  statement: {
    kicker: '月度资产单',
    subtitle: '更克制的账单式结构，适合归档留存',
    footer: '家财簿 · 月度资产单',
    background: '#f6f8f6',
    shellFill: 'rgba(255,255,255,0.92)',
    panelFill: 'rgba(255,255,255,0.90)',
    secondaryPanelFill: 'rgba(246,248,246,0.92)',
    accent: '#2f6e55',
    accentDark: '#244f40',
    debt: '#b65d5d',
    debtFill: '#f7e7e5',
    assetFill: '#e2f1e7',
    net: '#20342f',
    muted: '#6b7b72',
    divider: '#d9e3dd',
    badgeFill: '#e2f1e7',
    badgeText: '#2f6e55',
    dateBadgeFill: '#edf2ef',
    dateBadgeText: '#6b7b72',
    glows: [
      { x: 140, y: 220, radius: 440, color: 'rgba(47,110,85,0.18)' },
      { x: 920, y: 1120, radius: 520, color: 'rgba(210,168,58,0.18)' }
    ]
  },
  focus: {
    kicker: '本月重点',
    subtitle: '把结论、比例和下一步放在同一张卡里',
    footer: '家庭资产月报 · 重点摘要',
    background: '#f7fbff',
    shellFill: 'rgba(255,255,255,0.88)',
    panelFill: 'rgba(255,255,255,0.86)',
    secondaryPanelFill: 'rgba(244,248,252,0.86)',
    accent: '#486c9f',
    accentDark: '#31527f',
    debt: '#c25b66',
    debtFill: '#f8e6e8',
    assetFill: '#e2f1e7',
    net: '#1f2f46',
    muted: '#66758b',
    divider: '#dce6ef',
    badgeFill: '#e5edf7',
    badgeText: '#486c9f',
    dateBadgeFill: '#eef4fa',
    dateBadgeText: '#66758b',
    glows: [
      { x: 190, y: 180, radius: 480, color: 'rgba(72,108,159,0.22)' },
      { x: 850, y: 380, radius: 500, color: 'rgba(16,185,129,0.14)' },
      { x: 820, y: 1220, radius: 500, color: 'rgba(194,91,102,0.16)' }
    ]
  }
}

function getTemplateStyle(template: ReportCardTemplateId): ReportCardTemplateStyle {
  return TEMPLATE_STYLES[template] ?? TEMPLATE_STYLES.family
}

function drawBackground(ctx: CanvasRenderingContext2D, style: ReportCardTemplateStyle) {
  ctx.fillStyle = style.background
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT)

  style.glows.forEach(glow => {
    const gradient = ctx.createRadialGradient(glow.x, glow.y, 40, glow.x, glow.y, glow.radius)
    gradient.addColorStop(0, glow.color)
    gradient.addColorStop(1, glow.color.replace(/[\d.]+\)$/, '0)'))
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT)
  })

  ctx.save()
  ctx.shadowColor = 'rgba(15,23,42,0.08)'
  ctx.shadowBlur = 42
  ctx.shadowOffsetY = 18
  roundedRect(ctx, 64, 64, 952, 1312, 46)
  ctx.fillStyle = style.shellFill
  ctx.fill()
  ctx.restore()
}

function drawHeader(ctx: CanvasRenderingContext2D, report: AiReport, style: ReportCardTemplateStyle) {
  drawBadge(ctx, 116, 116, style.kicker, style.badgeFill, style.badgeText)
  drawBadge(ctx, 790, 116, formatDateTimeLabel(report.generatedAt).slice(0, 10), style.dateBadgeFill, style.dateBadgeText)

  ctx.fillStyle = style.net
  ctx.font = `900 76px ${FONT_FAMILY}`
  ctx.fillText(report.month, 116, 236)

  ctx.fillStyle = style.muted
  ctx.font = `600 28px ${FONT_FAMILY}`
  ctx.fillText(style.subtitle, 118, 286)
}

function drawNetWorthPanel(ctx: CanvasRenderingContext2D, snapshot: MonthlySnapshot, hidden: boolean, style: ReportCardTemplateStyle) {
  drawPanel(ctx, 116, 340, 848, 354, 34, style.panelFill)

  ctx.fillStyle = style.muted
  ctx.font = `700 28px ${FONT_FAMILY}`
  ctx.fillText('家庭净资产', 156, 404)

  ctx.fillStyle = style.net
  ctx.font = `900 74px ${FONT_FAMILY}`
  fitText(ctx, formatWan(snapshot.totals.netWorth, hidden), 156, 496, 760)

  drawMetricBox(ctx, 156, 556, 362, 98, '资产', formatWan(snapshot.totals.totalAssets, hidden), style.assetFill, style.accent)
  drawMetricBox(ctx, 558, 556, 362, 98, '负债', formatWan(snapshot.totals.totalLiabilities, hidden), style.debtFill, style.debt)
}

function drawDebtPanel(ctx: CanvasRenderingContext2D, snapshot: MonthlySnapshot, hidden: boolean, style: ReportCardTemplateStyle) {
  drawPanel(ctx, 116, 730, 848, 168, 30, style.secondaryPanelFill)

  ctx.fillStyle = style.muted
  ctx.font = `700 28px ${FONT_FAMILY}`
  ctx.fillText('负债率', 156, 792)

  ctx.fillStyle = style.debt
  ctx.font = `900 42px ${FONT_FAMILY}`
  ctx.textAlign = 'right'
  ctx.fillText(formatPercent(snapshot.totals.debtRatio, hidden), 920, 792)
  ctx.textAlign = 'left'

  roundedRect(ctx, 156, 836, 764, 22, 11)
  ctx.fillStyle = style.debtFill
  ctx.fill()
  roundedRect(ctx, 156, 836, hidden ? 0 : Math.max(34, Math.min(764, 764 * snapshot.totals.debtRatio)), 22, 11)
  ctx.fillStyle = style.debt
  ctx.fill()
}

function drawCopyPanel(ctx: CanvasRenderingContext2D, copy: { headline: string; suggestion: string; bullets: string[] }, style: ReportCardTemplateStyle) {
  drawPanel(ctx, 116, 934, 848, 296, 34, style.panelFill)

  ctx.fillStyle = style.net
  ctx.font = `900 34px ${FONT_FAMILY}`
  ctx.fillText('本月一句话', 156, 1000)

  ctx.fillStyle = style.net
  ctx.font = `700 31px ${FONT_FAMILY}`
  wrapText(ctx, copy.headline, 156, 1056, 760, 42, 2)

  ctx.strokeStyle = style.divider
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(156, 1136)
  ctx.lineTo(920, 1136)
  ctx.stroke()

  ctx.fillStyle = style.muted
  ctx.font = `600 26px ${FONT_FAMILY}`
  wrapText(ctx, copy.suggestion, 156, 1186, 760, 36, 2)

  if (copy.bullets[0]) {
    ctx.fillStyle = style.accent
    ctx.font = `800 24px ${FONT_FAMILY}`
    ctx.fillText(copy.bullets[0], 156, 1274)
  }
}

function drawFooter(ctx: CanvasRenderingContext2D, report: AiReport, style: ReportCardTemplateStyle) {
  ctx.fillStyle = style.muted
  ctx.font = `600 24px ${FONT_FAMILY}`
  ctx.fillText(style.footer, 116, 1318)

  if (report.model) {
    ctx.textAlign = 'right'
    ctx.fillText(report.model, 964, 1318)
    ctx.textAlign = 'left'
  }
}

function drawMetricBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  label: string,
  value: string,
  fill: string,
  color: string
) {
  roundedRect(ctx, x, y, width, height, 24)
  ctx.fillStyle = fill
  ctx.fill()
  ctx.fillStyle = '#64748b'
  ctx.font = `700 22px ${FONT_FAMILY}`
  ctx.fillText(label, x + 24, y + 38)
  ctx.fillStyle = color
  ctx.font = `900 30px ${FONT_FAMILY}`
  fitText(ctx, value, x + 24, y + 76, width - 48)
}

function drawPanel(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number, fill: string) {
  ctx.save()
  ctx.shadowColor = 'rgba(15,23,42,0.06)'
  ctx.shadowBlur = 24
  ctx.shadowOffsetY = 10
  roundedRect(ctx, x, y, width, height, radius)
  ctx.fillStyle = fill
  ctx.fill()
  ctx.restore()
}

function drawBadge(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, fill = '#d1fae5', color = '#059669') {
  ctx.font = `800 24px ${FONT_FAMILY}`
  const width = Math.max(136, ctx.measureText(text).width + 46)
  roundedRect(ctx, x, y, width, 46, 23)
  ctx.fillStyle = fill
  ctx.fill()
  ctx.fillStyle = color
  ctx.fillText(text, x + 23, y + 31)
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const r = Math.min(radius, width / 2, height / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + width, y, x + width, y + height, r)
  ctx.arcTo(x + width, y + height, x, y + height, r)
  ctx.arcTo(x, y + height, x, y, r)
  ctx.arcTo(x, y, x + width, y, r)
  ctx.closePath()
}

function fitText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number) {
  if (ctx.measureText(text).width <= maxWidth) {
    ctx.fillText(text, x, y)
    return
  }

  let output = text
  while (output.length > 1 && ctx.measureText(`${output}...`).width > maxWidth) {
    output = output.slice(0, -1)
  }
  ctx.fillText(`${output}...`, x, y)
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number
) {
  const chars = text.split('')
  const lines: string[] = []
  let line = ''

  chars.forEach(char => {
    const next = `${line}${char}`
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line)
      line = char
      return
    }
    line = next
  })
  if (line) lines.push(line)

  lines.slice(0, maxLines).forEach((item, index) => {
    const isLast = index === maxLines - 1 && lines.length > maxLines
    fitText(ctx, isLast ? `${item}...` : item, x, y + index * lineHeight, maxWidth)
  })
}

function getReportCardCopy(report: AiReport, hidden: boolean) {
  const headline = getReportSectionLine(report, '一句话') || getReportSectionLine(report) || '这个月的家庭资产已经整理好。'
  const suggestion = getReportSectionLine(report, '建议') || getReportSectionLine(report, '提醒') || '继续保持月度确认，把现金、负债和长期目标放在一起看。'
  const bullets = report.sections
    .flatMap(section => section.content.split('\n'))
    .map(cleanReportText)
    .filter(Boolean)
    .slice(0, 3)

  return {
    headline: maskSensitiveNumbers(headline, hidden),
    suggestion: maskSensitiveNumbers(suggestion, hidden),
    bullets: bullets.map(item => maskSensitiveNumbers(item, hidden))
  }
}

function getReportSectionLine(report: AiReport, titleIncludes?: string) {
  const section = titleIncludes
    ? report.sections.find(item => item.title.includes(titleIncludes))
    : report.sections[0]
  return cleanReportText(section?.content || '').slice(0, 70)
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

function downloadDataUrl(filename: string, dataUrl: string) {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename
  link.click()
}
