type AppVariant = 'local' | 'dev' | 'release';

const variant: AppVariant = (process.env.EXPO_PUBLIC_APP_VARIANT as AppVariant) || 'dev';

const config = {
  local: {
    apiUrl: 'http://localhost:8000/graphql',
    enableDevtools: true,
  },
  dev: {
    apiUrl: 'https://moods-dev.free-side.us/graphql',
    enableDevtools: true,
  },
  release: {
    apiUrl: 'https://moods.free-side.us/graphql',
    enableDevtools: false,
  },
} as const;

export const appConfig = config[variant];
