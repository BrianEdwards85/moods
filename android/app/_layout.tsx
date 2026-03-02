import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { Provider } from 'urql';
import { urqlClient } from '@/lib/graphql/client';
import { useStore } from '@/lib/store';
import { useNotifications } from '@/lib/useNotifications';
import { isTokenExpired } from '@/lib/auth';
import { useNetworkStatus } from '@/lib/useNetworkStatus';
import OfflineBanner from '@/components/OfflineBanner';
import { colors } from '@/styles/theme';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

const moodsDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bgDark,
    card: colors.bg,
    text: colors.fg,
    border: colors.border,
    primary: colors.blue,
  },
};

function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const authToken = useStore((s) => s.authToken);
  const restoreAuth = useStore((s) => s.restoreAuth);
  const [restored, setRestored] = useState(false);

  useNotifications();
  useNetworkStatus();

  const clearAuth = useStore((s) => s.clearAuth);

  useEffect(() => {
    restoreAuth().then(async (token) => {
      if (token && isTokenExpired(token)) {
        await clearAuth();
      }
      setRestored(true);
    });
  }, [restoreAuth, clearAuth]);

  useEffect(() => {
    if (!restored) return;

    const inAuthScreen = segments[0] === 'user-select';

    if (!authToken && !inAuthScreen) {
      router.replace('/user-select');
    } else if (authToken && inAuthScreen) {
      router.replace('/(tabs)');
    }
  }, [restored, authToken, segments, router]);

  return <>{children}</>;
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <Provider value={urqlClient}>
      <ThemeProvider value={moodsDarkTheme}>
        <AuthGate>
          <OfflineBanner />
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="user-select"
              options={{ title: 'Select User', headerShown: false }}
            />
          </Stack>
        </AuthGate>
      </ThemeProvider>
    </Provider>
  );
}
