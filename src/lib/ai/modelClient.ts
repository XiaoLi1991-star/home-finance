import type { ModelSettings } from '@/types/ledger'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatCompletionOptions {
  signal?: AbortSignal
  temperature?: number
  maxTokens?: number
}

export interface ChatCompletionResult {
  content: string
  model?: string
  raw: unknown
}

function joinUrl(baseUrl: string, requestPath?: string): string {
  const trimmedBase = baseUrl.trim().replace(/\/+$/, '')
  const path = (requestPath || '/chat/completions').trim()
  if (!trimmedBase) throw new Error('请先填写服务地址。')
  if (/\/chat\/completions\/?$/.test(trimmedBase) && path === '/chat/completions') return trimmedBase
  return `${trimmedBase}/${path.replace(/^\/+/, '')}`
}

function parseCustomHeaders(headers?: Record<string, string>): Record<string, string> {
  if (!headers) return {}
  return Object.fromEntries(
    Object.entries(headers)
      .filter(([, value]) => value.trim().length > 0)
  )
}

function readContent(payload: unknown): string {
  const data = payload as {
    choices?: Array<{ message?: { content?: string }; text?: string }>
    reply?: string
    output?: string
  }
  return data.choices?.[0]?.message?.content
    || data.choices?.[0]?.text
    || data.reply
    || data.output
    || ''
}

export function stripReasoningText(content: string): string {
  return content
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/^\s*<think>[\s\S]*$/i, '')
    .trim()
}

export async function requestChatCompletion(
  settings: ModelSettings,
  apiKey: string,
  messages: ChatMessage[],
  options: ChatCompletionOptions = {}
): Promise<ChatCompletionResult> {
  if (!settings.model.trim()) throw new Error('请先填写模型名。')
  if (!apiKey.trim()) throw new Error('请先填写访问密钥。')

  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), settings.timeoutMs || 60000)
  const signal = options.signal || controller.signal

  try {
    const response = await fetch(joinUrl(settings.baseUrl, settings.requestPath), {
      method: 'POST',
      signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey.trim()}`,
        ...parseCustomHeaders(settings.customHeaders)
      },
      body: JSON.stringify({
        model: settings.model.trim(),
        messages,
        temperature: options.temperature ?? settings.temperature ?? 0.2,
        max_tokens: options.maxTokens ?? settings.maxTokens ?? 1200,
        stream: false
      })
    })

    const rawText = await response.text()
    const raw = rawText ? JSON.parse(rawText) : {}

    if (!response.ok) {
      const error = raw as { error?: { message?: string }; message?: string }
      throw new Error(error.error?.message || error.message || `模型请求失败：${response.status}`)
    }

    const content = stripReasoningText(readContent(raw))
    if (!content) throw new Error('模型返回为空。')

    return { content, model: settings.model, raw }
  } catch (error) {
    if (error instanceof SyntaxError) throw new Error('模型返回格式不正确。')
    throw error
  } finally {
    window.clearTimeout(timeout)
  }
}
