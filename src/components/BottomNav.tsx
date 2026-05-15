import { NavLink } from 'react-router-dom'
import { BarChart3, BookOpen, Home, Settings, CalendarCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

const items = [
  { path: '/', label: '首页', icon: Home },
  { path: '/ledger', label: '台账', icon: BookOpen },
  { path: '/monthly', label: '月度', icon: CalendarCheck },
  { path: '/insights', label: '洞察', icon: BarChart3 },
  { path: '/settings', label: '设置', icon: Settings }
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#dce8e2] bg-white/95 shadow-[0_-6px_18px_rgba(36,53,47,0.06)] backdrop-blur">
      <div className="mx-auto flex h-[64px] max-w-md items-center justify-around pb-[env(safe-area-inset-bottom)]">
        {items.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex h-full flex-1 flex-col items-center justify-center gap-1 text-[11px]',
                isActive ? 'text-[#4f9b79]' : 'text-[#8c9b94]'
              )
            }
          >
            <item.icon className="h-[21px] w-[21px]" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

