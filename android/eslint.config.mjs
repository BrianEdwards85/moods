import expoConfig from 'eslint-config-expo/flat.js';
import prettierConfig from 'eslint-config-prettier';

export default [
  ...expoConfig,
  prettierConfig,
  {
    ignores: ['node_modules/', 'android/', 'ios/', '.expo/', 'dist/', 'web-build/'],
  },
];
