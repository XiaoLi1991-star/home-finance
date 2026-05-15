# Family Finance Android v2 Requirements

## Functional Requirements

### R1. Android-First Navigation

The primary app navigation must be:

- Home.
- Ledger.
- Monthly.
- Insights.
- Settings.

Old Home, Assets, Liabilities, and Stats pages must not remain the primary app surface after v2 cutover.

### R2. Unified Ledger Model

The app must store assets and liabilities as v2 ledger records with:

- Kind: asset or liability.
- Category and subtype.
- Name.
- Owner.
- Current amount.
- Start month.
- Optional end month.
- Note.
- Status.
- Template fields.
- Custom key-value fields.

### R3. Categories

The v2 categories must include:

- Cash and Accounts.
- Investments.
- Insurance and Pensions.
- Property and Real Estate.
- Vehicles and High-Value Goods.
- Liabilities and Loans.

### R4. Status-Based Statistics

Current totals and dashboard statistics must include Active records only.

Ended, Pending Confirmation, and Draft records must remain available for review/history but not affect current totals.

### R5. Valuation History

Each amount edit must create a valuation history record.

History must be archived by default:

- Main lists show current amount and recent update only.
- Detail pages include a collapsed history section.
- Insights can use history for trend data.

### R6. Monthly Confirmation

The Monthly page must:

- Prioritize cash, investment, and liability balance confirmation.
- Treat property, vehicles, and other stable assets as unchanged by default.
- Prompt likely-ended records for user confirmation.
- Generate a monthly snapshot after confirmation.
- Trigger AI health report generation after confirmation when AI is configured and enabled.

### R7. Insights

The Insights page must show:

- Asset trend.
- Liability trend.
- Net-worth trend.
- Category structure.
- Debt ratio.
- Liquidity safety indicators.
- Monthly AI report history.

### R8. Home Status

The Home page must use a warm family-status direction.

The score must be rule-based and explainable. AI may explain the result but must not decide the score.

Primary score dimensions:

- Debt pressure.
- Liquidity safety.

Secondary dimensions:

- Asset structure.
- Long-term protection.

### R9. AI Configuration

Settings must support a provider-flexible model configuration:

- Base URL.
- API Key.
- Model name.

Advanced settings should be collapsed:

- Request path or compatibility mode.
- Custom headers.
- Timeout/retry.
- Temperature/max output.
- Streaming toggle.
- Test connection.

### R10. AI Workflows

AI first release workflows:

- Batch natural-language entry into draft records.
- v1 JSON migration mapping with low-confidence items marked for confirmation.
- Monthly health reports bound to monthly snapshots.

AI must not auto-save Active records without user confirmation.

### R11. Privacy And Launch Protection

The v2 app removes account login as the main mental model.

The app must support:

- Direct launch by default.
- Optional launch protection.
- Global amount hiding.
- Background amount hiding or blur.
- Separate safer storage path for API Key.

### R12. Migration

The app must provide a migration wizard for v1 JSON backups.

Migration must:

- Create a v1 backup before writing v2 data.
- Show converted and uncertain records.
- Allow repeated import/migration of v1 JSON.
- Write v2 records only after confirmation.

### R13. Backup

Backup must remain JSON and include `schemaVersion`.

Encrypted backup is deferred.

## Non-Functional Requirements

- Android-first responsive layout.
- Local-first operation.
- No cloud dependency for v2 first release.
- AI failure must not block ledger, monthly snapshot, or backup flows.
- Main flows must remain usable without AI configured.
- Keep forms light and avoid requiring unnecessary fields.

## Verification Requirements

Required checks before completion:

- `npm run check`.
- `npx vitest run`.
- v1 JSON migration test using `finance_backup_2026-05-15.json`.
- Manual browser verification of primary pages through mobile-sized viewport.
- Capacitor mobile build path verification.

