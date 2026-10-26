# Hearthstead

A cozy, gamified homestead planner for a household. Plant chores, tend them while they grow, and
harvest them for XP.

- **Board** (Planted → Growing → Ready to Harvest) and **Week** views, plus a Harvest Log
- **Repeating chores** and **habits** with streaks; steps (checklists); plots (categories)
- **Reminders**: in-app and system notifications (native app: fire even when closed)
- **Households**: sign in, share chores live between phones, assign chores, per-person XP and leaderboard
- Works **offline**; installable as a PWA; native Android/iOS via Capacitor
- Light and dark themes; backup/restore to JSON

Built with Angular 20 (signals) + Bootstrap 5, Firebase (Auth, Firestore, Hosting), and Capacitor.

## Guides

- [FIREBASE_SETUP.md](FIREBASE_SETUP.md) — create the Firebase project, deploy, install on phones
- [MOBILE.md](MOBILE.md) — PWA vs. native, Android builds, iOS without a Mac
- [ROADMAP.md](ROADMAP.md) — what's done and what's next

## Development

```bash
npm install
npm start              # http://localhost:4200
npm run emulators      # local Firebase (auth + Firestore) for testing sync; needs Java 21+
npm test               # unit tests (Karma). Without Chrome, set CHROME_BIN to Edge's msedge.exe
npm run test:rules     # Firestore security rules tests
npm run build          # production build -> dist/directive-zero/browser
npm run deploy         # build + deploy to Firebase Hosting (after FIREBASE_SETUP.md)
npm run android:build  # debug APK (see MOBILE.md)
```

## Project layout

- `src/app/terminology.ts` — every user-facing word, level titles, default plots and theme icons
- `src/app/models` — `Task`, `Category`, `Member`, versioned `AppData` + migration, recurrence rules
- `src/app/data` — `DataRepository` interface and the on-device implementation
- `src/app/firebase` — Firebase config and the lazy-loaded runtime (auth, households, Firestore repository)
- `src/app/services` — `PlannerStore` (signals), sync, reminders, gamification, theme, UI state
- `src/app/components` — header, board, task card, week view, modals, settings/account, profile, bottom nav
- `firestore.rules`, `firebase/rules.test.mjs` — security rules and their tests
- `android/`, `ios/`, `capacitor.config.ts`, `assets/` — native apps

The app was formerly "Directive Zero"; existing data from it is migrated automatically on first launch.
