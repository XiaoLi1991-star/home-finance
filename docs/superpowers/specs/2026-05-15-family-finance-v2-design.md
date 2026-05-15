# Family Finance Android v2 Design

## Background

This project is a React + TypeScript + Vite app packaged for Android with Capacitor. The v1 app tracks household assets and liabilities with local storage as the main mobile data store. The Android app is the primary target for this upgrade; web is only a development and debugging surface.

The supplied backup file `finance_backup_2026-05-15.json` contains 10 assets and 4 liabilities. The data shows the app is used as a household asset ledger, not as daily expense accounting. Existing records cover investments, vehicles, property, cash, housing loans, and provident-fund loans.

## Product Goal

Build a v2 Android app that combines:

- A solid household asset ledger.
- A warm, low-pressure family financial status home screen.
- Monthly confirmation with minimal user effort.
- Insight pages for asset, liability, and net-worth trends.
- AI-assisted entry, migration, and monthly asset health reports.

This is a v2 major-version cutover, not a small visual refresh.

## Scope

In scope:

- Android-first redesign.
- New bottom navigation: Home, Ledger, Monthly, Insights, Settings.
- New v2 ledger model with categories, status, ownership, valuation history, and monthly snapshots.
- Migration wizard for v1 JSON backups.
- JSON backup with `schemaVersion`.
- Local model configuration with Base URL, API Key, and model name.
- AI batch entry, old JSON migration mapping, and monthly health reports.
- App launch protection and privacy protections.

Out of scope for v2 first release:

- Cloud sync or cloud backup.
- Attachments and documents.
- Full login, user accounts, or multi-user permission system.
- WeChat mini-program upgrade.
- Specific securities or fund buy/sell recommendations.

## Navigation

Bottom tabs:

- **Home**: family status, rule-based score, net worth, debt pressure, liquidity hints, current-month tasks, AI quick entry.
- **Ledger**: grouped asset and liability ledger, search, filters, detail pages, archived history.
- **Monthly**: monthly confirmation, likely-ended item confirmation, snapshot generation, automatic AI health report.
- **Insights**: asset, liability, and net-worth trends, structure analysis, debt ratio, monthly AI report history.
- **Settings**: model configuration, backup and restore, migration, launch protection, privacy.

## UX Direction

The chosen visual direction is **family status home screen**:

- Warm and household-oriented, not a cold bank dashboard.
- Calm wording that tells the user whether the household asset state is stable.
- Avoids anxiety-heavy language while still surfacing debt pressure and liquidity risk.
- Optimized for Android phone use.

Main interaction model:

- Daily changes: AI quick entry creates editable drafts.
- Monthly maintenance: monthly confirmation page lists likely-changing items.
- Detailed form entry remains available as a fallback.

## Data Model

Core entities:

- `LedgerItem`: unified asset/liability record.
- `ValuationHistory`: amount or balance history for a ledger item.
- `MonthlySnapshot`: monthly household asset snapshot.
- `AiReport`: AI health report bound to a monthly snapshot.
- `DraftItem`: AI or migration-generated draft before confirmation.
- `AppSettings`: model, privacy, backup, and launch protection settings.

Amounts remain in **万元** to match current usage and reduce entry friction.

### Categories

Top-level categories:

- Cash and Accounts.
- Investments.
- Insurance and Pensions.
- Property and Real Estate.
- Vehicles and High-Value Goods.
- Liabilities and Loans.

The v1 backup maps initially as:

- Stocks and funds -> Investments.
- Insurance and personal pension -> Insurance and Pensions.
- Residence and parking space -> Property and Real Estate.
- Personal car -> Vehicles and High-Value Goods.
- Wallet cash and reserve cash -> Cash and Accounts.
- Housing loan and provident-fund loan -> Liabilities and Loans.

### Ownership

Fixed ownership options:

- Me.
- Spouse.
- Joint.
- Child.
- Parents.
- Other.

No family-member management in v2 first release.

### Status

Record statuses:

- Active.
- Ended.
- Pending Confirmation.
- Draft.

Current statistics include only Active records. Ended records remain available for history. Draft and Pending Confirmation records do not affect current totals until confirmed.

Ending behavior:

- Items with an end month are not automatically ended.
- The Monthly page prompts the user to confirm likely-ended records.

### Type Templates

Templates stay intentionally light.

Cash and Accounts:

- Name, subtype, owner, balance, record month, institution/bank, note.

Investments:

- Name, subtype, owner, current market value, start month, platform/account, note.

Insurance and Pensions:

- Name, subtype, owner, current value, start month, note.

Property and Real Estate:

- Name, subtype, owner, current valuation, purchase month, note.

Vehicles and High-Value Goods:

- Name, subtype, owner, current valuation, purchase month, brand/model, note.

Liabilities and Loans:

- Required: type, current balance, start/end month, note.
- Optional: monthly payment, interest rate, repayment day, remaining periods.

Custom fields:

- v2 supports per-record custom key-value fields.
- Field types: text, number, date.
- Category-level custom templates are deferred.

## History And Snapshots

Each amount edit creates a valuation history entry. History is archived by default:

- Ledger list shows current value and last update time.
- Detail pages include a collapsed history section.
- Insights use valuation history and monthly snapshots for trends.

Monthly snapshots:

- Generated after monthly confirmation.
- Preserve household totals and category breakdowns.
- Bound to the monthly AI report.

## Monthly Confirmation

Monthly confirmation uses system-selected focus items:

- Cash, investments, and loan balances are prioritized.
- Ended or ending items are prompted for confirmation.
- Property, vehicles, parking spaces, and other stable assets default to unchanged.
- User can confirm all unchanged or edit only changed items.

After confirmation:

- Save `MonthlySnapshot`.
- Automatically generate an AI health report if AI is configured and enabled.
- If AI fails, keep the snapshot and allow report retry later.

Only monthly confirmation reminders are included in v2 first release.

## Insights

Insights must show:

- Asset trend.
- Liability trend.
- Net-worth trend.
- Category structure.
- Debt ratio.
- Liquidity safety indicators.
- Monthly AI health report history.

Family status scoring:

- Score is rule-based and explainable.
- AI only explains and summarizes; it does not decide the score.
- Primary score dimensions are debt pressure and liquidity safety.
- Asset structure and long-term protection are supporting dimensions.

## AI

AI model configuration is provider-flexible:

- Base URL.
- API Key.
- Model name.

Default preset can be MiniMax, but the app should not hard-code MiniMax-specific assumptions into UI or core logic. The first adapter should target OpenAI-style chat completions where possible, with provider-specific adaptation isolated.

Default settings show only Base URL, API Key, and model name. Advanced settings are collapsed:

- Request path or compatibility mode.
- Custom headers.
- Timeout and retry.
- Temperature and max output.
- Streaming toggle.
- Test connection.

AI privacy:

- Default payload is a sanitized summary.
- First use of each AI function explains the data sent.
- The user grants function-level permission.
- API Key is stored separately with safer local storage.

AI v2 functions:

- Batch natural-language entry.
- Old JSON migration mapping.
- Monthly asset health report.

AI entry behavior:

- AI generates draft records.
- Confirmation UI supports bulk confirm plus per-item editing.
- Low-confidence fields are highlighted.
- AI never auto-saves directly into active ledger records.

AI migration behavior:

- Rule-based mapping runs first.
- Low-confidence records go to Pending Confirmation.
- Confirmed records become Active.

AI report behavior:

- Report is layered: summary and score first, details on demand.
- Reports are saved monthly.
- Advice is household asset-management guidance only.
- No specific securities or fund buy/sell recommendations.
- Include a clear disclaimer.

## Security And Privacy

The v2 app removes account-login as the main flow.

Launch and privacy protection:

- App opens directly by default.
- Settings can enable PIN or biometric launch protection.
- Background mode hides amounts or blurs the screen.
- Global amount hiding remains available.

Model secret storage:

- API Key is stored separately and more securely than normal settings.
- Base URL and model name can use normal local settings storage.

## Migration And Backup

Migration:

- v2 shows a migration wizard.
- It supports the existing v1 JSON backup format.
- It creates a v1 backup before migration.
- It shows converted records and uncertain records.
- v1 JSON can be repeatedly imported and migrated.
- Migration writes to v2 local data only after confirmation.

Backup:

- Export remains readable JSON.
- Add `schemaVersion`.
- Future migrations use `schemaVersion` to upgrade data.
- Encrypted backup is deferred.

## Implementation Boundary

This is a one-pass v2 refactor, but it must preserve data safety:

- Do not keep old Home, Assets, Liabilities, and Stats pages as the primary app.
- Replace the old user/login mental model with launch protection.
- Keep v1 JSON migration repeatable.
- Keep AI-generated data in drafts or pending confirmation until user approval.
- Do not add cloud sync, attachments, or mini-program work in v2 first release.

## Acceptance Criteria

- The supplied v1 JSON can migrate into v2 categories and fields.
- Main app flow works through Home, Ledger, Monthly, Insights, and Settings.
- Monthly confirmation can generate a snapshot with minimal user edits.
- Monthly confirmation can automatically trigger an AI health report when AI is configured.
- Insights show asset, liability, and net-worth trends.
- Current statistics include only Active records.
- Ended, Draft, and Pending Confirmation records do not affect current totals.
- AI batch entry creates editable drafts and highlights uncertain fields.
- Model settings support Base URL, API Key, and model name.
- `npm run check` passes.
- Vitest tests pass.
- Android build path remains compatible with Capacitor.

## Known Codebase Notes

- Current source compiles with `npm run check`.
- Vitest tests pass with `npx vitest run`.
- Current `npm test` points to an old custom runner that imports missing `.js` files from TypeScript source. v2 should either switch `npm test` to Vitest or remove the stale runner.
- Current mobile build uses `.env.mobile` with `VITE_USE_API=false`; v2 first release should remain local-first.
- Current backend and Prisma code can be ignored for v2 first release unless needed for future sync.
