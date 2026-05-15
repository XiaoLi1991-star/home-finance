import { Link } from 'react-router-dom'
import { ArrowRight, Bot, CalendarCheck, Eye, EyeOff, Plus, ShieldCheck, TrendingUp, Upload, UserRound, Wallet } from 'lucide-react'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { PageHeader } from '@/components/PageHeader'
import { calculateLedgerStats } from '@/lib/v2/calculations'
import { calculateFamilyStatusScore } from '@/lib/v2/scoring'
import { formatPercent, formatWan } from '@/lib/utils'
import { useLedgerStore } from '@/store/useLedgerStore'
import { useSettingsStore } from '@/store/useSettingsStore'

export default function Home() {
  const items = useLedgerStore(state => state.items)
  const drafts = useLedgerStore(state => state.drafts)
  const hidden = useSettingsStore(state => state.privacy.hideAmounts)
  const updatePrivacy = useSettingsStore(state => state.updatePrivacy)
  const financialProfile = useSettingsStore(state => state.financialProfile)
  const stats = calculateLedgerStats(items)
  const score = calculateFamilyStatusScore(stats.totals, financialProfile)
  const hasActiveRecords = stats.activeItems.length > 0
  const hasProfile = score.level !== 'missing_profile'
  const hasScore = hasActiveRecords && hasProfile && score.level !== 'empty'
  const statusTitle = hasScore ? score.title : hasProfile ? '还没有正式记录' : score.title
  const statusScore = hasScore ? String(score.score) : '--'
  const statusReasons = hasScore
    ? score.reasons
    : !hasProfile
      ? score.reasons
      : [
        '先导入备份或新增一条资产、负债记录。',
        '有了正式记录后，这里会显示负债率、流动性和净资产状态。'
      ]
  const primaryAction = !hasProfile
    ? { to: '/settings', label: '填写参数', icon: UserRound }
    : hasActiveRecords
      ? { to: '/monthly', label: '月度确认', icon: CalendarCheck }
      : { to: '/migration', label: '导入备份', icon: Upload }
  const PrimaryActionIcon = primaryAction.icon

  return (
    <div className="space-y-5 pb-24">
      <PageHeader title="家庭资产概览" subtitle="资产健康度、负债和本月要做的事" />

      <Card className="overflow-hidden bg-[linear-gradient(135deg,#ffffff_0%,#eef8f3_56%,#fbf1df_100%)] p-5 shadow-[0_18px_40px_rgba(36,53,47,0.10)]">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-[#76877e]">资产健康度</p>
            <h2 className="mt-1 text-2xl font-black">{statusTitle}</h2>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/80 bg-white/80 text-xl font-black text-[#34745b] shadow-[0_10px_24px_rgba(52,116,91,0.16)]">
            {statusScore}
          </div>
        </div>

        <div className="mt-5">
          <p className="text-xs text-[#76877e]">家庭净资产</p>
          <div className="mt-1 flex items-center gap-2">
            <p className="text-3xl font-black tracking-tight">{formatWan(stats.totals.netWorth, hidden)}</p>
            <button
              type="button"
              className="rounded-full p-1.5 text-[#8c9b94] active:bg-[#edf4f0]"
              aria-label={hidden ? '显示金额' : '隐藏金额'}
              onClick={() => updatePrivacy({ hideAmounts: !hidden })}
            >
              {hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-[#dce8e2]/80 bg-white/70 p-3">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-[#287a5c]" />
              <p className="text-xs text-[#76877e]">总资产</p>
            </div>
            <p className="mt-2 font-bold text-[#287a5c]">{formatWan(stats.totals.totalAssets, hidden)}</p>
          </div>
          <div className="rounded-lg border border-[#efd7d7] bg-white/70 p-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#a44f4f]" />
              <p className="text-xs text-[#8d7474]">总负债</p>
            </div>
            <p className="mt-2 font-bold text-[#a44f4f]">{formatWan(stats.totals.totalLiabilities, hidden)}</p>
          </div>
        </div>

        {hasScore && (
          <div className="mt-3 rounded-lg border border-[#dce8e2]/80 bg-white/70 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-[#76877e]">预期净资产</p>
                <p className="mt-1 font-bold">{formatWan(score.expectedNetWorth || 0, hidden)}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs text-[#76877e]">达成进度</p>
                <p className="mt-1 font-black text-[#486c9f]">
                  {hidden ? '****' : `${Math.max(0, (score.accumulationRatio || 0) * 100).toFixed(1)}%`}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#eef3f0]">
          <div
            className="h-full rounded-full bg-[#4f9b79]"
            style={{ width: hasScore ? `${Math.min(100, Math.max(0, score.score))}%` : '0%' }}
          />
        </div>
        <p className="mt-2 text-xs text-[#76877e]">
          负债率 {hasScore ? formatPercent(stats.totals.debtRatio) : '--'} · 流动性 {hasScore ? formatPercent(stats.totals.liquidityRatio) : '--'}
        </p>
      </Card>

      <Card className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-[#4f9b79]" />
          <h3 className="font-bold">今天可以做什么</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Link to={primaryAction.to}>
            <Button variant="secondary" className="w-full justify-start">
              <PrimaryActionIcon className="h-4 w-4" />
              {primaryAction.label}
            </Button>
          </Link>
          <Link to="/ledger/new">
            <Button className="w-full justify-start">
              <Plus className="h-4 w-4" />
              记一笔
            </Button>
          </Link>
          <Link to="/ai-entry" className="col-span-2">
            <Button variant="secondary" className="w-full justify-start">
              <Bot className="h-4 w-4" />
              AI 快速记
              <ArrowRight className="ml-auto h-4 w-4 text-[#8c9b94]" />
            </Button>
          </Link>
          {drafts.length > 0 && (
            <Link to="/drafts" className="col-span-2">
              <Button variant="ghost" className="w-full justify-start">
                待确认 {drafts.length} 条
              </Button>
            </Link>
          )}
        </div>
      </Card>

      <Card className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-[#486c9f]" />
          <h3 className="font-bold">健康度解释</h3>
        </div>
        <div className="space-y-2">
          {statusReasons.map(reason => (
            <p key={reason} className="rounded-lg border border-[#e7efe9] bg-[#f7faf8] px-3 py-2 text-sm text-[#55645e]">
              {reason}
            </p>
          ))}
        </div>
      </Card>
    </div>
  )
}
