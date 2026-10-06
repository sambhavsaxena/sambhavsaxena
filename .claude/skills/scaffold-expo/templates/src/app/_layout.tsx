import { QueryClientProvider } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, type ErrorBoundaryProps } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import type { PropsWithChildren } from 'react';
import { Platform, StyleSheet, useColorScheme, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Notice } from '@/components/ui/state-views';
import { Spacing } from '@/constants/theme';
import { PERSIST_MAX_AGE, queryClient, queryPersister, wireQueryManagers } from '@/lib/query/client';

SplashScreen.preventAutoHideAsync();
wireQueryManagers();

/** Native builds persist successful queries so last-known data shows offline. */
function QueryProvider({ children }: PropsWithChildren) {
  if (Platform.OS === 'web') {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: queryPersister,
        maxAge: PERSIST_MAX_AGE,
        // Bump when a cached response shape changes.
        buster: '1',
        dehydrateOptions: { shouldDehydrateQuery: (query) => query.state.status === 'success' },
      }}>
      {children}
    </PersistQueryClientProvider>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  // Hide the splash once the session (and anything else gating first paint) has hydrated:
  // useEffect(() => { if (sessionReady) SplashScreen.hideAsync(); }, [sessionReady]);
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <QueryProvider>
        {/* <SessionProvider> and domain providers go here */}
        <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal' }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          {/* Auth: <Stack.Protected guard={!!session}> … </Stack.Protected> */}
        </Stack>
      </QueryProvider>
    </ThemeProvider>
  );
}

/** Last-resort boundary for render errors anywhere in the app. */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <ThemedView style={styles.boundary}>
      <View style={styles.boundaryInner}>
        <ThemedText type="subtitle">Something broke</ThemedText>
        <Notice tone="error" message={error.message || 'An unexpected error occurred.'} onRetry={() => void retry()} />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  boundary: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.four,
  },
  boundaryInner: {
    gap: Spacing.three,
  },
});
