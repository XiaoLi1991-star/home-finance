import React from 'react'
import { cn } from '@/lib/utils'

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={cn('rounded-lg border border-[#dce8e2] bg-white shadow-sm', className)}>
      {children}
    </section>
  )
}
