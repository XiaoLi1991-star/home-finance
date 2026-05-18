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
    label: '香槟石纹',
    description: '暖白底色加少量金色石纹，正式又干净',
    swatch: 'linear-gradient(135deg, #fff6de, #f9f1d6 46%, #ffffff)'
  },
  {
    id: 'watercolor',
    label: '翡翠漆面',
    description: '明亮翡翠主色，纹理少，视觉更有记忆点',
    swatch: 'linear-gradient(135deg, #d8fff0, #16c38a 52%, #0c9f78)'
  },
  {
    id: 'glass',
    label: '珊瑚晶石',
    description: '珊瑚粉和珍珠感，柔和但不寡淡',
    swatch: 'linear-gradient(135deg, #fff0e9, #ff9b86 52%, #ffd8c9)'
  },
  {
    id: 'minimal',
    label: '薄荷珍珠',
    description: '浅薄荷和珍珠白，最清爽、最易阅读',
    swatch: 'linear-gradient(135deg, #ffffff, #d8f7e8 54%, #9de3bd)'
  }
]

export function isReportBackgroundStyleAvailable(styleId: ReportBackgroundStyleId) {
  return REPORT_BACKGROUND_STYLES.some(style => style.id === styleId)
}

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
      prompt_optimizer: false,
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
  styleId: ReportBackgroundStyleId = 'minimal'
) {
  const style = getReportBackgroundStylePrompt(styleId)
  return [
    'Create a full-bleed premium luxury brand abstract wallpaper background, vertical 2:3, for a Chinese family monthly report poster.',
    'It must look like a flat high-end material surface, not a scene and not an object.',
    style,
    'Use one dominant saturated color, bright daylight exposure, high-key, fresh, expensive, elegant, beautiful.',
    'The central 75 percent must be smooth, plain, low-detail and readable for app-rendered Chinese text overlay.',
    'Texture is sparse and subtle, under 8 percent contrast, mostly edge-biased.',
    'No text, no numbers, no letters, no logos, no watermark, no people, no QR code.',
    'No chart, no graph, no lines, no data, no finance symbols, no icons, no realistic objects.',
    'No flowers, leaves, plants, clouds, landscape, illustration, frames, borders, panels, rectangles, cards, circles, arcs, plate edges, fabric folds, ribbons, shadows, vignette, 3D shapes.',
    'Avoid black, dark navy, dark gray, muddy brown, low-light scenes, busy patterns, and dramatic shadows.'
  ].join(' ')
}

function getReportBackgroundStylePrompt(styleId: ReportBackgroundStyleId) {
  if (styleId === 'watercolor') {
    return 'Dominant color: vivid jade green, bright and high-key. Flat lacquer wallpaper surface with faint tonal grain and a few soft cloudy shifts, no folds.'
  }
  if (styleId === 'paper') {
    return 'Dominant color: saturated clean cobalt blue with cyan highlights, bright not dark. Flat enamel wallpaper surface with tiny pearlescent speckles, no circles.'
  }
  if (styleId === 'glass') {
    return 'Dominant color: clear coral rose. Flat rose quartz wallpaper texture with very soft mineral bloom and rare pale veins near edges, no flower shapes.'
  }
  if (styleId === 'minimal') {
    return 'Dominant color: fresh mint green and pearl ivory. Flat pearlescent wallpaper surface with soft luminous grain, minimal accent at the edge.'
  }
  return 'Dominant color: warm champagne ivory. Flat luxury stone wallpaper, sparse thin champagne-gold mineral veins only near the left or right edge, center clean.'
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
