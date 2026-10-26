import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
  isDevMode,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { Capacitor } from '@capacitor/core';

import { routes } from './app.routes';
import { DATA_REPOSITORY } from './data/data-repository';
import { LocalRepository } from './data/local-repository';
import { PlannerStore } from './services/planner-store';
import { SyncService } from './services/sync';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    // Offline caching for the web app only; the native app ships its files inside the APK/IPA
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode() && !Capacitor.isNativePlatform(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
    // Data lives on this device for now; a synced repository can replace this later
    { provide: DATA_REPOSITORY, useExisting: LocalRepository },
    provideAppInitializer(async () => {
      const store = inject(PlannerStore);
      const sync = inject(SyncService);
      await store.init();
      await sync.init(); // reconnects to a shared household if signed in before
    }),
  ],
};
