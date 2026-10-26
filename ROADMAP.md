# Directive Zero — Roadmap to Web + Phone App

Goal: a shared planner / self-help app for two people now, robust enough to publish later.

## Recommended stack

| Concern | Choice | Why |
| --- | --- | --- |
| UI framework | **Keep Angular** | Existing code is Angular 20; no rewrite needed. |
| Phone app | **Capacitor** | Wraps the same Angular build into real iOS/Android apps. One codebase for web, Android, iOS. Adds native APIs (notifications, haptics, share). |
| Accounts + sync | **Supabase** (or Firebase) | Login, a Postgres database, and row-level security so data stays private per household. The free tier is plenty for two users. Needed for you and your wife to see the same data across devices. |
| Offline | Local cache + sync queue | The app keeps working with no signal and syncs when it's back online. |

Alternative to consider: **Ionic Angular** components instead of Bootstrap give a more native phone look and feel (tab bars, swipe gestures, pull-to-refresh). This can be adopted gradually.

## Phases

### Phase 1 — Foundations (no visible change)
- [x] Centralize persistence in `StorageService` (done in cleanup)
- [ ] Make the data layer async (`Promise`/signals) so it can be backed by a server
- [ ] Add a schema `version` + migration step for stored data
- [ ] Link tasks to categories by **id** rather than name (allows renaming categories)
- [ ] Store status as stable codes (`todo`, `in_progress`…) rather than display text
- [ ] Move state to Angular signals; add routing (Board / Archive / Profile / Settings as pages instead of modals)

### Phase 2 — Phone app
- [ ] Add Capacitor (`@capacitor/core`, `android`, `ios`); iOS builds require a Mac
- [ ] Mobile navigation (bottom tab bar), swipe to change status, larger tap targets
- [ ] Local notifications for due dates
- [ ] App icons / splash screens

### Phase 3 — Shared accounts
- [ ] Supabase auth (email magic link or Google/Apple sign-in)
- [ ] "Household" model: shared lists plus personal lists, assignee per task
- [ ] Sync with conflict handling; existing localStorage data migrated on first sign-in

### Phase 4 — Planner / self-help features (pick and choose)
- Recurring tasks and habits with streaks
- Calendar / week view
- Goals that break down into tasks
- Daily journal / mood check-in, gratitude log
- Shared grocery / shopping lists
- Couple stats and shared XP rewards

### Before publishing publicly
- Privacy policy, account deletion, data export (already have export)
- Error reporting (e.g. Sentry), analytics opt-in
- Accessibility pass, E2E tests (Playwright), CI build
- App Store / Play Store developer accounts
