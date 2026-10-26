# Hearthstead — Roadmap

Goal: a shared planner / self-help app for two people now, robust enough to publish later.

## Stack

| Concern | Choice |
| --- | --- |
| UI | Angular 20 (signals), Bootstrap 5, custom cozy theme |
| Phones | PWA now; Capacitor native apps (Android project builds on Windows; iOS via cloud Mac) |
| Accounts + sync | Firebase Auth + Firestore (offline cache), lazy-loaded |
| Hosting | Firebase Hosting |

## Done

- [x] Cleanup pass, tests, light/dark themes, offline fonts
- [x] Rebrand to Hearthstead; all wording in `src/app/terminology.ts`
- [x] Cozy UI redesign; phone tab bar; bottom-sheet dialogs; app icons
- [x] Versioned data model with migration from Directive Zero; plots linked by id; signals store
- [x] Repeating chores (daily/weekly/monthly) and habits with streaks + XP bonus
- [x] Week view with today, overdue, undated, and previews of upcoming repeats
- [x] Reminders: in-app + web notifications; native OS-scheduled reminders (fire when closed)
- [x] Firebase sign-in, households, invite codes, live sync, security rules + tests
- [x] Assign chores, member filter, per-person XP and household leaderboard
- [x] Capacitor Android + iOS projects, icons, splash screens; Android build verified on emulator

## Next (needs you)

- [ ] Create the Firebase project and deploy ([FIREBASE_SETUP.md](FIREBASE_SETUP.md))
- [ ] Install the PWA on both phones and start a household

## Next (code)

- [ ] Native Google sign-in (`@capacitor-firebase/authentication`)
- [ ] Cloud iOS builds (Codemagic or GitHub Actions) → TestFlight ([MOBILE.md](MOBILE.md))
- [ ] Push reminders for the PWA when closed (Cloud Functions + FCM; needs Blaze plan)
- [ ] Undo for delete/harvest; drag-and-drop between columns
- [ ] Goals that break down into chores; journal / mood check-in; shopping lists
- [ ] Shared vs. personal plots; privacy for personal chores
- [ ] Account deletion + data export from the server (needed before publishing)

## Before publishing publicly

- Privacy policy, account deletion, terms
- Error reporting (e.g. Sentry) and opt-in analytics
- Accessibility pass, E2E tests (Playwright), CI build
- Store listings, screenshots, release signing keys
