import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Upload, UploadCloud } from 'lucide-react'
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
  const [confirmOverwrite, setConfirmOverwrite] = useState(false)
  const [fileName, setFileName] = useState('')

  const preview = () => {
    setError('')
    setMessage('')
    setConfirmOverwrite(false)
    try {
      const parsed = parseBackupJson(text)
      if (parsed.kind === 'v2') {
        setMessage(`识别为新版备份，包含 ${parsed.backup.data.items.length} 条台账记录。`)
        return
      }
      setMessage(`识别为旧版备份：资产 ${parsed.migration.summary.assetsRead} 条，负债 ${parsed.migration.summary.liabilitiesRead} 条，将生成 ${parsed.migration.summary.itemsCreated} 条待确认记录。`)
    } catch (err) {
      setError(getImportErrorMessage(err))
    }
  }

  const apply = () => {
    setError('')
    setConfirmOverwrite(false)
    try {
      const parsed = parseBackupJson(text)
      if (parsed.kind === 'v2') {
        setMessage(`这是新版备份，包含 ${parsed.backup.data.items.length} 条台账记录。导入后会替换当前本地台账。`)
        setConfirmOverwrite(true)
        return
      }

      addDrafts(createMigrationDrafts(parsed.migration.items))
      navigate('/drafts')
    } catch (err) {
      setError(getImportErrorMessage(err))
    }
  }

  const confirmRestore = () => {
    setError('')
    try {
      const parsed = parseBackupJson(text)
      if (parsed.kind !== 'v2') return
      importData(parsed.backup.data)
      navigate('/ledger')
    } catch (err) {
      setConfirmOverwrite(false)
      setError(getImportErrorMessage(err))
    }
  }

  return (
    <div className="space-y-4 pb-24">
      <PageHeader title="迁移与恢复" subtitle="先预览，再写入台账" back />

      <Card className="space-y-4 p-4">
        <label className="block">
          <span className="text-sm font-semibold text-ink-muted">选择备份文件</span>
          <span className="mt-2 flex min-h-[78px] items-center justify-between gap-3 rounded-2xl border border-dashed border-surface-border bg-surface-dim/70 p-3 transition active:bg-surface-dark">
            <span className="flex min-w-0 items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-brand shadow-[0_8px_20px_rgba(36,53,47,0.05)]">
                {fileName ? <FileText className="h-5 w-5" /> : <UploadCloud className="h-5 w-5" />}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold text-ink">{fileName || '从本机选择 JSON 备份'}</span>
                <span className="mt-0.5 block text-xs text-ink-muted">支持旧版或新版备份文件</span>
              </span>
            </span>
            <span className="shrink-0 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-brand-dark shadow-sm">选择</span>
          </span>
          <input
            className="sr-only"
            type="file"
            accept="application/json,.json"
            onChange={async event => {
              const file = event.target.files?.[0]
              if (!file) return
              setFileName(file.name)
              setText(await readFileAsText(file))
              setConfirmOverwrite(false)
            }}
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-semibold text-ink-muted">或粘贴备份内容</span>
          <textarea
            className="input min-h-48 resize-none py-3 font-mono text-xs"
            value={text}
            onChange={event => {
              setText(event.target.value)
              setConfirmOverwrite(false)
            }}
            placeholder="粘贴旧版或新版备份内容"
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

      {message && <Card className="p-4 text-sm text-ink-muted">{message}</Card>}
      {confirmOverwrite && (
        <Card className="space-y-3 border-[#ecd8b7] bg-[#fffaf0] p-4 text-sm text-[#7b5a2a]">
          <p className="font-semibold">确认覆盖当前台账？</p>
          <p>导入新版备份会替换本机现有台账、快照、月报和待确认记录。</p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" type="button" onClick={() => setConfirmOverwrite(false)}>取消</Button>
            <Button type="button" onClick={confirmRestore}>确认覆盖</Button>
          </div>
        </Card>
      )}
      {error && <Card className="border-danger-light bg-danger-light p-4 text-sm text-danger">{error}</Card>}
    </div>
  )
}

function getImportErrorMessage(error: unknown): string {
  if (error instanceof SyntaxError) return '备份内容格式不正确，请重新选择或粘贴。'
  return error instanceof Error ? error.message : '导入失败。'
}
