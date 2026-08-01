import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../contexts/ThemeContext';
import { spacing, typography } from '../shared/theme';

type Props = {
  title: string;
  children: React.ReactNode;
};

export function MenuScreenLayout({ title, children }: Props) {
  const router = useRouter();
  const { colors } = useTheme();

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(app)');
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.bgSecondary }]}>
      <SafeAreaView edges={['top']} style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable onPress={handleBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
          <Text style={[styles.backText, { color: colors.text }]}>Back</Text>
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <View style={styles.headerSpacer} />
      </SafeAreaView>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 72,
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    ...typography.heading,
    fontSize: 17,
  },
  headerSpacer: {
    minWidth: 72,
  },
  scroll: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
  },
});
