# Setting up Firebase (sync + hosting)

Hearthstead works fully on one device without any of this. Firebase adds:

- **Accounts** (Google or email) and **households**, so both of your phones share the same chores
- **Hosting**, so you can open the app at a real web address and install it on your phones

Everything below fits in Firebase's free **Spark** plan. Takes about 15 minutes.

## 1. Create the project

1. Go to <https://console.firebase.google.com> and click **Create a project**. Name it e.g. `hearthstead`.
   Google Analytics is optional; you can turn it off.
2. **Build → Authentication → Get started**, then on **Sign-in method** enable:
   - **Email/Password**
   - **Google** (pick your email as the support email)
3. **Build → Firestore Database → Create database**. Choose a location near you and start in
   **production mode** (our `firestore.rules` file secures it when we deploy).
4. **Project settings (gear icon) → General → Your apps → Web (`</>`)**. Register an app called
   `Hearthstead`, tick **Also set up Firebase Hosting**, and copy the `firebaseConfig` object it shows.

## 2. Connect the app

1. Paste the values into [`src/app/firebase/firebase-config.ts`](src/app/firebase/firebase-config.ts),
   replacing the `demo-...` placeholders.
2. **For Google sign-in on iPhone**, change `authDomain` from `<project>.firebaseapp.com` to
   `<project>.web.app` (the address the app will be hosted at). Safari blocks sign-in otherwise.
   Then in the [Google Cloud console](https://console.cloud.google.com/apis/credentials) for the same
   project, open the **Web client (auto created by Google Service)** OAuth client and add
   `https://<project>.web.app/__/auth/handler` under **Authorized redirect URIs**.
3. Put your project ID in [`.firebaserc`](.firebaserc) in place of `demo-hearthstead`.

## 3. Deploy

```bash
npx firebase login
npm run deploy
```

This builds the app and publishes it plus the security rules. Your app is now at
`https://<project>.web.app`.

## 4. Install on your phones

- **iPhone:** open the address in **Safari** → **Share** → **Add to Home Screen**. Open Hearthstead from
  the new icon (needed for notifications on iPhone).
- **Android:** open it in **Chrome** → menu → **Install app**.

Then on each phone: **Settings → Household → sign in**. One of you taps **Create** (your current chores
move into the household); the other enters the 6-letter invite code shown there and taps **Join**.

## Developing locally

Without a real project configured (the `demo-hearthstead` placeholder), the app talks to the local
Firebase emulators when run on `localhost`:

```bash
npm run emulators   # in one terminal (needs Java 21+)
npm start           # in another
```

Emulator accounts and data are throwaway. Once you paste a real config, `npm start` uses the real project.

Other useful commands:

```bash
npm run test:rules   # security rules tests (starts the Firestore emulator automatically)
```

## Later: reminders when the app is closed

Reminders currently fire while the app is open or running in the background. Push reminders when it's
fully closed need a small server function, which requires the pay-as-you-go **Blaze** plan (free at this
usage, but a card on file). The native app (Capacitor) can instead schedule reminders on the phone
itself with no server.
