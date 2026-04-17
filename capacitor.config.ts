import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.servantra.app',
  appName: 'Servantra',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
