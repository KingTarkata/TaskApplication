import { Capacitor } from '@capacitor/core';

// Firebase web app settings. These values are not secret (they identify the project; access is
// controlled by firestore.rules), so they're safe to commit.
//
// Only the config values belong here: Firebase itself is started in firebase-runtime.ts, and only
// once someone uses sync. Don't paste the console's initializeApp/getAnalytics lines into this file.
export const firebaseConfig = {
  apiKey: 'AIzaSyAul9bDKoKwXcAHlAqScviCyeIxKFwVTDU',
  // The hosting domain (not firebaseapp.com) so Google sign-in works in iPhone Safari; see FIREBASE_SETUP.md
  authDomain: 'taskmanagerapp-4bd42.web.app',
  projectId: 'taskmanagerapp-4bd42',
  storageBucket: 'taskmanagerapp-4bd42.firebasestorage.app',
  messagingSenderId: '34135650365',
  appId: '1:34135650365:web:5d7753f036f3629765ba54',
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
