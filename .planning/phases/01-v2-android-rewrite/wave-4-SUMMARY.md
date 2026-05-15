# Wave 4 Summary: Android Hardening And Release Verification

## Completed

- Added Capacitor Android project under `android/`.
- Synced web assets and Capacitor plugins into Android.
- Added launch PIN protection with salted SHA-256 local hash.
- Added background privacy cover for app pause/resume and document visibility changes.
- Added Android build guide with the verified local JDK/SDK setup.
- Documented API Key storage scope and secure-storage follow-up.
- Documented monthly reminder deferral pending a local notifications plugin.

## Verification

- `npm run check` passed.
- `npm test` passed with 8 files and 12 tests.
- `npm run build:mobile` passed.
- `npx cap add android` passed.
- `npx cap sync android` passed.
- `.\gradlew.bat assembleDebug` passed when using Android Studio JBR Java 21 and the local Android SDK.

## Environment Findings

- System Java is Java 25 and fails Gradle with `Unsupported class file major version 69`.
- Android Studio JBR Java 21 works.
- Android SDK is available at `C:\Users\zhujianhua\AppData\Local\Android\Sdk`.

## Remaining Follow-Ups

- Replace local API Key fallback with a validated Android secure-storage plugin before broader distribution.
- Add `@capacitor/local-notifications` and implement monthly reminders after permission UX is designed.
- Replace default Capacitor icons/splash assets with final branded Android assets.
