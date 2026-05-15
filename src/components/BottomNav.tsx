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
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/60 bg-[#f8faf9]/80 shadow-[0_-8px_30px_rgb(0,0,0,0.03)] backdrop-blur-xl supports-[backdrop-filter]:bg-[#f8faf9]/60 transition-all duration-300">
      <div className="mx-auto flex h-[68px] max-w-md items-center justify-around gap-1 px-2 pb-[env(safe-area-inset-bottom)]">
        {items.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex h-12 flex-1 flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-semibold transition',
                isActive ? 'bg-[#edf7f2] text-[#34745b]' : 'text-[#8c9b94] active:bg-[#f1f6f4]'
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
