import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { WandSparkles } from 'lucide-react'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { PageHeader } from '@/components/PageHeader'
import { createDraftsFromAiRecords, parseAiEntryRecords } from '@/lib/ai/entry'
import { requestChatCompletion } from '@/lib/ai/modelClient'
import { aiEntryMessages } from '@/lib/ai/prompts'
import { getAiApiKey } from '@/lib/native/secrets'
import { useLedgerStore } from '@/store/useLedgerStore'
import { useSettingsStore } from '@/store/useSettingsStore'

export default function AiEntry() {
  const navigate = useNavigate()
  const model = useSettingsStore(state => state.model)
  const addDrafts = useLedgerStore(state => state.addDrafts)
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const run = async () => {
    setError('')
    setLoading(true)
    try {
      const apiKey = await getAiApiKey()
      const result = await requestChatCompletion(model, apiKey, aiEntryMessages(input), { temperature: 0.1 })
      const drafts = createDraftsFromAiRecords(parseAiEntryRecords(result.content))
      addDrafts(drafts)
      navigate('/drafts')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI 解析失败。')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4 pb-24">
      <PageHeader title="AI 快速记" subtitle="先生成草稿，确认后才入账" back />

      <Card className="space-y-4 p-4">
        <textarea
          className="input min-h-52 resize-none py-3"
          value={input}
          onChange={event => setInput(event.target.value)}
          placeholder="例如：新增一笔共同的微信零钱 1.2 万；还有一笔住房贷款剩余 57.1 万。"
        />
        <Button className="w-full" disabled={!input.trim() || loading} onClick={run}>
          <WandSparkles className="h-4 w-4" />
          {loading ? '解析中...' : '生成待确认记录'}
        </Button>
      </Card>

      <Card className="p-4 text-sm text-ink-muted">
        AI 只会生成待确认记录，不会直接计入当前统计。模型请求会发送你输入的这段文字，请避免写入不必要的隐私细节。
      </Card>

      {error && <Card className="border-danger-light bg-danger-light p-4 text-sm text-danger">{error}</Card>}
    </div>
  )
}
