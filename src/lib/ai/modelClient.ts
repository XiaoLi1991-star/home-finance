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

function normalizeContentText(value: unknown): string {
  if (typeof value === 'string') return value
  if (!Array.isArray(value)) return ''

  return value
    .map(part => {
      if (typeof part === 'string') return part
      if (!part || typeof part !== 'object') return ''
      const item = part as { text?: unknown; content?: unknown }
      if (typeof item.text === 'string') return item.text
      if (typeof item.content === 'string') return item.content
      return ''
    })
    .join('')
}

function readOutputText(output: unknown): string {
  if (typeof output === 'string') return output
  if (!Array.isArray(output)) return ''

  return output
    .map(item => {
      if (typeof item === 'string') return item
      if (!item || typeof item !== 'object') return ''
      const entry = item as { content?: unknown; text?: unknown }
      return normalizeContentText(entry.content) || normalizeContentText(entry.text)
    })
    .join('')
}

export function readChatContent(payload: unknown): string {
  const data = payload as {
    choices?: Array<{ delta?: { content?: unknown }; message?: { content?: unknown }; text?: unknown }>
    message?: { content?: unknown }
    reply?: string
    output?: unknown
    output_text?: string
  }
  return normalizeContentText(data.choices?.[0]?.message?.content)
    || normalizeContentText(data.choices?.[0]?.delta?.content)
    || normalizeContentText(data.choices?.[0]?.text)
    || normalizeContentText(data.message?.content)
    || data.reply
    || data.output_text
    || readOutputText(data.output)
    || ''
}

export function stripReasoningText(content: string): string {
  return content
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/^\s*<think>[\s\S]*$/i, '')
    .trim()
}

function usesMiniMaxContract(settings: ModelSettings): boolean {
  const baseUrl = settings.baseUrl.toLowerCase()
  const model = settings.model.toLowerCase()
  return baseUrl.includes('minimax') || model.startsWith('minimax-')
}

function createRequestBody(settings: ModelSettings, messages: ChatMessage[], options: ChatCompletionOptions): Record<string, unknown> {
  const maxTokens = options.maxTokens ?? settings.maxTokens ?? 1200
  const temperature = options.temperature ?? settings.temperature ?? 0.2
  const body: Record<string, unknown> = {
    model: settings.model.trim(),
    messages,
    temperature: usesMiniMaxContract(settings) && temperature <= 0 ? 0.1 : temperature,
    stream: false
  }

  if (usesMiniMaxContract(settings)) {
    body.max_completion_tokens = maxTokens
  } else {
    body.max_tokens = maxTokens
  }

  return body
}

function emptyContentMessage(payload: unknown, rawContent: string): string {
  const data = payload as {
    base_resp?: { status_msg?: string }
    choices?: Array<{ finish_reason?: string }>
    input_sensitive?: boolean
    output_sensitive?: boolean
  }

  if (data.input_sensitive || data.output_sensitive) {
    return '模型返回为空：内容被安全策略拦截。请换一个更简单的测试问题，或检查模型服务的安全策略。'
  }
  if (data.base_resp?.status_msg) return `模型返回为空：${data.base_resp.status_msg}`
  if (data.choices?.[0]?.finish_reason === 'length') {
    return '模型返回为空：回复长度上限太低，模型还没输出最终内容。请调高“回复长度上限”后重试。'
  }
  if (rawContent.trim()) {
    return '模型只返回了推理内容，没有输出最终文本。请调高“回复长度上限”后重试。'
  }
  return '模型返回为空。'
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
      body: JSON.stringify(createRequestBody(settings, messages, options))
    })

    const rawText = await response.text()
    const raw = rawText ? JSON.parse(rawText) : {}

    if (!response.ok) {
      const error = raw as { error?: { message?: string }; message?: string }
      throw new Error(error.error?.message || error.message || `模型请求失败：${response.status}`)
    }

    const rawContent = readChatContent(raw)
    const content = stripReasoningText(rawContent)
    if (!content) throw new Error(emptyContentMessage(raw, rawContent))

    return { content, model: settings.model, raw }
  } catch (error) {
    if (error instanceof SyntaxError) throw new Error('模型返回格式不正确。')
    throw error
  } finally {
    window.clearTimeout(timeout)
  }
}
