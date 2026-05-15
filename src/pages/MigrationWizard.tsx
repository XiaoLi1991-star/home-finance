import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload } from 'lucide-react'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { PageHeader } from '@/components/PageHeader'
import { readFileAsText } from '@/lib/file'
import { parseBackupJson } from '@/lib/v2/backup'
import { createMigrationDrafts } from '@/lib/v2/drafts'
import { useLedgerStore } from '@/store/useLedgerStore'

export default function MigrationWizard() {
  const navigate = useNavigate()
  const importData = useLedgerStore(state => state.importData)
  const addDrafts = useLedgerStore(state => state.addDrafts)
  const [text, setText] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const preview = () => {
    setError('')
    setMessage('')
    try {
      const parsed = parseBackupJson(text)
      if (parsed.kind === 'v2') {
        setMessage(`识别为 v2 备份，包含 ${parsed.backup.data.items.length} 条台账记录。`)
        return
      }
      setMessage(`识别为 v1 备份：资产 ${parsed.migration.summary.assetsRead} 条，负债 ${parsed.migration.summary.liabilitiesRead} 条，将生成 ${parsed.migration.summary.itemsCreated} 条待确认记录。`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '解析失败。')
    }
  }

  const apply = () => {
    setError('')
    try {
      const parsed = parseBackupJson(text)
      if (parsed.kind === 'v2') {
        if (!confirm('确认用这个 v2 备份覆盖当前本地台账？')) return
        importData(parsed.backup.data)
        navigate('/ledger')
        return
      }

      addDrafts(createMigrationDrafts(parsed.migration.items))
      navigate('/drafts')
    } catch (err) {
      setError(err instanceof Error ? err.message : '导入失败。')
    }
  }

  return (
    <div className="space-y-4 pb-24">
      <PageHeader title="迁移与恢复" subtitle="先预览，再写入台账" back />

      <Card className="space-y-4 p-4">
        <label className="block">
          <span className="text-sm font-semibold text-[#4f6f62]">选择 JSON 文件</span>
          <input
            className="mt-2 block w-full text-sm"
            type="file"
            accept="application/json,.json"
            onChange={async event => {
              const file = event.target.files?.[0]
              if (!file) return
              setText(await readFileAsText(file))
            }}
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-semibold text-[#4f6f62]">或粘贴 JSON</span>
          <textarea
            className="input min-h-48 resize-none py-3 font-mono text-xs"
            value={text}
            onChange={event => setText(event.target.value)}
            placeholder="粘贴 v1 或 v2 备份 JSON"
          />
        </label>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" type="button" onClick={preview}>
            <Upload className="h-4 w-4" />
            预览
          </Button>
          <Button type="button" onClick={apply} disabled={!text.trim()}>导入</Button>
        </div>
      </Card>

      {message && <Card className="p-4 text-sm text-[#4f6f62]">{message}</Card>}
      {error && <Card className="border-[#e6c9c9] bg-[#fff7f7] p-4 text-sm text-[#a44f4f]">{error}</Card>}
    </div>
  )
}
