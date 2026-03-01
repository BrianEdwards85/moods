type AppVariant = 'local' | 'dev' | 'release';

const variant: AppVariant = (process.env.EXPO_PUBLIC_APP_VARIANT as AppVariant) || 'dev';

const config = {
  local: {
    apiUrl: 'http://192.168.129.136:8000/graphql',
    enableDevtools: true,
  },
  dev: {
    apiUrl: 'https://moods-dev.hosaka.io/graphql',
    enableDevtools: true,
  },
  release: {
    apiUrl: 'https://moods.hosaka.io/graphql',
    enableDevtools: false,
  },
} as const;

export const appConfig = config[variant];
