---
phase: 01-v2-android-rewrite
type: execute
autonomous: true
source_spec: docs/superpowers/specs/2026-05-15-family-finance-v2-design.md
---

# Phase Plan: Android v2 Rewrite

## Objective

Replace the v1 household finance app surface with the confirmed Android-first v2 experience.

Purpose:

- Make the app a reliable household asset ledger.
- Reduce monthly maintenance effort.
- Add v2 insights and AI workflows without compromising local-first data safety.

Output:

- v2 domain model, storage, migration, backup, pages, AI workflows, settings, and Android validation.

## Context

Primary references:

- `docs/superpowers/specs/2026-05-15-family-finance-v2-design.md`
- `.planning/PROJECT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
- `.planning/STATE.md`

Important current files:

- `src/App.tsx`
- `src/components/BottomNav.tsx`
- `src/store/useFinanceStore.ts`
- `src/types/models.ts`
- `src/pages/Home.tsx`
- `src/pages/Assets.tsx`
- `src/pages/Liabilities.tsx`
- `src/pages/Stats.tsx`
- `src/pages/RecordForm.tsx`
- `src/lib/utils.ts`
- `src/lib/dateUtils.ts`
- `src/lib/validationUtils.ts`
- `package.json`
- `capacitor.config.ts`

## Execution Waves

### Wave 1: Data Foundation And Migration

#### Plan 01: Domain Model, Categories, Storage, Migration

Files:

- `src/types/ledger.ts`
- `src/lib/v2/categories.ts`
- `src/lib/v2/storage.ts`
- `src/lib/v2/migration.ts`
- `src/store/useLedgerStore.ts`
- `src/types/models.ts`
- `src/store/useFinanceStore.ts`

Tasks:

1. Create v2 ledger types with LedgerItem, ValuationHistory, MonthlySnapshot, AiReport, DraftItem, AppSettings, categories, owners, statuses, template fields, and custom fields.
2. Create category metadata and v1-to-v2 mapping tables based on the confirmed backup categories.
3. Create a v2 Zustand store with local persistence, import/export hooks, and a compatibility bridge that can read v1 finance-store data without writing v2 records until migration confirmation.

Verify:

- TypeScript compiles.
- Unit tests can instantiate v2 records.
- Migration mapping handles the supplied v1 asset and liability shapes.

Done:

- v2 data can be represented without using v1 Asset/Liability as the primary domain model.
- v1 data can be converted into draft or active v2 records depending on confidence.

#### Plan 02: Finance Calculations, Snapshots, History

Files:

- `src/lib/v2/calculations.ts`
- `src/lib/v2/snapshots.ts`
- `src/lib/v2/history.ts`
- `src/lib/v2/scoring.ts`
- `src/lib/v2/calculations.test.ts`
- `src/lib/v2/snapshots.test.ts`
- `src/lib/v2/migration.test.ts`

Tasks:

1. Implement active-only statistics, category totals, owner totals, debt ratio, liquidity safety, and rule-based family status score.
2. Implement monthly snapshot generation and trend series from snapshots plus valuation history.
3. Implement amount-edit history creation and archived-history helpers.

Verify:

- Unit tests prove Draft, Pending Confirmation, and Ended records are excluded from current totals.
- Unit tests prove monthly snapshots preserve totals.
- Unit tests prove v1 backup examples produce expected category totals.

Done:

- Home and Insights can consume calculation helpers without duplicating business rules.

#### Plan 03: Backup Format And Test Baseline

Files:

- `src/lib/v2/backup.ts`
- `src/lib/v2/backup.test.ts`
- `src/pages/Settings.tsx`
- `package.json`
- `tests/runTests.js`

Tasks:

1. Add v2 JSON backup and restore helpers with `schemaVersion`.
2. Add migration-before-write backup flow helpers.
3. Replace or retire stale `npm test` runner so `npm test` runs the maintained Vitest suite.

Verify:

- `npm test` passes.
- `npx vitest run` passes.
- v2 backup round-trips sample v2 data.

Done:

- Test entry point is reliable before UI rewrite begins.

### Wave 2: App Shell And Core Ledger UX

#### Plan 04: v2 App Shell, Navigation, UI Primitives

Files:

- `src/App.tsx`
- `src/components/BottomNav.tsx`
- `src/components/PageHeader.tsx`
- `src/components/Card.tsx`
- `src/components/Button.tsx`
- `src/components/Input.tsx`
- `src/index.css`
- `src/pages/HomeV2.tsx`
- `src/pages/Ledger.tsx`
- `src/pages/Monthly.tsx`
- `src/pages/Insights.tsx`
- `src/pages/Settings.tsx`

Tasks:

1. Replace primary routes with Home, Ledger, Monthly, Insights, and Settings.
2. Update bottom navigation labels and icons.
3. Add Android-first shared UI primitives for warm family-status styling, compact cards, segmented controls, filters, and empty states.

Verify:

- App routes render without login.
- Bottom navigation appears on the five primary pages.
- Android back-button behavior still exits on primary tabs and navigates back from detail/edit screens.

Done:

- v2 shell is the primary app surface.

#### Plan 05: Ledger List, Detail, Editor, Draft Confirmation

Files:

- `src/pages/Ledger.tsx`
- `src/pages/LedgerDetail.tsx`
- `src/pages/LedgerEditor.tsx`
- `src/pages/DraftReview.tsx`
- `src/components/ledger/*`
- `src/store/useLedgerStore.ts`
- `src/lib/v2/categories.ts`

Tasks:

1. Build Ledger page with asset/liability grouping, search, category/owner/status filters.
2. Build detail page with lightweight details and collapsed valuation/status history.
3. Build editor and draft-review flow with bulk confirm plus per-item edit/discard.

Verify:

- User can create, edit, confirm, end, and inspect a ledger item.
- Draft records do not affect current totals until confirmed.
- History remains collapsed by default.

Done:

- Ledger supports the core record-management workflow.

#### Plan 06: Monthly Confirmation And Home Status

Files:

- `src/pages/Monthly.tsx`
- `src/pages/HomeV2.tsx`
- `src/components/monthly/*`
- `src/components/home/*`
- `src/store/useLedgerStore.ts`
- `src/lib/v2/snapshots.ts`
- `src/lib/v2/scoring.ts`

Tasks:

1. Build Monthly page with priority confirmation list, unchanged confirmation, amount edits, and likely-ended prompts.
2. Generate MonthlySnapshot from confirmed active records.
3. Build Home family-status view using rule-based score, net worth, debt pressure, liquidity hints, monthly tasks, and AI quick-entry entry point.

Verify:

- Monthly confirmation can generate a snapshot with minimal changes.
- Likely-ended records require user confirmation before becoming Ended.
- Home totals match active-only calculation helpers.

Done:

- Monthly and Home flows are usable without AI configured.

### Wave 3: Insights, Settings, And AI

#### Plan 07: Insights And Settings

Files:

- `src/pages/Insights.tsx`
- `src/pages/Settings.tsx`
- `src/components/insights/*`
- `src/components/settings/*`
- `src/store/useSettingsStore.ts`
- `src/lib/v2/backup.ts`

Tasks:

1. Build Insights page with asset, liability, and net-worth trends, category structure, debt ratio, liquidity safety, and AI report history.
2. Build Settings page with model config, backup/restore, migration entry, privacy, launch protection toggles, and amount hiding.
3. Wire backup/restore and migration wizard entry from Settings.

Verify:

- Insights render from snapshots and active data.
- Settings can save Base URL, model name, and non-secret preferences.
- Backup export includes `schemaVersion`.

Done:

- User can manage data and inspect trends from v2 UI.

#### Plan 08: Model Client, Privacy Summaries, AI Report Pipeline

Files:

- `src/lib/ai/modelClient.ts`
- `src/lib/ai/providers.ts`
- `src/lib/ai/privacy.ts`
- `src/lib/ai/prompts.ts`
- `src/lib/ai/reports.ts`
- `src/store/useSettingsStore.ts`
- `src/store/useLedgerStore.ts`
- `src/lib/ai/*.test.ts`

Tasks:

1. Implement provider-flexible model client for OpenAI-style chat completions with Base URL, API Key, model name, and advanced settings hooks.
2. Implement sanitized summary generation for AI calls and first-use authorization state.
3. Implement monthly health report generation, parsing, storage, retry behavior, and disclaimer.

Verify:

- Unit tests cover sanitized summaries and report parsing.
- AI failure does not block snapshot save.
- Reports are attached to monthly snapshots.

Done:

- Monthly confirmation can trigger report generation when configured.

#### Plan 09: AI Entry And Migration Review UX

Files:

- `src/pages/AiEntry.tsx`
- `src/pages/MigrationWizard.tsx`
- `src/components/ai/*`
- `src/components/migration/*`
- `src/lib/ai/entry.ts`
- `src/lib/ai/migrationAssist.ts`
- `src/lib/v2/migration.ts`

Tasks:

1. Build AI quick-entry screen that parses free text into draft records.
2. Build migration wizard for v1 JSON with converted records and low-confidence Pending Confirmation records.
3. Reuse DraftReview for AI entry and migration confirmation.

Verify:

- AI output never becomes Active without user confirmation.
- v1 backup file can be reviewed and imported.
- Low-confidence items are visually marked.

Done:

- AI reduces entry effort while preserving user approval.

### Wave 4: Android Hardening And Release Verification

#### Plan 10: Android Privacy, Secrets, Reminders

Files:

- `src/lib/native/secrets.ts`
- `src/lib/native/launchProtection.ts`
- `src/lib/native/monthlyReminder.ts`
- `src/store/useSettingsStore.ts`
- `src/pages/Settings.tsx`
- `package.json`
- `capacitor.config.ts`
- `android/app/src/main/AndroidManifest.xml`

Tasks:

1. Add separated API Key storage with Android-capable secure storage or the best available local fallback after dependency verification.
2. Add launch protection flow for PIN and prepare biometric integration if supported by the selected dependency.
3. Add monthly confirmation reminder or document the exact blocker if local notification dependency cannot be added safely.

Verify:

- API Key is not stored in the same persisted settings object as Base URL/model name.
- Launch protection can be enabled/disabled.
- Reminder behavior is testable or explicitly deferred with a concrete reason.

Done:

- Android privacy requirements are implemented or narrowly documented for follow-up.

#### Plan 11: Integration Verification, Mobile Polish, Cleanup

Files:

- `src/**/*`
- `package.json`
- `ANDROID_BUILD_GUIDE.md`
- `docs/superpowers/specs/2026-05-15-family-finance-v2-design.md`
- `.planning/STATE.md`

Tasks:

1. Run full TypeScript and Vitest verification, plus v1 JSON migration fixture verification.
2. Start the Vite app and verify primary flows in a mobile viewport with browser screenshots.
3. Run mobile build and Capacitor sync/build-path verification.

Verify:

- `npm run check` passes.
- `npm test` passes.
- `npx vitest run` passes.
- `npm run build:mobile` passes.
- Android project remains sync-ready.

Done:

- v2 release candidate satisfies acceptance criteria.

## Critical Risks

- One-pass cutover touches most user-facing files and stores.
- AI JSON parsing must be defensive because model output may be malformed.
- API Key secure storage may require adding and validating a native Capacitor plugin.
- Current code has legacy backend and mini-program paths that should not distract from Android v2.
- Current `npm test` is stale and must be fixed early.

## Success Criteria

- All acceptance criteria in `.planning/REQUIREMENTS.md` are met.
- User can migrate the supplied v1 backup into v2.
- User can run the Android-first v2 flow without cloud sync.
- AI is useful but optional.
- Current totals are status-correct.
- No generated draft data can silently pollute active statistics.

