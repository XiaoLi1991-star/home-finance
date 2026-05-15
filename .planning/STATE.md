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

Wave 4 Android hardening and release verification are complete in the clean subproject.

Completed summaries:

- `.planning/phases/01-v2-android-rewrite/wave-1-SUMMARY.md`
- `.planning/phases/01-v2-android-rewrite/wave-2-SUMMARY.md`
- `.planning/phases/01-v2-android-rewrite/wave-3-SUMMARY.md`
- `.planning/phases/01-v2-android-rewrite/wave-4-SUMMARY.md`

Latest verification:

- `npm run check` passed.
- `npm test` passed.
- `npm run build:mobile` passed.
- Browser check passed on `http://127.0.0.1:59615/` with a 390px mobile viewport.
- Supplied v1 backup migrated to 14 items: 7 active and 7 pending confirmation.
- MiniMax OpenAI-compatible smoke test passed.
- Android project was added and synced.
- Debug APK build passed with Android Studio JBR Java 21 and local Android SDK.

Next:

- Review the Android build locally in Android Studio or on a device.
- Decide whether to add native secure storage and local notifications before personal release.
