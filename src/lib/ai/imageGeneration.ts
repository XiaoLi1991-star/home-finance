import type { AiReport, AiReportImageCard, ModelSettings, MonthlySnapshot } from '@/types/ledger'

interface MiniMaxImageGenerationResponse {
  id?: string
  data?: {
    image_urls?: string[]
    image_base64?: string[]
    image_base64s?: string[]
    images?: Array<string | { url?: string; image_url?: string; base64?: string; b64_json?: string }>
  }
  base_resp?: {
    status_code?: number
    status_msg?: string
  }
  error?: {
    message?: string
  }
  message?: string
}

export type ReportBackgroundStyleId = 'marble' | 'watercolor' | 'paper' | 'glass' | 'minimal'

export const REPORT_BACKGROUND_STYLES: ReadonlyArray<{
  id: ReportBackgroundStyleId
  label: string
  description: string
  swatch: string
}> = [
  {
    id: 'marble',
    label: '温润大理石',
    description: '浅石纹、低对比、适合正式分享',
    swatch: 'linear-gradient(135deg, #f7faf4, #e5eee9 48%, #fbf6ec)'
  },
  {
    id: 'watercolor',
    label: '淡彩晕染',
    description: '青绿和矿物蓝轻轻晕开，更柔和',
    swatch: 'radial-gradient(circle at 28% 30%, #dbeee6, transparent 40%), radial-gradient(circle at 72% 64%, #dce8f7, transparent 42%), #fbfaf5'
  },
  {
    id: 'paper',
    label: '纸感雾面',
    description: '细腻纸张颗粒，安静耐看',
    swatch: 'linear-gradient(135deg, #fbf8f2, #edf5ef 55%, #f7fbff)'
  },
  {
    id: 'glass',
    label: '玻璃流光',
    description: '轻玻璃层次，现代一点',
    swatch: 'linear-gradient(135deg, #edf7f5, #e8eef9 45%, #f7f2ea)'
  },
  {
    id: 'minimal',
    label: '极简留白',
    description: '最克制，优先保证文字阅读',
    swatch: 'linear-gradient(135deg, #fafaf7, #f2f6f4 55%, #f8fafc)'
  }
]

export async function generateMonthlyReportBackground(options: {
  settings: ModelSettings
  apiKey: string
  report: AiReport
  snapshot: MonthlySnapshot
  prompt?: string
  styleId?: ReportBackgroundStyleId
}): Promise<AiReportImageCard> {
  if (!options.apiKey.trim()) throw new Error('请先填写访问密钥。')

  const prompt = options.prompt?.trim() || createMonthlyReportBackgroundPrompt(options.report, options.snapshot, options.styleId)
  const response = await fetch(resolveMiniMaxImageGenerationUrl(options.settings.baseUrl), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${options.apiKey.trim()}`
    },
    body: JSON.stringify({
      model: 'image-01',
      prompt,
      aspect_ratio: '2:3',
      response_format: 'base64',
      n: 1,
      prompt_optimizer: true,
      aigc_watermark: false,
      seed: createPositiveSeed(`${options.report.month}-${options.snapshot.id}-${prompt}-${Date.now()}`)
    })
  })

  const rawText = await response.text()
  const payload = rawText ? JSON.parse(rawText) as MiniMaxImageGenerationResponse : {}

  if (!response.ok) {
    throw new Error(payload.error?.message || payload.message || payload.base_resp?.status_msg || `图片生成失败：${response.status}`)
  }
  if (payload.base_resp?.status_code && payload.base_resp.status_code !== 0) {
    throw new Error(payload.base_resp.status_msg || '图片生成失败。')
  }

  const backgroundDataUrl = await readMiniMaxImageDataUrl(payload)
  if (!backgroundDataUrl) throw new Error('图片生成成功但没有返回图片数据。')

  return {
    generatedAt: new Date().toISOString(),
    backgroundDataUrl,
    prompt,
    model: 'image-01'
  }
}

function resolveMiniMaxImageGenerationUrl(baseUrl: string) {
  try {
    const url = new URL(baseUrl)
    return `${url.origin}/v1/image_generation`
  } catch {
    return 'https://api.minimaxi.com/v1/image_generation'
  }
}

export function createMonthlyReportBackgroundPrompt(
  report: AiReport,
  snapshot: MonthlySnapshot,
  styleId: ReportBackgroundStyleId = 'marble'
) {
  const debtRatio = snapshot.totals.totalAssets > 0
    ? Math.round((snapshot.totals.totalLiabilities / snapshot.totals.totalAssets) * 100)
    : 0
  const style = getReportBackgroundStylePrompt(styleId)
  return [
    'Create a premium vertical 2:3 background image for a Chinese family finance monthly report poster.',
    'No text, no numbers, no letters, no logos, no watermark, no people, no realistic bank card, no QR code.',
    'Elegant fintech editorial style with warm home-finance feeling, premium but quiet.',
    style,
    'Use faint abstract ledger or line-chart motifs only as subtle background details.',
    'Leave a calm readable center area and generous margins for app-rendered Chinese text overlay; avoid busy details behind text zones.',
    'Palette: muted sage green, mineral blue, warm ivory, pale jade, tiny rose accent for risk, sophisticated and not cartoonish.',
    'Texture should feel richer than a simple gradient but stay low contrast, gentle lighting, no harsh shadows.',
    `Mood reference: ${report.month} monthly household balance, stable assets, debt ratio around ${debtRatio} percent.`
  ].join(' ')
}

function getReportBackgroundStylePrompt(styleId: ReportBackgroundStyleId) {
  if (styleId === 'watercolor') {
    return 'Style direction: subtle watercolor diffusion, pale jade and mineral blue softly bleeding into warm ivory, airy and calm.'
  }
  if (styleId === 'paper') {
    return 'Style direction: refined matte paper texture, soft grain, warm ivory surface, quiet editorial finance stationery feeling.'
  }
  if (styleId === 'glass') {
    return 'Style direction: translucent glass layers, soft reflections, frosted panels, modern premium fintech atmosphere.'
  }
  if (styleId === 'minimal') {
    return 'Style direction: restrained warm off-white background, very light texture, generous empty space, maximum readability.'
  }
  return 'Style direction: refined white marble texture, delicate low-contrast veins, warm ivory stone, premium and quiet.'
}

async function readMiniMaxImageDataUrl(payload: MiniMaxImageGenerationResponse) {
  const directBase64 = [
    ...(payload.data?.image_base64 || []),
    ...(payload.data?.image_base64s || [])
  ].find(Boolean)

  if (directBase64) return normalizeBase64Image(directBase64)

  const images = payload.data?.images || []
  for (const image of images) {
    if (typeof image === 'string') {
      if (isLikelyUrl(image)) return fetchImageAsDataUrl(image)
      return normalizeBase64Image(image)
    }
    const base64 = image.base64 || image.b64_json
    if (base64) return normalizeBase64Image(base64)
    const url = image.url || image.image_url
    if (url) return fetchImageAsDataUrl(url)
  }

  const url = payload.data?.image_urls?.[0]
  if (url) return fetchImageAsDataUrl(url)

  return ''
}

function normalizeBase64Image(value: string) {
  if (value.startsWith('data:image/')) return value
  return `data:image/png;base64,${value}`
}

function isLikelyUrl(value: string) {
  return /^https?:\/\//i.test(value)
}

async function fetchImageAsDataUrl(url: string) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`图片下载失败：${response.status}`)
  const blob = await response.blob()
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('图片读取失败。'))
    reader.readAsDataURL(blob)
  })
}

function createPositiveSeed(input: string) {
  let hash = 2166136261
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 1
}
