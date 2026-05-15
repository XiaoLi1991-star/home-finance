# Wave 2 Summary: App Shell And Core Ledger UX

## Completed

- Replaced the Wave 1 placeholder app with the v2 HashRouter shell.
- Added primary Android navigation for Home, Ledger, Monthly, Insights, and Settings.
- Added detail/edit routes for ledger records.
- Added Android back-button handling for primary routes and secondary screens.
- Added shared UI primitives: bottom navigation, page header, card, button, and input styling.
- Built the Home family-status screen using active-only totals and rule-based scoring.
- Built Ledger list with search, kind filters, category filters, empty states, and status labels.
- Built Ledger detail with edit, confirm, end, and collapsed valuation history.
- Built Ledger editor for create/edit flows with owner, status, category, subtype, date, amount, and template fields.
- Built Monthly confirmation with priority records, likely-ended prompts, and snapshot generation.
- Built first Insights and Settings surfaces for current totals, trend placeholders, model config, backup, and migration.
- Localized user-facing category, subtype, owner, status, and family score labels to Chinese.

## Verification

- `npm run check` passed.
- `npm test` passed with 4 files and 8 tests.
- `npm run build:mobile` passed.
- Browser verification passed on `http://127.0.0.1:59615/` with a 390px mobile viewport:
  - Home rendered the v2 family-status screen.
  - Ledger, Ledger editor, Monthly, Insights, and Settings routes rendered.
  - Bottom navigation appeared on the five primary pages.
  - The editor page rendered without visible overlap in the mobile viewport.

## Notes

- Wave 2 keeps AI, migration wizard, and backup/restore wiring as Wave 3 work.
- Settings currently shows the intended model/backup/migration entry surfaces but does not persist model settings yet.
- The browser dev server was used only for verification.

## Next

Continue with Wave 3:

- Wire Insights trend charts and richer structure views.
- Add Settings persistence for Base URL, API Key, model name, privacy, backup, restore, and migration.
- Add provider-flexible AI client and draft-first AI entry/report flows.
