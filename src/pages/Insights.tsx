import { Card } from '@/components/Card'
import { PageHeader } from '@/components/PageHeader'
import { buildTrendFromSnapshots, calculateLedgerStats } from '@/lib/v2/calculations'
import { formatPercent, formatWan } from '@/lib/utils'
import { useLedgerStore } from '@/store/useLedgerStore'

export default function Insights() {
  const items = useLedgerStore(state => state.items)
  const snapshots = useLedgerStore(state => state.snapshots)
  const stats = calculateLedgerStats(items)
  const trend = buildTrendFromSnapshots(snapshots)

  return (
    <div className="space-y-4 pb-24">
      <PageHeader title="洞察" subtitle="走势、结构和月报会集中在这里" />

      <Card className="p-4">
        <h2 className="font-bold">当前结构</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <Metric label="资产" value={formatWan(stats.totals.totalAssets)} />
          <Metric label="负债" value={formatWan(stats.totals.totalLiabilities)} />
          <Metric label="净资产" value={formatWan(stats.totals.netWorth)} />
          <Metric label="负债率" value={formatPercent(stats.totals.debtRatio)} />
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="font-bold">资产负债走势</h2>
        {trend.length === 0 ? (
          <p className="mt-3 text-sm text-[#8c9b94]">生成月度快照后，这里会显示资产、负债、净资产走势。</p>
        ) : (
          <div className="mt-3 space-y-2">
            {trend.map(point => (
              <div key={point.month} className="rounded-xl bg-[#f7faf8] p-3 text-sm">
                <div className="flex justify-between font-bold">
                  <span>{point.month}</span>
                  <span>{formatWan(point.netWorth)}</span>
                </div>
                <p className="mt-1 text-xs text-[#76877e]">资产 {formatWan(point.totalAssets)} · 负债 {formatWan(point.totalLiabilities)}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-4">
        <h2 className="font-bold">AI 月报</h2>
        <p className="mt-3 text-sm text-[#8c9b94]">Wave 3 会接入模型配置和月度体检报告。</p>
      </Card>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[#f7faf8] p-3">
      <p className="text-xs text-[#76877e]">{label}</p>
      <p className="mt-1 font-black">{value}</p>
    </div>
  )
}

