# Family Finance Android v2 Project

## Mission

Upgrade the existing household asset app into an Android-first v2 release that combines:

- A reliable household asset ledger.
- A warm family financial status home screen.
- Low-effort monthly confirmation.
- Asset, liability, and net-worth insights.
- AI-assisted entry, migration, and monthly health reports.

The confirmed design spec is:

@docs/superpowers/specs/2026-05-15-family-finance-v2-design.md

## Current Codebase

This Android v2 project lives in the clean subproject path `family-finance-android-v2/`.

It is a React + TypeScript + Vite project packaged for Android through Capacitor. The legacy workspace root remains only as historical/reference material and is intentionally not part of this clean Android v2 repository.

Key current paths:

- `src/App.tsx`: temporary v2 shell while Wave 1 data work is underway.
- `src/types/ledger.ts`: v2 domain types.
- `src/lib/v2/*`: v2 category, migration, calculation, history, snapshot, scoring, backup, and storage helpers.
- `src/store/useLedgerStore.ts`: v2 local ledger store.
- `capacitor.config.ts`: Android packaging config.

Current technical baseline:

- `npm run check` passes.
- `npm test` runs Vitest and passes.
- This subproject is the Git repository for Android v2.

## Product Decisions

- Primary target: Android app only.
- Web remains a development/debugging surface.
- No cloud sync in v2 first release.
- No attachment/document feature in v2 first release.
- No full login/user-account system in v2 first release.
- Keep amounts in "ten-thousand yuan" units to match existing data entry habits.
- Use fixed owner options: Me, Spouse, Joint, Child, Parents, Other.
- Use record statuses: Active, Ended, Pending Confirmation, Draft.
- Current statistics include Active records only.
- Ended, Pending Confirmation, and Draft records remain out of current totals.
- Monthly confirmation prompts likely-ended records instead of auto-ending them.
- AI-generated records are drafts until confirmed.

## First Release Definition

The v2 release is accepted when:

- The supplied v1 JSON backup migrates into v2 categories and fields.
- Home, Ledger, Monthly, Insights, and Settings support the main Android flow.
- Monthly confirmation can generate snapshots with minimal edits.
- Monthly confirmation can trigger an AI health report when AI is configured.
- Insights show asset, liability, and net-worth trends.
- Tests and TypeScript checks pass.
- Capacitor Android build path remains intact.

