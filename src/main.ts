import { Capacitor } from '@capacitor/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// The native app updates through the store/APK; remove any service worker an older build installed,
// or it would keep serving that older version
if (Capacitor.isNativePlatform() && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister()));
}

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
