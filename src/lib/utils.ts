import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatWan(amount: number, hidden = false): string {
  if (hidden) return '****'
  return `${amount.toFixed(2)} 万`
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}

export function getCurrentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

