# Family Finance Android v2 State

Last updated: 2026-05-15

## Current Status

Discovery and design are complete.

Confirmed design:

@docs/superpowers/specs/2026-05-15-family-finance-v2-design.md

Planning artifacts created:

- `.planning/PROJECT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
- `.planning/STATE.md`
- `.planning/phases/01-v2-android-rewrite/phase-plan.md`

Execution pivot:

- User requested a clean subproject because the legacy root contains many non-Android files.
- Android v2 now lives under `family-finance-android-v2/`.
- The temporary root-level Git init and temporary root-level v2 files were removed.

## User Decisions

- Build Android-first v2.
- Use one v2 cutover rather than staged user-facing release.
- Use Home / Ledger / Monthly / Insights / Settings.
- Use family-status home screen direction.
- Use local-first storage for first release.
- Keep amount unit as ten-thousand yuan.
- Use status-driven statistics.
- Use fixed owner options.
- Use monthly confirmation, not automatic ending.
- Generate AI monthly report after monthly confirmation.
- Store AI model config locally with Base URL, API Key, and model name.
- Make AI provider-flexible.
- Use v1 JSON migration wizard.

## Technical Notes

- Current subproject compiles with `npm run check`.
- Current subproject test suite passes with `npm test`.
- Current subproject is intended to be the Git repository.
- Android app should remain local-first for v2.

## Current Position

Wave 1 data foundation is complete in the clean subproject.

Completed summary:

`.planning/phases/01-v2-android-rewrite/wave-1-SUMMARY.md`

Next start from Wave 2 in:

`.planning/phases/01-v2-android-rewrite/phase-plan.md`
