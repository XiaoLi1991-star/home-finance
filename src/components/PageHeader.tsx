import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  back?: boolean
  action?: React.ReactNode
}

export function PageHeader({ title, subtitle, back = false, action }: PageHeaderProps) {
  const navigate = useNavigate()
  return (
    <header
      className="sticky top-0 z-20 -mx-4 border-b border-[#dce8e2]/80 bg-[#f1f6f4]/95 px-4 pb-3 backdrop-blur"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }}
    >
      <div className="flex items-center gap-3">
        {back && (
          <button className="-ml-2 rounded-full p-2 active:bg-[#e5eee9]" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold text-[#24352f]">{title}</h1>
          {subtitle && <p className="mt-0.5 truncate text-xs text-[#76877e]">{subtitle}</p>}
        </div>
        {action}
      </div>
    </header>
  )
}

