import type { PropsWithChildren, ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

type CardProps = PropsWithChildren<{
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  style?: StyleProp<ViewStyle>;
}>;

export function Card({ title, subtitle, action, style, children }: CardProps) {
  return (
    <ThemedView type="backgroundElement" style={[styles.card, style]}>
      {(title || action) && (
        <View style={styles.header}>
          <View style={styles.titles}>
            {title && (
              <ThemedText type="smallBold" accessibilityRole="header">
                {title}
              </ThemedText>
            )}
            {subtitle && (
              <ThemedText type="small" themeColor="textSecondary">
                {subtitle}
              </ThemedText>
            )}
          </View>
          {action}
        </View>
      )}
      {children}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Spacing.three,
    borderCurve: 'continuous',
    padding: Spacing.three,
    gap: Spacing.two,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  titles: {
    flex: 1,
  },
});
