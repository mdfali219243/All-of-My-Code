import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../contexts/ThemeContext';
import { radius, spacing, type ThemeColors } from '../shared/theme';

type Props = {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
};

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      alignItems: 'center',
      padding: spacing.xxl,
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      gap: spacing.sm,
    },
    compact: {
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.md,
    },
    iconWrap: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xs,
    },
    title: { color: colors.text, fontSize: 18, fontWeight: '700', textAlign: 'center' },
    subtitle: { color: colors.textDim, textAlign: 'center', lineHeight: 21, fontSize: 14 },
    action: {
      marginTop: spacing.sm,
      backgroundColor: colors.brand,
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: radius.sm,
    },
    actionText: { color: colors.white, fontWeight: '700', fontSize: 14 },
  });
}

export function EmptyState({
  icon = 'file-tray-outline',
  title,
  subtitle,
  actionLabel,
  onAction,
  compact,
}: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={[styles.wrap, compact && styles.compact]}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={26} color={colors.brandLight} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {actionLabel && onAction ? (
        <Pressable style={styles.action} onPress={onAction}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
