import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { describeError } from '@/lib/api/errors';

export function LoadingState({ label = 'Loading…', compact = false }: { label?: string; compact?: boolean }) {
  const theme = useTheme();
  return (
    <View style={[styles.center, compact && styles.compact]} accessibilityRole="progressbar" accessibilityLabel={label}>
      <ActivityIndicator color={theme.textSecondary} />
      {!compact && (
        <ThemedText type="small" themeColor="textSecondary">
          {label}
        </ThemedText>
      )}
    </View>
  );
}

export function ErrorState({
  error,
  onRetry,
  compact = false,
}: {
  error: unknown;
  onRetry?: () => void;
  compact?: boolean;
}) {
  return (
    <View style={[styles.center, compact && styles.compact]} accessibilityRole="alert">
      <ThemedText type="small" themeColor="negative" style={styles.message}>
        {describeError(error)}
      </ThemedText>
      {onRetry && <RetryButton onPress={onRetry} />}
    </View>
  );
}

export function EmptyState({ title, message }: { title: string; message?: string }) {
  return (
    <View style={styles.center}>
      <ThemedText type="smallBold">{title}</ThemedText>
      {message && (
        <ThemedText type="small" themeColor="textSecondary" style={styles.message}>
          {message}
        </ThemedText>
      )}
    </View>
  );
}

type NoticeTone = 'warning' | 'error' | 'info';

/** Non-blocking banner shown above content (stale data, fallbacks, partial failures). */
export function Notice({ tone, message, onRetry }: { tone: NoticeTone; message: string; onRetry?: () => void }) {
  const theme = useTheme();
  const background =
    tone === 'error' ? theme.errorBackground : tone === 'warning' ? theme.warningBackground : theme.backgroundSelected;
  const color = tone === 'error' ? 'negative' : tone === 'warning' ? 'warning' : 'textSecondary';

  return (
    <View
      style={[styles.notice, { backgroundColor: background }]}
      accessibilityRole={tone === 'info' ? undefined : 'alert'}>
      <ThemedText type="small" themeColor={color} style={styles.noticeText}>
        {message}
      </ThemedText>
      {onRetry && <RetryButton onPress={onRetry} />}
    </View>
  );
}

function RetryButton({ onPress }: { onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      hitSlop={8}
      style={({ pressed }) => [styles.retry, { borderColor: theme.border }, pressed && styles.pressed]}>
      <ThemedText type="smallBold" style={{ color: theme.accent }}>
        Retry
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.four,
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
  },
  compact: {
    paddingVertical: Spacing.three,
  },
  message: {
    textAlign: 'center',
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Spacing.two,
    borderCurve: 'continuous',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  noticeText: {
    flex: 1,
  },
  retry: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
  },
  pressed: {
    opacity: 0.6,
  },
});
