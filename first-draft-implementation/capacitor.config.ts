import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.towerdefense.firstdraft',
  appName: 'Tower Defense',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
