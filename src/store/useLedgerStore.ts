import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import {
  LEDGER_SCHEMA_VERSION,
  type AiReport,
  type LedgerData,
  type LedgerItem,
  type MonthlySnapshot,
  type ValuationHistory,
  type V1BackupLike
} from '@/types/ledger'
import { applyAmountEdit } from '@/lib/v2/history'
import { migrateV1Backup, type MigrationResult } from '@/lib/v2/migration'
import { createEmptyLedgerData, V2_STORAGE_KEY } from '@/lib/v2/storage'
import { createMonthlySnapshot, upsertSnapshot } from '@/lib/v2/snapshots'

interface LedgerState extends LedgerData {
  importData: (data: LedgerData) => void
  previewV1Migration: (backup: V1BackupLike) => MigrationResult
  applyMigratedItems: (items: LedgerItem[]) => void
  addDrafts: (drafts: LedgerData['drafts']) => void
  confirmDraft: (id: string) => void
  confirmAllDrafts: () => void
  discardDraft: (id: string) => void
  clearDrafts: () => void
  addItem: (item: LedgerItem) => void
  updateItem: (id: string, patch: Partial<Omit<LedgerItem, 'id' | 'createdAt'>>) => void
  updateItemAmount: (id: string, amount: number, note?: string) => void
  deleteItem: (id: string) => void
  confirmItem: (id: string) => void
  endItem: (id: string) => void
  addHistory: (history: ValuationHistory) => void
  createSnapshot: (month?: string) => MonthlySnapshot
  addReport: (report: AiReport) => void
  resetLedger: () => void
}

const emptyData = createEmptyLedgerData()

export const useLedgerStore = create<LedgerState>()(
  persist(
    (set, get) => ({
      ...emptyData,

      importData: (data) => {
        set({
          ...data,
          schemaVersion: LEDGER_SCHEMA_VERSION
        })
      },

      previewV1Migration: (backup) => migrateV1Backup(backup),

      applyMigratedItems: (items) => {
        set(state => ({
          items: [
            ...items,
            ...state.items.filter(existing => {
              const existingSource = `${existing.source.system}:${existing.source.sourceId || existing.id}`
              return !items.some(item => `${item.source.system}:${item.source.sourceId || item.id}` === existingSource)
            })
          ]
        }))
      },

      addDrafts: (drafts) => {
        set(state => ({
          drafts: [...drafts, ...state.drafts.filter(existing => !drafts.some(draft => draft.id === existing.id))]
        }))
      },

      confirmDraft: (id) => {
        const now = new Date().toISOString()
        set(state => {
          const draft = state.drafts.find(item => item.id === id)
          if (!draft) return state
          return {
            drafts: state.drafts.filter(item => item.id !== id),
            items: [
              {
                ...draft.item,
                status: draft.item.status === 'draft' ? 'active' : draft.item.status,
                updatedAt: now
              },
              ...state.items
            ]
          }
        })
      },

      confirmAllDrafts: () => {
        const now = new Date().toISOString()
        set(state => ({
          drafts: [],
          items: [
            ...state.drafts.map(draft => ({
              ...draft.item,
              status: draft.item.status === 'draft' ? 'active' as const : draft.item.status,
              updatedAt: now
            })),
            ...state.items
          ]
        }))
      },

      discardDraft: (id) => {
        set(state => ({
          drafts: state.drafts.filter(item => item.id !== id)
        }))
      },

      clearDrafts: () => {
        set({ drafts: [] })
      },

      addItem: (item) => {
        set(state => ({ items: [item, ...state.items] }))
      },

      updateItem: (id, patch) => {
        const now = new Date().toISOString()
        set(state => ({
          items: state.items.map(item => item.id === id ? { ...item, ...patch, updatedAt: now } : item)
        }))
      },

      updateItemAmount: (id, amount, note) => {
        set(state => {
          const histories = [...state.histories]
          const items = state.items.map(item => {
            if (item.id !== id) return item
            const result = applyAmountEdit(item, amount, { note })
            if (result.history) histories.unshift(result.history)
            return result.item
          })
          return { items, histories }
        })
      },

      deleteItem: (id) => {
        set(state => ({
          items: state.items.filter(item => item.id !== id),
          histories: state.histories.filter(history => history.itemId !== id),
          drafts: state.drafts.filter(draft => draft.item.id !== id)
        }))
      },

      confirmItem: (id) => {
        const now = new Date().toISOString()
        set(state => ({
          items: state.items.map(item => item.id === id ? { ...item, status: 'active', updatedAt: now } : item)
        }))
      },

      endItem: (id) => {
        const now = new Date().toISOString()
        set(state => ({
          items: state.items.map(item => item.id === id ? { ...item, status: 'ended', updatedAt: now } : item)
        }))
      },

      addHistory: (history) => {
        set(state => ({ histories: [history, ...state.histories] }))
      },

      createSnapshot: (month) => {
        const snapshot = createMonthlySnapshot(get().items, { month })
        set(state => ({ snapshots: upsertSnapshot(state.snapshots, snapshot) }))
        return snapshot
      },

      addReport: (report) => {
        set(state => ({ reports: [report, ...state.reports.filter(item => item.month !== report.month)] }))
      },

      resetLedger: () => {
        set(createEmptyLedgerData())
      }
    }),
    {
      name: V2_STORAGE_KEY,
      version: LEDGER_SCHEMA_VERSION,
      storage: createJSONStorage(() => localStorage)
    }
  )
)
