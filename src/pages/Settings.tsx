import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bot, Database, Download, KeyRound, Shield, Upload, UserRound } from 'lucide-react'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { PageHeader } from '@/components/PageHeader'
import { downloadTextFile } from '@/lib/file'
import { requestChatCompletion } from '@/lib/ai/modelClient'
import { clearLaunchPin, hasLaunchPin, setLaunchPin } from '@/lib/native/launchProtection'
import { clearAiApiKey, getAiApiKey, maskSecret, setAiApiKey } from '@/lib/native/secrets'
import { serializeV2Backup } from '@/lib/v2/backup'
import { useLedgerStore } from '@/store/useLedgerStore'
import { useSettingsStore } from '@/store/useSettingsStore'

export default function Settings() {
  const items = useLedgerStore(state => state.items)
  const histories = useLedgerStore(state => state.histories)
  const snapshots = useLedgerStore(state => state.snapshots)
  const reports = useLedgerStore(state => state.reports)
  const drafts = useLedgerStore(state => state.drafts)
  const model = useSettingsStore(state => state.model)
  const privacy = useSettingsStore(state => state.privacy)
  const financialProfile = useSettingsStore(state => state.financialProfile)
  const monthlyReportAutoGenerate = useSettingsStore(state => state.monthlyReportAutoGenerate)
  const updateModel = useSettingsStore(state => state.updateModel)
  const updatePrivacy = useSettingsStore(state => state.updatePrivacy)
  const updateFinancialProfile = useSettingsStore(state => state.updateFinancialProfile)
  const setMonthlyReportAutoGenerate = useSettingsStore(state => state.setMonthlyReportAutoGenerate)
  const [apiKey, setApiKeyValue] = useState('')
  const [savedKeyLabel, setSavedKeyLabel] = useState('未设置')
  const [customHeadersText, setCustomHeadersText] = useState('{}')
  const [testing, setTesting] = useState(false)
  const [pin, setPin] = useState('')
  const [pinLabel, setPinLabel] = useState('未设置')
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    void getAiApiKey().then(value => {
      setApiKeyValue(value)
      setSavedKeyLabel(maskSecret(value))
    })
    void hasLaunchPin().then(exists => setPinLabel(exists ? '已设置' : '未设置'))
  }, [])

  useEffect(() => {
    setCustomHeadersText(JSON.stringify(model.customHeaders || {}, null, 2))
  }, [model.customHeaders])

  const data = useMemo(() => ({
    schemaVersion: 2 as const,
    items,
    histories,
    snapshots,
    reports,
    drafts
  }), [drafts, histories, items, reports, snapshots])

  const saveKey = async () => {
    try {
      await setAiApiKey(apiKey)
      setSavedKeyLabel(maskSecret(apiKey))
      setNotice({ tone: 'success', text: '访问密钥已保存到本机。' })
    } catch (err) {
      setNotice({ tone: 'error', text: err instanceof Error ? err.message : '访问密钥保存失败。' })
    }
  }

  const testConnection = async () => {
    setTesting(true)
    try {
      const key = await getAiApiKey()
      const result = await requestChatCompletion(model, key, [
        { role: 'system', content: '请只回复 OK。' },
        { role: 'user', content: '连接测试' }
      ], { maxTokens: 20, temperature: 0 })
      setNotice({ tone: 'success', text: `连接成功：${result.content.slice(0, 40)}` })
    } catch (err) {
      setNotice({ tone: 'error', text: err instanceof Error ? err.message : '连接失败。' })
    } finally {
      setTesting(false)
    }
  }

  const exportBackup = () => {
    const stamp = new Date().toISOString().slice(0, 10)
    downloadTextFile(`family-finance-v2-${stamp}.json`, serializeV2Backup(data))
  }

  const savePin = async () => {
    try {
      await setLaunchPin(pin)
      updatePrivacy({ launchProtectionEnabled: true })
      setPin('')
      setPinLabel('已设置')
      setNotice({ tone: 'success', text: '启动 PIN 已启用。' })
    } catch (err) {
      setNotice({ tone: 'error', text: err instanceof Error ? err.message : 'PIN 保存失败。' })
    }
  }

  const disablePin = async () => {
    await clearLaunchPin()
    updatePrivacy({ launchProtectionEnabled: false })
    setPin('')
    setPinLabel('未设置')
    setNotice({ tone: 'success', text: '启动 PIN 已关闭。' })
  }

  const saveCustomHeaders = () => {
    try {
      const parsed = JSON.parse(customHeadersText || '{}')
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('自定义请求头格式不正确。')
      updateModel({ customHeaders: parsed as Record<string, string> })
      setNotice({ tone: 'success', text: '更多连接参数已保存。' })
    } catch (err) {
      setNotice({ tone: 'error', text: err instanceof Error ? err.message : '连接参数格式不正确。' })
    }
  }

  const currentYear = new Date().getFullYear()
  const profileAge = financialProfile.birthYear ? currentYear - financialProfile.birthYear : undefined

  return (
    <div className="space-y-4 pb-24">
      <PageHeader title="设置" subtitle="画像、模型、备份和隐私" />

      {notice && (
        <Card className={`p-3 text-sm ${notice.tone === 'error' ? 'border-[#e6c9c9] bg-[#fff7f7] text-[#a44f4f]' : 'text-[#4f6f62]'}`}>
          {notice.text}
        </Card>
      )}

      <Card className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <Database className="h-5 w-5 text-[#4f9b79]" />
          <h2 className="font-bold">数据状态</h2>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <Metric label="台账" value={items.length} />
          <Metric label="快照" value={snapshots.length} />
          <Metric label="待确认" value={drafts.length} />
        </div>
      </Card>

      <Card className="space-y-4 p-4">
        <div className="flex items-center gap-2">
          <UserRound className="h-5 w-5 text-[#486c9f]" />
          <h2 className="font-bold">资产健康度参数</h2>
        </div>
        <p className="text-sm leading-6 text-[#76877e]">预期净资产 = 年龄 × 年收入 ÷ 10</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="出生年份">
            <input
              className="input"
              type="number"
              inputMode="numeric"
              min="1900"
              max={currentYear}
              value={financialProfile.birthYear ?? ''}
              onChange={event => updateFinancialProfile({ birthYear: event.target.value ? Number(event.target.value) : undefined })}
              placeholder="例如 1990"
            />
          </Field>
          <Field label="年收入（万元）">
            <input
              className="input"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.1"
              value={financialProfile.annualIncomeWan ?? ''}
              onChange={event => updateFinancialProfile({ annualIncomeWan: event.target.value ? Number(event.target.value) : undefined })}
              placeholder="例如 30"
            />
          </Field>
        </div>
        <div className="rounded-lg bg-[#f7faf8] p-3 text-sm text-[#55645e]">
          当前年龄：{profileAge && profileAge > 0 ? `${profileAge} 岁` : '未计算'} · 年收入按家庭税前总收入填写
        </div>
      </Card>

      <Card className="p-4">
        <details>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
            <span className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-[#4f9b79]" />
              <span className="font-bold">AI 接入设置</span>
            </span>
            <span className="text-xs text-[#76877e]">{savedKeyLabel === '未设置' ? '未配置' : '已配置'}</span>
          </summary>
          <div className="mt-4 space-y-4">
            <Field label="服务地址">
              <input className="input" value={model.baseUrl} onChange={event => updateModel({ baseUrl: event.target.value })} />
            </Field>
            <Field label="模型名称">
              <input
                className="input"
                list="model-options"
                value={model.model}
                onChange={event => updateModel({ model: event.target.value })}
              />
              <datalist id="model-options">
                <option value="MiniMax-M2.7" />
                <option value="MiniMax-M2.7-highspeed" />
              </datalist>
            </Field>
            <Field label={`访问密钥（${savedKeyLabel}）`}>
              <input
                className="input"
                type="password"
                value={apiKey}
                onChange={event => setApiKeyValue(event.target.value)}
                placeholder="只保存在本机，不进入备份"
              />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={saveKey}>
                <KeyRound className="h-4 w-4" />
                保存密钥
              </Button>
              <Button onClick={testConnection} disabled={testing}>{testing ? '测试中...' : '测试连接'}</Button>
            </div>
            <Button
              variant="ghost"
              className="w-full"
              onClick={async () => {
                await clearAiApiKey()
                setApiKeyValue('')
                setSavedKeyLabel('未设置')
                setNotice({ tone: 'success', text: '本地访问密钥已清除。' })
              }}
            >
              清除本地密钥
            </Button>

            <details className="rounded-lg bg-[#f7faf8] p-3">
              <summary className="cursor-pointer text-sm font-bold">更多连接参数</summary>
              <div className="mt-3 space-y-3">
                <Field label="请求路径">
                  <input className="input" value={model.requestPath || ''} onChange={event => updateModel({ requestPath: event.target.value })} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="随机度">
                    <input className="input" type="number" step="0.1" value={model.temperature ?? 0.2} onChange={event => updateModel({ temperature: Number(event.target.value) })} />
                  </Field>
                  <Field label="回复长度上限">
                    <input className="input" type="number" value={model.maxTokens ?? 1200} onChange={event => updateModel({ maxTokens: Number(event.target.value) })} />
                  </Field>
                </div>
                <Field label="自定义请求头">
                  <textarea className="input min-h-24 resize-none py-3 font-mono text-xs" value={customHeadersText} onChange={event => setCustomHeadersText(event.target.value)} />
                </Field>
                <Button variant="secondary" className="w-full" onClick={saveCustomHeaders}>保存更多参数</Button>
              </div>
            </details>
          </div>
        </details>
      </Card>

      <Card className="space-y-3 p-4">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-[#4f9b79]" />
          <h2 className="font-bold">隐私</h2>
        </div>
        <Toggle label="隐藏金额" checked={privacy.hideAmounts} onChange={checked => updatePrivacy({ hideAmounts: checked })} />
        <Toggle label="后台模糊金额" checked={privacy.blurInBackground} onChange={checked => updatePrivacy({ blurInBackground: checked })} />
        <div className="rounded-lg bg-[#f7faf8] p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold">启动 PIN（{pinLabel}）</span>
            <span className="text-xs text-[#76877e]">{privacy.launchProtectionEnabled ? '已启用' : '未启用'}</span>
          </div>
          <input
            className="input"
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={event => setPin(event.target.value)}
            placeholder="设置至少 4 位 PIN"
          />
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Button size="sm" onClick={savePin}>保存并启用</Button>
            <Button size="sm" variant="secondary" onClick={disablePin}>关闭</Button>
          </div>
        </div>
        <Toggle label="月度确认后自动生成 AI 月报" checked={monthlyReportAutoGenerate} onChange={setMonthlyReportAutoGenerate} />
      </Card>

      <Card className="space-y-3 p-4">
        <h2 className="font-bold">备份与迁移</h2>
        <Button className="w-full justify-start" onClick={exportBackup}>
          <Download className="h-4 w-4" />
          导出新版备份
        </Button>
        <Link to="/migration">
          <Button variant="secondary" className="w-full justify-start">
            <Upload className="h-4 w-4" />
            导入备份 / 旧版迁移
          </Button>
        </Link>
      </Card>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-[#f7faf8] p-3">
      <p className="text-xs text-[#76877e]">{label}</p>
      <p className="mt-1 font-black">{value}</p>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-[#4f6f62]">{label}</span>
      {children}
    </label>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-lg bg-[#f7faf8] p-3">
      <span className="text-sm font-semibold">{label}</span>
      <input className="h-5 w-5 accent-[#4f9b79]" type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} />
    </label>
  )
}
