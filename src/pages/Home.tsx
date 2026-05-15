import { Link } from 'react-router-dom'
import { Bot, CalendarCheck, Eye, EyeOff, Plus, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { PageHeader } from '@/components/PageHeader'
import { calculateLedgerStats } from '@/lib/v2/calculations'
import { calculateFamilyStatusScore } from '@/lib/v2/scoring'
import { formatPercent, formatWan } from '@/lib/utils'
import { useLedgerStore } from '@/store/useLedgerStore'

export default function Home() {
  const items = useLedgerStore(state => state.items)
  const stats = calculateLedgerStats(items)
  const score = calculateFamilyStatusScore(stats.totals)
  const hidden = false

  return (
    <div className="space-y-5 pb-24">
      <PageHeader title="家里的资产状态" subtitle="温和一点，但把重点讲清楚" />

      <Card className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-[#76877e]">当前状态</p>
            <h2 className="mt-1 text-2xl font-bold">{score.title}</h2>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#dcebe4] text-xl font-black text-[#34745b]">
            {score.score}
          </div>
        </div>

        <div className="mt-5">
          <p className="text-xs text-[#76877e]">家庭净资产</p>
          <div className="mt-1 flex items-center gap-2">
            <p className="text-3xl font-black tracking-tight">{formatWan(stats.totals.netWorth, hidden)}</p>
            <button className="rounded-full p-1.5 text-[#8c9b94] active:bg-[#edf4f0]">
              {hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-[#f1f6f4] p-3">
            <p className="text-xs text-[#76877e]">总资产</p>
            <p className="mt-1 font-bold text-[#287a5c]">{formatWan(stats.totals.totalAssets, hidden)}</p>
          </div>
          <div className="rounded-xl bg-[#f8f1f1] p-3">
            <p className="text-xs text-[#8d7474]">总负债</p>
            <p className="mt-1 font-bold text-[#a44f4f]">{formatWan(stats.totals.totalLiabilities, hidden)}</p>
          </div>
        </div>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#eef3f0]">
          <div
            className="h-full rounded-full bg-[#4f9b79]"
            style={{ width: `${Math.min(100, Math.max(0, score.score))}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-[#76877e]">负债率 {formatPercent(stats.totals.debtRatio)} · 流动性 {formatPercent(stats.totals.liquidityRatio)}</p>
      </Card>

      <Card className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-[#4f9b79]" />
          <h3 className="font-bold">今天可以做什么</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Link to="/monthly">
            <Button variant="secondary" className="w-full justify-start">
              <CalendarCheck className="h-4 w-4" />
              月度确认
            </Button>
          </Link>
          <Link to="/ledger/new">
            <Button className="w-full justify-start">
              <Plus className="h-4 w-4" />
              记一笔
            </Button>
          </Link>
          <Button variant="secondary" className="col-span-2 justify-start" disabled>
            <Bot className="h-4 w-4" />
            AI 快速记（Wave 3）
          </Button>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="mb-3 font-bold">状态解释</h3>
        <div className="space-y-2">
          {score.reasons.map(reason => (
            <p key={reason} className="rounded-xl bg-[#f7faf8] px-3 py-2 text-sm text-[#55645e]">
              {reason}
            </p>
          ))}
        </div>
      </Card>
    </div>
  )
}

