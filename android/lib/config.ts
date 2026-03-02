type AppVariant = 'local' | 'dev' | 'release';

const VALID_VARIANTS: readonly string[] = ['local', 'dev', 'release'] as const;
const raw = process.env.EXPO_PUBLIC_APP_VARIANT || 'dev';
if (!VALID_VARIANTS.includes(raw)) {
  throw new Error(`Invalid EXPO_PUBLIC_APP_VARIANT: "${raw}". Must be one of: ${VALID_VARIANTS.join(', ')}`);
}
const variant = raw as AppVariant;

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
