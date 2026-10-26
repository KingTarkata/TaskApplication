import { Capacitor } from '@capacitor/core';

// Firebase web app settings. These values are not secret (they identify the project; access is
// controlled by firestore.rules), so they're safe to commit.
//
// To connect a real project: Firebase console -> Project settings -> Your apps -> Web app -> SDK setup,
// and paste the config object here (see FIREBASE_SETUP.md).
export const firebaseConfig = {
  apiKey: 'demo-api-key',
  authDomain: 'demo-hearthstead.firebaseapp.com',
  projectId: 'demo-hearthstead',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
};

// The native app also serves from "localhost", but can't reach emulators on this computer
const isLocalhost =
  typeof location !== 'undefined' &&
  ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname) &&
  !Capacitor.isNativePlatform();

/** "demo-" projects only exist in the local emulators (npm run emulators). */
export const useEmulators = firebaseConfig.projectId.startsWith('demo-');

/** Sync is offered with a real project, or with the emulators while developing on this machine. */
export const firebaseEnabled = !!firebaseConfig.projectId && (!useEmulators || isLocalhost);

export const EMULATOR_HOST = '127.0.0.1';
export const EMULATOR_PORTS = { auth: 9099, firestore: 8080 };
