import { ExpoConfig, ConfigContext } from 'expo/config';

const APP_VARIANT = process.env.EXPO_PUBLIC_APP_VARIANT ?? 'dev';

const variantConfig = {
  local: {
    nameSuffix: ' (Local)',
    packageSuffix: '.local',
    usesCleartextTraffic: true,
  },
  dev: {
    nameSuffix: ' (Dev)',
    packageSuffix: '.dev',
    usesCleartextTraffic: false,
  },
  release: {
    nameSuffix: '',
    packageSuffix: '',
    usesCleartextTraffic: false,
  },
};

const vc = variantConfig[APP_VARIANT as keyof typeof variantConfig] ?? variantConfig.dev;

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: `Moods${vc.nameSuffix}`,
  slug: 'moods',
  version: '2.2.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'moods',
  userInterfaceStyle: 'dark',
  newArchEnabled: true,
  splash: {
    image: './assets/images/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#1f2335',
  },
  android: {
    package: `com.moods.app${vc.packageSuffix}`,
    ...(vc.usesCleartextTraffic && { usesCleartextTraffic: true }),
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#1f2335',
    },
    edgeToEdgeEnabled: true,
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    [
      'expo-notifications',
      {
        icon: './assets/images/icon.png',
        color: '#7aa2f7',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  ios: {
    bundleIdentifier: `com.moods.app${vc.packageSuffix}`,
  },
});
