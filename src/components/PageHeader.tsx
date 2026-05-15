import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  back?: boolean
  action?: React.ReactNode
}

export function PageHeader({ title, back = false, action }: PageHeaderProps) {
  const navigate = useNavigate()
  return (
    <header
      className="sticky top-0 z-20 -mx-4 px-4 pb-1 backdrop-blur-xl bg-surface-dim/80 supports-[backdrop-filter]:bg-surface-dim/60 transition-all duration-300"
      style={{
        paddingTop: 'calc(env(safe-area-inset-top) + 4px)',
        maskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)'
      }}
    >
      <div className="relative flex h-[44px] items-center justify-center">
        {back && (
          <button className="absolute left-0 rounded-full p-2 text-brand active:bg-surface-border transition-colors" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-[22px] w-[22px]" />
          </button>
        )}
        <h1 className="truncate text-lg font-bold text-ink">{title}</h1>
        {action && <div className="absolute right-0">{action}</div>}
      </div>
    </header>
  )
}
