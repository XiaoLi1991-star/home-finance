import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card } from '@/components/Card'
import { PageHeader } from '@/components/PageHeader'
import { buildTrendFromSnapshots, calculateLedgerStats } from '@/lib/v2/calculations'
import { getCategoryLabel } from '@/lib/v2/categories'
import { formatPercent, formatWan } from '@/lib/utils'
import { useLedgerStore } from '@/store/useLedgerStore'
import { useSettingsStore } from '@/store/useSettingsStore'

export default function Insights() {
  const items = useLedgerStore(state => state.items)
  const snapshots = useLedgerStore(state => state.snapshots)
  const reports = useLedgerStore(state => state.reports)
  const hidden = useSettingsStore(state => state.privacy.hideAmounts)
  const stats = calculateLedgerStats(items)
  const trend = buildTrendFromSnapshots(snapshots)
  const categoryRows = Object.entries(stats.byCategory)
    .map(([category, amount]) => ({ category, label: getCategoryLabel(category as keyof typeof stats.byCategory), amount }))
    .filter(row => row.amount > 0)
    .sort((a, b) => b.amount - a.amount)
  const maxCategory = Math.max(...categoryRows.map(row => row.amount), 1)

  return (
    <div className="space-y-4 pb-24">
      <PageHeader title="洞察" subtitle="走势、结构和月报会集中在这里" />

      <Card className="p-4">
        <h2 className="font-bold">当前结构</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <Metric label="资产" value={formatWan(stats.totals.totalAssets, hidden)} />
          <Metric label="负债" value={formatWan(stats.totals.totalLiabilities, hidden)} />
          <Metric label="净资产" value={formatWan(stats.totals.netWorth, hidden)} />
          <Metric label="负债率" value={formatPercent(stats.totals.debtRatio)} />
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="font-bold">资产负债走势</h2>
        {trend.length === 0 ? (
          <p className="mt-3 text-sm text-[#8c9b94]">生成月度快照后，这里会显示资产、负债、净资产走势。</p>
        ) : (
          <>
            <div className="mt-3 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#76877e' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#76877e' }} tickLine={false} axisLine={false} width={48} />
                  <Tooltip formatter={(value) => formatWan(Number(value), hidden)} />
                  <Line type="monotone" dataKey="totalAssets" name="资产" stroke="#4f9b79" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="totalLiabilities" name="负债" stroke="#b65d5d" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="netWorth" name="净资产" stroke="#486c9f" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 space-y-2">
              {trend.slice(-3).map(point => (
                <div key={point.month} className="rounded-lg bg-[#f7faf8] p-3 text-sm">
                  <div className="flex justify-between font-bold">
                    <span>{point.month}</span>
                    <span>{formatWan(point.netWorth, hidden)}</span>
                  </div>
                  <p className="mt-1 text-xs text-[#76877e]">
                    资产 {formatWan(point.totalAssets, hidden)} · 负债 {formatWan(point.totalLiabilities, hidden)}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      <Card className="p-4">
        <h2 className="font-bold">分类结构</h2>
        {categoryRows.length === 0 ? (
          <p className="mt-3 text-sm text-[#8c9b94]">暂无有效记录。</p>
        ) : (
          <div className="mt-3 space-y-3">
            {categoryRows.map(row => (
              <div key={row.category}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{row.label}</span>
                  <b>{formatWan(row.amount, hidden)}</b>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[#eef3f0]">
                  <div className="h-full rounded-full bg-[#4f9b79]" style={{ width: `${Math.max(4, (row.amount / maxCategory) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-4">
        <h2 className="font-bold">AI 月报</h2>
        {reports.length === 0 ? (
          <p className="mt-3 text-sm text-[#8c9b94]">在设置里开启自动月报后，月度确认会生成 AI 报告。</p>
        ) : (
          <div className="mt-3 space-y-3">
            {reports.map(report => (
              <details key={report.id} className="rounded-lg bg-[#f7faf8] p-3">
                <summary className="cursor-pointer text-sm font-bold">
                  {report.month} · {report.status === 'completed' ? '已完成' : report.status === 'failed' ? '失败' : '生成中'}
                </summary>
                {report.error ? (
                  <p className="mt-2 text-sm text-[#a44f4f]">{report.error}</p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {report.sections.map(section => (
                      <div key={section.title}>
                        <h3 className="text-sm font-bold">{section.title}</h3>
                        <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[#55645e]">{section.content}</p>
                      </div>
                    ))}
                    <p className="text-xs text-[#8c9b94]">{report.disclaimer}</p>
                  </div>
                )}
              </details>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[#f7faf8] p-3">
      <p className="text-xs text-[#76877e]">{label}</p>
      <p className="mt-1 font-black">{value}</p>
    </div>
  )
}
