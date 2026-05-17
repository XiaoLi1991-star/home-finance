import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatWan(amount: number, hidden = false): string {
  if (hidden) return '****'
  return `${amount.toFixed(2)} 万`
}

export function formatPercent(value: number, hidden = false): string {
  if (hidden) return '****'
  return `${(value * 100).toFixed(1)}%`
}

export function maskSensitiveNumbers(text: string, hidden = false): string {
  if (!hidden) return text
  return text.replace(
    /\d+(?:\.\d+)?(?:\s*[-~—至]\s*\d+(?:\.\d+)?)?\s*(万元|万|元|%|岁|笔|天|个月|月|年)?/g,
    (_match, unit = '') => `****${unit}`
  )
}

export function formatDateTimeLabel(value?: string): string {
  if (!value) return '未记录'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mi = String(date.getMinutes()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`
}

export function getCurrentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}
