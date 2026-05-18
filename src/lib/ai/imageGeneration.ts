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

export async function generateMonthlyReportBackground(options: {
  settings: ModelSettings
  apiKey: string
  report: AiReport
  snapshot: MonthlySnapshot
  prompt?: string
}): Promise<AiReportImageCard> {
  if (!options.apiKey.trim()) throw new Error('请先填写访问密钥。')

  const prompt = options.prompt?.trim() || createMonthlyReportBackgroundPrompt(options.report, options.snapshot)
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

export function createMonthlyReportBackgroundPrompt(report: AiReport, snapshot: MonthlySnapshot) {
  const debtRatio = snapshot.totals.totalAssets > 0
    ? Math.round((snapshot.totals.totalLiabilities / snapshot.totals.totalAssets) * 100)
    : 0
  return [
    'Create a premium vertical 2:3 background image for a Chinese family finance monthly report poster.',
    'No text, no numbers, no letters, no logos, no watermark, no people, no realistic bank card, no QR code.',
    'Elegant fintech editorial style with warm home-finance feeling, premium but quiet.',
    'Use refined white marble texture, translucent glass layers, soft paper grain, subtle watercolor diffusion, and faint abstract ledger or line-chart motifs.',
    'Leave a calm readable center area and generous margins for app-rendered Chinese text overlay; avoid busy details behind text zones.',
    'Palette: muted sage green, mineral blue, warm ivory, pale jade, tiny rose accent for risk, sophisticated and not cartoonish.',
    'Texture should feel richer than a simple gradient: marble veins should be delicate and low-contrast, colors softly bleeding into each other, gentle lighting, no harsh shadows.',
    `Mood reference: ${report.month} monthly household balance, stable assets, debt ratio around ${debtRatio} percent.`
  ].join(' ')
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
