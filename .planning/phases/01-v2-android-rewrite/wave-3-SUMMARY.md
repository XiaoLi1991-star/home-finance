# Wave 3 Summary: Insights, Settings, And AI

## Completed

- Added a separate settings store for model, privacy, AI authorization, and monthly report preferences.
- Added local API Key storage outside the normal ledger backup payload.
- Updated default OpenAI-compatible model settings for MiniMax:
  - Base URL: `https://api.minimaxi.com/v1`
  - Model options: `MiniMax-M2.7`, `MiniMax-M2.7-highspeed`
- Added Settings UI for Base URL, Model ID, API Key, connection test, advanced request path, temperature, max tokens, custom headers, privacy toggles, and backup/migration entry.
- Added v2 JSON export.
- Added v1/v2 import and migration wizard.
- Added a shared draft review pool for AI entry and v1 migration output.
- Kept AI-created records as Draft until user confirmation.
- Kept v1 low-confidence or likely-ended records as Pending Confirmation so they stay out of current totals.
- Added provider-flexible OpenAI-style chat client with reasoning-block stripping for MiniMax-style output.
- Added privacy summary generation that omits raw ledger item names and notes.
- Added AI natural-language entry flow.
- Added monthly AI report generation after snapshot creation when enabled.
- Added AI report history rendering in Insights.
- Added trend chart and category structure view in Insights.

## Verification

- `npm run check` passed.
- `npm test` passed with 8 files and 12 tests.
- `npm run build:mobile` passed.
- Browser route check passed for Settings, AI Entry, Migration, Draft Review, and Insights on a 390px mobile viewport.
- Supplied v1 backup verification passed:
  - assets read: 10
  - liabilities read: 4
  - items created: 14
  - active records: 7
  - pending confirmation records: 7
- MiniMax OpenAI-compatible smoke test passed against `https://api.minimaxi.com/v1/chat/completions` with `MiniMax-M2.7-highspeed`.

## Notes

- API Key is not committed and is not included in v2 JSON backups.
- Current local API Key storage is separated from settings but still uses web local storage until Wave 4 Android secure-storage hardening.
- AI failure does not block monthly snapshot creation; a failed report record is stored instead.

## Next

Continue with Wave 4:

- Add Android-specific secure key storage or a documented native fallback.
- Add launch protection and background privacy behavior.
- Add reminder/hardening work.
- Run full release verification and Android sync/build-path checks.
