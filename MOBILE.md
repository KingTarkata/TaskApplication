# Hearthstead on phones

There are two ways onto a phone. Both use the same code.

| | Installed web app (PWA) | Native app (Capacitor) |
|---|---|---|
| Cost | Free | Android: free to sideload, $25 one-time for Google Play. iOS: $99/year Apple Developer |
| Needs a Mac | No | Android: no. iOS: yes, but a cloud build service can be the Mac |
| Updates | Instant on next open | Rebuild + reinstall (or store review) |
| Reminders when closed | No (needs a push server) | Yes, scheduled on the phone |
| Google sign-in | Yes | Not yet (email works; see below) |

**Recommended now:** use the PWA (see [FIREBASE_SETUP.md](FIREBASE_SETUP.md) to host it). Move to native when
you want reminders that fire with the app closed, or to publish in the stores.

## Native project layout

- `capacitor.config.ts` – app id `io.github.kingtarkata.hearthstead`, name, plugins
- `android/` – Android Studio project (committed; Capacitor regenerates the web part on sync)
- `ios/` – Xcode project using Swift Package Manager (committed)
- `assets/` – source images for icons and splash screens

After changing web code, copy it into the native projects:

```bash
npm run cap:sync
```

To regenerate icons/splash screens after changing `assets/`:

```bash
npx @capacitor/assets generate --android --ios
```

## Android (works on this Windows PC)

Requirements: Android SDK (already installed at `%LOCALAPPDATA%\Android\Sdk`) and JDK 21
(`C:\Program Files\Android\openjdk\jdk-21.0.8`). Android Studio is optional but handy.

Build a debug APK from the command line:

```bash
npm run android:build
```

The APK lands in `android/app/build/outputs/apk/debug/app-debug.apk`. To put it on a phone, enable
**Developer options → USB debugging**, plug the phone in, and run:

```bash
"%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe" install -r android\app\build\outputs\apk\debug\app-debug.apk
```

Or copy the APK to the phone and open it (allow "Install unknown apps" for your file manager).

For the Play Store you'll need a signed release bundle (`./gradlew bundleRelease` with a signing key)
and a Google Play developer account.

## iOS without a Mac

Apple only builds iOS apps on macOS, but a cloud service can provide the Mac:

1. Join the **Apple Developer Program** ($99/year) – required to install on real iPhones beyond 7 days
   and for TestFlight / App Store.
2. Sign up for **Codemagic** (free tier includes macOS build minutes) and connect the GitHub repo.
3. Use the *Capacitor* workflow template: it runs `npm ci && npm run build && npx cap sync ios`, then builds
   `ios/App/App.xcodeproj`. Let Codemagic manage signing with an App Store Connect API key.
4. Have it publish to **TestFlight**; install the TestFlight app on both iPhones to get builds.

GitHub Actions (`macos-latest` runner) is an alternative; macOS minutes on private repos count 10×.

Running macOS in a virtual machine on a PC is technically possible but against Apple's license,
slow, and fragile, so it isn't recommended.

## Known gaps / next steps for native

- **Google sign-in in the native app** needs the `@capacitor-firebase/authentication` plugin (Google
  blocks sign-in inside embedded web views). Email/password works today.
- **Android 13+** asks for notification permission the first time reminders are turned on.
  Exact-time reminders use the `SCHEDULE_EXACT_ALARM` permission.
- Before publishing: privacy policy, store screenshots, and a release signing key.
