import { Card } from '@/components/Card'
import { PageHeader } from '@/components/PageHeader'
import { useLedgerStore } from '@/store/useLedgerStore'

export default function Settings() {
  const itemCount = useLedgerStore(state => state.items.length)
  const snapshotCount = useLedgerStore(state => state.snapshots.length)

  return (
    <div className="space-y-4 pb-24">
      <PageHeader title="设置" subtitle="模型、备份、隐私和迁移都会在这里" />

      <Card className="p-4">
        <h2 className="font-bold">数据状态</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-[#f7faf8] p-3">
            <p className="text-xs text-[#76877e]">台账记录</p>
            <p className="mt-1 font-black">{itemCount}</p>
          </div>
          <div className="rounded-xl bg-[#f7faf8] p-3">
            <p className="text-xs text-[#76877e]">月度快照</p>
            <p className="mt-1 font-black">{snapshotCount}</p>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="font-bold">模型配置</h2>
        <p className="mt-2 text-sm text-[#8c9b94]">Wave 3 会加入 Base URL、API Key、模型名和高级设置。</p>
      </Card>

      <Card className="p-4">
        <h2 className="font-bold">备份与迁移</h2>
        <p className="mt-2 text-sm text-[#8c9b94]">Wave 3 会接上 v1 JSON 迁移向导和 v2 schemaVersion 备份恢复。</p>
      </Card>
    </div>
  )
}

