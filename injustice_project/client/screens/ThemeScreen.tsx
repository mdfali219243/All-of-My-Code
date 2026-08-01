import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { MenuScreenLayout } from '../components/MenuScreenLayout';
import { useTheme } from '../contexts/ThemeContext';
import { radius, spacing, typography } from '../shared/theme';

export function ThemeScreen() {
  const { mode, colors, setMode } = useTheme();
  const isDark = mode === 'dark';

  return (
    <MenuScreenLayout title="Theme">
      <Text style={[styles.intro, { color: colors.textMuted }]}>
        Choose how Project Injustice looks on this device. Your preference is saved automatically.
      </Text>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.row}>
          <View style={[styles.iconWrap, { backgroundColor: colors.accentSoft }]}>
            <Ionicons name="moon" size={22} color={colors.brandLight} />
          </View>
          <View style={styles.rowText}>
            <Text style={[styles.optionTitle, { color: colors.text }]}>Dark mode</Text>
            <Text style={[styles.optionBody, { color: colors.textMuted }]}>
              Default look — easy on the eyes for long sessions.
            </Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={(v) => setMode(v ? 'dark' : 'light')}
            trackColor={{ false: colors.surfaceHover, true: colors.brand }}
            thumbColor={colors.white}
          />
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.row}>
          <View style={[styles.iconWrap, { backgroundColor: colors.accentSoft }]}>
            <Ionicons name="sunny" size={22} color={colors.brandLight} />
          </View>
          <View style={styles.rowText}>
            <Text style={[styles.optionTitle, { color: colors.text }]}>Light mode</Text>
            <Text style={[styles.optionBody, { color: colors.textMuted }]}>
              Brighter backgrounds for daytime use.
            </Text>
          </View>
          <Switch
            value={!isDark}
            onValueChange={(v) => setMode(v ? 'light' : 'dark')}
            trackColor={{ false: colors.surfaceHover, true: colors.brand }}
            thumbColor={colors.white}
          />
        </View>
      </View>

      <Text style={[styles.hint, { color: colors.textDim }]}>
        Menu screens and the header update immediately. Some feed cards still use the classic dark
        styling until a future update.
      </Text>

      <View style={styles.previewRow}>
        <Pressable
          onPress={() => setMode('dark')}
          style={[
            styles.preview,
            { backgroundColor: '#18191a', borderColor: isDark ? colors.brand : colors.border },
          ]}
        >
          <Text style={styles.previewLabelDark}>Dark</Text>
        </Pressable>
        <Pressable
          onPress={() => setMode('light')}
          style={[
            styles.preview,
            { backgroundColor: '#f0f2f5', borderColor: !isDark ? colors.brand : colors.border },
          ]}
        >
          <Text style={styles.previewLabelLight}>Light</Text>
        </Pressable>
      </View>
    </MenuScreenLayout>
  );
}

const styles = StyleSheet.create({
  intro: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
  },
  optionTitle: {
    ...typography.bodyMedium,
    fontWeight: '700',
    marginBottom: 2,
  },
  optionBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    marginVertical: spacing.md,
  },
  hint: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: spacing.lg,
  },
  previewRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  preview: {
    flex: 1,
    height: 72,
    borderRadius: radius.lg,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewLabelDark: {
    color: '#e4e6eb',
    fontWeight: '700',
  },
  previewLabelLight: {
    color: '#050505',
    fontWeight: '700',
  },
});
