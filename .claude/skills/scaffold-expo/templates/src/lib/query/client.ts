import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { focusManager, onlineManager, QueryClient } from '@tanstack/react-query';
import { AppState, Platform } from 'react-native';

import { isAppError } from '@/lib/api/errors';

const MAX_RETRIES = 2;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      // Kept long enough to be persisted and shown as offline fallback.
      gcTime: 24 * 60 * 60 * 1000,
      retry: (failureCount, error) => {
        // Unknown symbols or tool bugs won't fix themselves; only retry transient failures.
        if (isAppError(error) && !error.isRetryable) return false;
        return failureCount < MAX_RETRIES;
      },
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
    },
  },
});

/** Persists successful query results so the app can show last-known data offline. */
export const queryPersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'app-query-cache',
  throttleTime: 2000,
});

export const PERSIST_MAX_AGE = 24 * 60 * 60 * 1000;

let managersWired = false;

/** Pauses queries while offline and refetches when the app returns to the foreground. */
export function wireQueryManagers() {
  if (managersWired || Platform.OS === 'web') return;
  managersWired = true;

  onlineManager.setEventListener((setOnline) =>
    NetInfo.addEventListener((state) => {
      setOnline(state.isConnected !== false);
    }),
  );

  focusManager.setEventListener((handleFocus) => {
    const subscription = AppState.addEventListener('change', (status) => handleFocus(status === 'active'));
    return () => subscription.remove();
  });
}
