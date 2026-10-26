import type { CapacitorConfig } from '@capacitor/cli';

// Native (Android/iOS) app wrapper around the same web build. See MOBILE.md.
const config: CapacitorConfig = {
  // Permanent store identifier: change it before the first store release if you want a different one
  appId: 'io.github.kingtarkata.hearthstead',
  appName: 'Hearthstead',
  webDir: 'dist/directive-zero/browser',
  backgroundColor: '#f6f0e4',
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_hearthstead',
      iconColor: '#5b8a4b',
    },
  },
};

export default config;
