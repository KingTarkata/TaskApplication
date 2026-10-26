# Directive Zero

A gamified task board (To Do → In Progress → Completed → Archive) with subtasks, categories, XP/levels,
light/dark themes, JSON backup/restore, and offline support as an installable PWA.

Built with Angular 20 + Bootstrap 5. Data is stored locally in the browser (`localStorage`) via
`src/app/services/storage.ts`.

See [ROADMAP.md](ROADMAP.md) for the plan to turn this into a shared web + phone app.

## Development

```bash
npm install
npm start          # http://localhost:4200
npm run build      # production build (includes service worker) -> dist/
npm test           # unit tests (Karma). Without Chrome, set CHROME_BIN to Edge's msedge.exe
```

## Project layout

- `src/app/models` — `Task`, `SubTask`, `Category` types
- `src/app/services` — task, category, gamification (XP), theme, and storage services
- `src/app/components` — header, board, task card, modals (add/edit, archive), profile, settings, footer
