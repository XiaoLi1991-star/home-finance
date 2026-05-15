import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.family.finance.v2',
  appName: 'FamilyFinanceV2',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
}

export default config

