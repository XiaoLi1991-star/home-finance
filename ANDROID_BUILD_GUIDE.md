# Android Build Guide

## Verified Commands

From `family-finance-android-v2/`:

```powershell
npm run check
npm test
npm run build:mobile
npx cap sync android
```

Debug APK build was verified from `family-finance-android-v2/android/` with Android Studio JBR and the local Android SDK:

```powershell
$env:JAVA_HOME='C:\Program Files\Android\Android Studio\jbr'
$env:ANDROID_HOME='C:\Users\zhujianhua\AppData\Local\Android\Sdk'
$env:ANDROID_SDK_ROOT=$env:ANDROID_HOME
$env:Path="$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:Path"
.\gradlew.bat assembleDebug
```

Output:

- `BUILD SUCCESSFUL`
- Debug APK path: `android/app/build/outputs/apk/debug/app-debug.apk`

## Local Environment Notes

- System Java is currently Java 25. Gradle 8.11.1 fails with `Unsupported class file major version 69` under Java 25.
- Android Studio JBR is Java 21 and works for this project.
- Android SDK was found at `C:\Users\zhujianhua\AppData\Local\Android\Sdk`.
- `android/local.properties` is intentionally not committed.

## Current Native Privacy Scope

- API Key is stored separately from normal settings and is not included in JSON backup export.
- Current storage is a local fallback. A hardware-backed secure storage plugin is still a good follow-up before distributing outside personal use.
- Launch protection uses a salted SHA-256 PIN hash stored locally.
- Background privacy cover is enabled through app pause/resume and document visibility events.

## Deferred Native Reminder

Monthly reminders are deferred because the project has not added a local notifications plugin yet. Add and validate `@capacitor/local-notifications` before enabling reminder permissions in Android.
