import { LinearGradient } from 'expo-linear-gradient';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, spacing, typography } from '../shared/theme';

type Props = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export function AuthLayout({ title, subtitle, children }: Props) {
  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#0f1117', '#1e1b4b', '#0f1117']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.blob, styles.blobPurple]} />
      <View style={[styles.blob, styles.blobIndigo]} />
      <View style={[styles.blob, styles.blobPink]} />

      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.brandRow}>
              <LinearGradient
                colors={[colors.brand, colors.accent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logo}
              >
                <Text style={styles.logoText}>In</Text>
              </LinearGradient>
              <View>
                <Text style={styles.brandName}>Injustice</Text>
                <Text style={styles.brandTag}>Debate. Connect. Share.</Text>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
              {children}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  flex: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    paddingVertical: spacing.xl,
  },
  blob: {
    position: 'absolute',
    borderRadius: radius.full,
    opacity: 0.35,
  },
  blobPurple: {
    width: 220,
    height: 220,
    top: -40,
    right: -60,
    backgroundColor: '#7c3aed',
  },
  blobIndigo: {
    width: 180,
    height: 180,
    bottom: 120,
    left: -50,
    backgroundColor: colors.brand,
  },
  blobPink: {
    width: 140,
    height: 140,
    top: '40%',
    right: 20,
    backgroundColor: colors.accent,
    opacity: 0.2,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  logo: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '800',
  },
  brandName: {
    ...typography.heading,
    color: colors.text,
  },
  brandTag: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 2,
  },
  card: {
    backgroundColor: 'rgba(36, 37, 38, 0.92)',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  title: {
    ...typography.title,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
});
