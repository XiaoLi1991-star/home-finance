# Family Finance Android v2 Roadmap

## Milestone 01: Android v2 Cutover

Goal: Replace the v1 asset/liability app surface with the confirmed v2 Android-first ledger, monthly, insights, settings, migration, and AI workflows.

This is one v2 release, executed in waves to reduce risk.

### Wave 1: Data Foundation And Migration

Must make true:

- v2 ledger types exist.
- v2 local persistence exists.
- v1 backup data can be migrated to v2 records.
- statistics and trends can be computed from v2 data.
- stale `npm test` behavior is addressed or documented.

Plans:

- Plan 01: Domain model, categories, storage, and migration.
- Plan 02: Finance calculations, snapshots, and history.
- Plan 03: Backup format and test baseline.

### Wave 2: App Shell And Core Ledger UX

Must make true:

- The app boots into v2 navigation.
- Home, Ledger, Monthly, Insights, and Settings routes exist.
- Ledger records can be created, edited, confirmed, ended, and viewed with history.
- Monthly confirmation can generate snapshots.

Plans:

- Plan 04: v2 app shell, bottom navigation, shared UI primitives.
- Plan 05: ledger list, detail, editor, and draft confirmation.
- Plan 06: monthly confirmation and home status.

### Wave 3: Insights, Settings, And AI

Must make true:

- Insights show asset/liability/net-worth trends and structure.
- Settings support model configuration, privacy, backup, restore, and migration.
- AI entry, migration assist, and monthly health reports work behind explicit confirmation.

Plans:

- Plan 07: insights and settings.
- Plan 08: model client, privacy summaries, and AI report pipeline.
- Plan 09: AI entry and migration review UX.

### Wave 4: Android Hardening And Release Verification

Must make true:

- Launch protection and privacy behaviors work.
- API Key storage is separated from normal settings.
- Monthly confirmation reminder is implemented or explicitly deferred with a documented reason.
- Android build path remains valid.

Plans:

- Plan 10: Android privacy, secrets, and reminders.
- Plan 11: integration verification, mobile polish, and cleanup.

## Deferred Milestones

### Milestone 02: Optional Cloud Backup And Sync

Not part of v2 first release.

Potential future work:

- encrypted cloud backup.
- multi-device sync.
- backend account model.

### Milestone 03: Attachments And Rich Records

Not part of v2 first release.

Potential future work:

- local image/PDF attachments.
- category-level custom field templates.
- richer per-item charts.

