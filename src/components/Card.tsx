import React from 'react'
import { cn } from '@/lib/utils'

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={cn('rounded-[20px] border border-white/60 bg-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.03)] backdrop-blur-md', className)}>
      {children}
    </section>
  )
}
