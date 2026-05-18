import { Capacitor } from '@capacitor/core'
import { Directory, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import type { AiReport, MonthlySnapshot } from '@/types/ledger'
import { formatDateTimeLabel, formatPercent, formatWan, maskSensitiveNumbers } from '@/lib/utils'

const CARD_WIDTH = 1080
const CARD_HEIGHT = 1620
const FONT_FAMILY = '"HarmonyOS Sans SC", "MiSans", "OPPO Sans", "PingFang SC", "Microsoft YaHei", sans-serif'

interface ReportCardImageOptions {
  report: AiReport
  snapshot: MonthlySnapshot
  hidden: boolean
}

export interface ReportCardContent {
  headline: string
  changes: string[]
  risks: string[]
  nextSteps: string[]
}

export interface ReportCardPreviewTheme {
  background: string
  ink: string
  muted: string
  accent: string
  debt: string
  surfaceTint: string
  metricTint: string
  divider: string
  fontFamily: string
}

interface ReportCardTheme extends ReportCardPreviewTheme {
  base: string
  wash: string
  baseAlt: string
  glowA: string
  glowB: string
  glowC: string
  assetTint: string
  debtTint: string
  accentTint: string
  badgeTint: string
  glows: Array<{ x: number; y: number; radius: number; color: string }>
}

const PALETTES = [
  {
    base: '#f7faf4',
    wash: '#eef8f0',
    baseAlt: '#fff7ea',
    ink: '#1d322b',
    muted: '#5d7067',
    accent: '#2f7b5d',
    debt: '#b65d5d',
    glowA: 'rgba(79,155,121,0.30)',
    glowB: 'rgba(219,166,70,0.22)',
    glowC: 'rgba(72,108,159,0.16)'
  },
  {
    base: '#f8fafc',
    wash: '#eef6ff',
    baseAlt: '#f4f1ea',
    ink: '#1f2f46',
    muted: '#657386',
    accent: '#486c9f',
    debt: '#c25b66',
    glowA: 'rgba(72,108,159,0.25)',
    glowB: 'rgba(79,155,121,0.18)',
    glowC: 'rgba(194,91,102,0.18)'
  },
  {
    base: '#fbf8f2',
    wash: '#f0f7f3',
    baseAlt: '#f6fbff',
    ink: '#25342f',
    muted: '#66736e',
    accent: '#3d8167',
    debt: '#a95f63',
    glowA: 'rgba(61,129,103,0.26)',
    glowB: 'rgba(113,141,182,0.18)',
    glowC: 'rgba(214,173,91,0.20)'
  }
] as const

export async function shareMonthlyReportCardImage(options: ReportCardImageOptions): Promise<void> {
  const dataUrl = await createMonthlyReportCardImage(options)
  const filename = `home-finance-report-${options.report.month}.png`

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

export async function createMonthlyReportCardImage({ report, snapshot, hidden }: ReportCardImageOptions): Promise<string> {
  const canvas = document.createElement('canvas')
  canvas.width = CARD_WIDTH
  canvas.height = CARD_HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('当前设备暂时不能生成图片。')

  const theme = createReportCardTheme(getReportSeed(report, snapshot))
  const content = getReportCardContent(report, hidden)

  await drawReportBackground(ctx, report, theme)
  drawPosterHeader(ctx, report, theme)
  drawSnapshotSummary(ctx, snapshot, hidden, theme)
  drawHeadline(ctx, content.headline, theme)
  drawContentSections(ctx, content, theme)
  drawFooter(ctx, report, theme)

  return canvas.toDataURL('image/png')
}

export function getReportCardContent(report: AiReport, hidden: boolean): ReportCardContent {
  const headline =
    getSectionItems(report, ['一句话'], 1)[0]
    || getSectionItems(report, ['月度报告'], 1)[0]
    || '这个月的家庭资产已经整理好，可以一起看看结构和节奏。'

  const changes = getSectionItems(report, ['主要变化', '变化'], 3)
  const risks = getSectionItems(report, ['风险提醒', '风险', '提醒'], 2)
  const nextSteps = getSectionItems(report, ['下月建议', '建议'], 3)

  return {
    headline: maskSensitiveNumbers(headline, hidden),
    changes: withFallback(changes, ['本月资产和负债已经完成一次集中复盘。'], hidden),
    risks: withFallback(risks, ['继续关注负债比例、现金缓冲和到期事项。'], hidden),
    nextSteps: withFallback(nextSteps, ['下月继续做一次月度确认，把变化及时记下来。'], hidden)
  }
}

export function getReportCardPreviewTheme(seed: string): ReportCardPreviewTheme {
  const theme = createReportCardTheme(seed)
  return {
    background: theme.background,
    ink: theme.ink,
    muted: theme.muted,
    accent: theme.accent,
    debt: theme.debt,
    surfaceTint: theme.surfaceTint,
    metricTint: theme.metricTint,
    divider: theme.divider,
    fontFamily: theme.fontFamily
  }
}

export function getReportSeed(report: AiReport, snapshot: MonthlySnapshot): string {
  return `${report.month}-${report.generatedAt}-${snapshot.id}`
}

function createReportCardTheme(seed: string): ReportCardTheme {
  const rng = mulberry32(hashString(seed))
  const palette = PALETTES[Math.floor(rng() * PALETTES.length)] || PALETTES[0]
  const glows = [
    {
      x: 160 + rng() * 180,
      y: 130 + rng() * 180,
      radius: 480 + rng() * 160,
      color: palette.glowA
    },
    {
      x: 760 + rng() * 180,
      y: 280 + rng() * 260,
      radius: 520 + rng() * 160,
      color: palette.glowB
    },
    {
      x: 600 + rng() * 300,
      y: 1080 + rng() * 230,
      radius: 500 + rng() * 190,
      color: palette.glowC
    }
  ]
  const background = [
    `radial-gradient(circle at ${Math.round(glows[0].x / CARD_WIDTH * 100)}% ${Math.round(glows[0].y / CARD_HEIGHT * 100)}%, ${palette.glowA}, transparent 36%)`,
    `radial-gradient(circle at ${Math.round(glows[1].x / CARD_WIDTH * 100)}% ${Math.round(glows[1].y / CARD_HEIGHT * 100)}%, ${palette.glowB}, transparent 40%)`,
    `radial-gradient(circle at ${Math.round(glows[2].x / CARD_WIDTH * 100)}% ${Math.round(glows[2].y / CARD_HEIGHT * 100)}%, ${palette.glowC}, transparent 42%)`,
    `linear-gradient(135deg, ${palette.base} 0%, ${palette.wash} 48%, ${palette.baseAlt} 100%)`
  ].join(', ')

  return {
    ...palette,
    background,
    glows,
    assetTint: hexToRgba(palette.accent, 0.13),
    debtTint: hexToRgba(palette.debt, 0.13),
    accentTint: hexToRgba(palette.accent, 0.18),
    badgeTint: hexToRgba(palette.ink, 0.07),
    surfaceTint: hexToRgba(palette.ink, 0.055),
    metricTint: hexToRgba(palette.ink, 0.075),
    divider: hexToRgba(palette.ink, 0.16),
    fontFamily: FONT_FAMILY
  }
}

async function drawReportBackground(ctx: CanvasRenderingContext2D, report: AiReport, theme: ReportCardTheme) {
  if (report.imageCard?.backgroundDataUrl) {
    try {
      const image = await loadImage(report.imageCard.backgroundDataUrl)
      drawCoverImage(ctx, image, CARD_WIDTH, CARD_HEIGHT)
      drawImageReadabilityLayer(ctx, theme)
      return
    } catch {
      drawGeneratedBackground(ctx, theme)
      return
    }
  }

  drawGeneratedBackground(ctx, theme)
}

function drawGeneratedBackground(ctx: CanvasRenderingContext2D, theme: ReportCardTheme) {
  const gradient = ctx.createLinearGradient(0, 0, CARD_WIDTH, CARD_HEIGHT)
  gradient.addColorStop(0, theme.base)
  gradient.addColorStop(0.48, theme.wash)
  gradient.addColorStop(1, theme.baseAlt)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT)

  theme.glows.forEach(glow => {
    const blob = ctx.createRadialGradient(glow.x, glow.y, 30, glow.x, glow.y, glow.radius)
    blob.addColorStop(0, glow.color)
    blob.addColorStop(1, glow.color.replace(/[\d.]+\)$/, '0)'))
    ctx.fillStyle = blob
    ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT)
  })

  ctx.save()
  ctx.globalAlpha = 0.22
  ctx.strokeStyle = theme.divider
  ctx.lineWidth = 1.4
  for (let y = 180; y < CARD_HEIGHT; y += 92) {
    ctx.beginPath()
    ctx.moveTo(70, y)
    ctx.bezierCurveTo(300, y - 38, 520, y + 44, 1010, y - 8)
    ctx.stroke()
  }
  ctx.restore()

  const vignette = ctx.createRadialGradient(CARD_WIDTH / 2, CARD_HEIGHT / 2, 320, CARD_WIDTH / 2, CARD_HEIGHT / 2, 950)
  vignette.addColorStop(0, 'rgba(255,255,255,0)')
  vignette.addColorStop(1, 'rgba(15,23,42,0.075)')
  ctx.fillStyle = vignette
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT)
}

function drawImageReadabilityLayer(ctx: CanvasRenderingContext2D, theme: ReportCardTheme) {
  const wash = ctx.createLinearGradient(0, 0, CARD_WIDTH, CARD_HEIGHT)
  wash.addColorStop(0, 'rgba(255,255,255,0.60)')
  wash.addColorStop(0.42, 'rgba(255,255,255,0.42)')
  wash.addColorStop(0.72, 'rgba(255,255,255,0.50)')
  wash.addColorStop(1, 'rgba(255,255,255,0.68)')
  ctx.fillStyle = wash
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT)

  const side = ctx.createLinearGradient(0, 0, CARD_WIDTH, 0)
  side.addColorStop(0, 'rgba(255,255,255,0.44)')
  side.addColorStop(0.5, 'rgba(255,255,255,0.06)')
  side.addColorStop(1, 'rgba(255,255,255,0.28)')
  ctx.fillStyle = side
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT)

  ctx.save()
  ctx.globalAlpha = 0.16
  ctx.fillStyle = theme.base
  for (let y = 0; y < CARD_HEIGHT; y += 6) {
    ctx.fillRect(0, y, CARD_WIDTH, 1)
  }
  ctx.restore()
}

function drawPosterHeader(ctx: CanvasRenderingContext2D, report: AiReport, theme: ReportCardTheme) {
  drawBadge(ctx, 96, 82, '家庭月报', theme.badgeTint, theme.accent)
  drawBadge(ctx, 768, 82, formatDateTimeLabel(report.generatedAt).slice(0, 10), theme.badgeTint, theme.muted)

  ctx.fillStyle = theme.ink
  ctx.font = `900 72px ${FONT_FAMILY}`
  ctx.fillText(report.month, 96, 206)

  ctx.fillStyle = theme.muted
  ctx.font = `700 26px ${FONT_FAMILY}`
  ctx.fillText(report.imageCard ? 'MiniMax 背景 · 本地安全排版' : '本地背景 · 可生成 MiniMax 质感背景', 100, 256)
}

function drawSnapshotSummary(ctx: CanvasRenderingContext2D, snapshot: MonthlySnapshot, hidden: boolean, theme: ReportCardTheme) {
  ctx.fillStyle = theme.muted
  ctx.font = `800 26px ${FONT_FAMILY}`
  ctx.fillText('家庭净资产', 96, 336)

  ctx.fillStyle = theme.ink
  ctx.font = `900 76px ${FONT_FAMILY}`
  fitText(ctx, formatWan(snapshot.totals.netWorth, hidden), 96, 424, 880)

  drawMetricPill(ctx, 96, 486, 270, 84, '资产', formatWan(snapshot.totals.totalAssets, hidden), theme.assetTint, theme.accent)
  drawMetricPill(ctx, 390, 486, 270, 84, '负债', formatWan(snapshot.totals.totalLiabilities, hidden), theme.debtTint, theme.debt)
  drawMetricPill(ctx, 684, 486, 300, 84, '负债率', formatPercent(snapshot.totals.debtRatio, hidden), theme.metricTint, theme.debt)
}

function drawHeadline(ctx: CanvasRenderingContext2D, headline: string, theme: ReportCardTheme) {
  ctx.fillStyle = theme.accent
  ctx.font = `900 30px ${FONT_FAMILY}`
  ctx.fillText('本月一句话', 96, 654)

  ctx.fillStyle = theme.ink
  ctx.font = `800 38px ${FONT_FAMILY}`
  wrapText(ctx, headline, 96, 708, 888, 48, 2)
}

function drawContentSections(ctx: CanvasRenderingContext2D, content: ReportCardContent, theme: ReportCardTheme) {
  drawReportSection(ctx, {
    title: '主要变化',
    items: content.changes,
    x: 96,
    y: 806,
    width: 888,
    height: 220,
    accent: theme.accent,
    theme,
    maxItems: 3
  })
  drawReportSection(ctx, {
    title: '风险提醒',
    items: content.risks,
    x: 96,
    y: 1062,
    width: 888,
    height: 166,
    accent: theme.debt,
    theme,
    maxItems: 2
  })
  drawReportSection(ctx, {
    title: '下月建议',
    items: content.nextSteps,
    x: 96,
    y: 1264,
    width: 888,
    height: 210,
    accent: theme.accent,
    theme,
    maxItems: 3
  })
}

function drawReportSection(
  ctx: CanvasRenderingContext2D,
  options: {
    title: string
    items: string[]
    x: number
    y: number
    width: number
    height: number
    accent: string
    theme: ReportCardTheme
    maxItems: number
  }
) {
  const { title, items, x, y, width, height, accent, theme, maxItems } = options
  ctx.strokeStyle = theme.divider
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x + width, y)
  ctx.stroke()

  ctx.strokeStyle = accent
  ctx.lineWidth = 6
  ctx.beginPath()
  ctx.moveTo(x, y + 22)
  ctx.lineTo(x, y + height - 8)
  ctx.stroke()

  ctx.fillStyle = accent
  ctx.font = `900 27px ${FONT_FAMILY}`
  ctx.fillText(title, x + 28, y + 44)

  ctx.fillStyle = theme.ink
  ctx.font = `700 24px ${FONT_FAMILY}`
  let cursor = y + 86
  for (const item of items.slice(0, maxItems)) {
    if (cursor > y + height - 24) break
    ctx.fillStyle = accent
    ctx.fillText('•', x + 30, cursor)
    ctx.fillStyle = theme.ink
    const lines = wrapText(ctx, item, x + 62, cursor, width - 88, 32, 2)
    cursor += Math.max(1, lines) * 32 + 9
  }
}

function drawFooter(ctx: CanvasRenderingContext2D, report: AiReport, theme: ReportCardTheme) {
  ctx.fillStyle = theme.muted
  ctx.font = `700 23px ${FONT_FAMILY}`
  ctx.fillText('AI 内容仅用于家庭复盘参考，不构成投资、法律或税务建议。', 96, 1548)
  ctx.font = `700 21px ${FONT_FAMILY}`
  ctx.fillText('家庭资产月报 · 本地排版生成', 96, 1588)

  if (report.model) {
    ctx.textAlign = 'right'
    fitText(ctx, report.model, 984, 1588, 360)
    ctx.textAlign = 'left'
  }
}

function drawMetricPill(
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
  roundedRect(ctx, x, y, width, height, 28)
  ctx.fillStyle = fill
  ctx.fill()
  ctx.fillStyle = 'rgba(255,255,255,0.26)'
  ctx.strokeStyle = 'rgba(255,255,255,0.42)'
  ctx.lineWidth = 1.5
  ctx.stroke()

  ctx.fillStyle = color
  ctx.font = `800 22px ${FONT_FAMILY}`
  ctx.fillText(label, x + 24, y + 34)
  ctx.fillStyle = color
  ctx.font = `900 28px ${FONT_FAMILY}`
  fitText(ctx, value, x + 24, y + 70, width - 48)
}

function drawBadge(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, fill: string, color: string) {
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

  return Math.min(lines.length || 1, maxLines)
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('图片加载失败。'))
    image.src = src
  })
}

function drawCoverImage(ctx: CanvasRenderingContext2D, image: HTMLImageElement, width: number, height: number) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight)
  const sw = width / scale
  const sh = height / scale
  const sx = (image.naturalWidth - sw) / 2
  const sy = (image.naturalHeight - sh) / 2
  ctx.drawImage(image, sx, sy, sw, sh, 0, 0, width, height)
}

function getSectionItems(report: AiReport, titleIncludes: string[], maxItems: number) {
  const section = report.sections.find(item => titleIncludes.some(keyword => item.title.includes(keyword)))
  return extractReportItems(section?.content || '').slice(0, maxItems)
}

function withFallback(items: string[], fallback: string[], hidden: boolean) {
  const source = items.length > 0 ? items : fallback
  return source.map(item => maskSensitiveNumbers(item, hidden))
}

function extractReportItems(text: string) {
  const lineItems = text
    .split('\n')
    .map(cleanReportText)
    .filter(Boolean)

  if (lineItems.length > 0) return lineItems

  const compact = cleanReportText(text)
  if (!compact) return []
  return compact
    .split(/[。！？；;]/)
    .map(item => cleanReportText(item))
    .filter(Boolean)
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

function hashString(input: string) {
  let hash = 2166136261
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function mulberry32(seed: number) {
  return function random() {
    let value = seed += 0x6d2b79f5
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace('#', '')
  const value = Number.parseInt(normalized, 16)
  const r = (value >> 16) & 255
  const g = (value >> 8) & 255
  const b = value & 255
  return `rgba(${r},${g},${b},${alpha})`
}

function downloadDataUrl(filename: string, dataUrl: string) {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename
  link.click()
}
