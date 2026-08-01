import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { MenuScreenLayout } from '../components/MenuScreenLayout';
import { useTheme } from '../contexts/ThemeContext';
import { radius, spacing, typography } from '../shared/theme';

const FEATURES = [
  { icon: 'videocam' as const, title: 'Live debates', body: 'Create a room, go live, and record sessions to your profile.' },
  { icon: 'play-circle' as const, title: 'Reels & posts', body: 'Share short videos and feed posts with likes and comments.' },
  { icon: 'chatbubbles' as const, title: 'Inbox', body: 'Direct messages and debate chat while you watch live.' },
  { icon: 'people' as const, title: 'Profiles', body: 'Follow creators, view their content, and build your audience.' },
];

export function AboutScreen() {
  const { colors } = useTheme();

  return (
    <MenuScreenLayout title="About">
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.sectionLabel, { color: colors.textDim }]}>The app</Text>
        <Text style={[styles.body, { color: colors.textMuted }]}>
          Project Injustice is a cross-platform social app — web, iPhone, and Android — for live
          debates, video posts, reels, and messaging. It is designed for people who want real
          discussion, not just passive scrolling.
        </Text>
        <Text style={[styles.body, { color: colors.textMuted }]}>
          Create an account to host debates, share recordings to your feed, follow friends, and join
          rooms from anywhere.
        </Text>
      </View>

      <Text style={[styles.sectionLabel, { color: colors.textDim }]}>What you can do</Text>
      <View style={styles.featureGrid}>
        {FEATURES.map((feature) => (
          <View key={feature.title} style={[styles.featureCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.featureIcon, { backgroundColor: colors.accentSoft }]}>
              <Ionicons name={feature.icon} size={20} color={colors.brandLight} />
            </View>
            <Text style={[styles.featureTitle, { color: colors.text }]}>{feature.title}</Text>
            <Text style={[styles.featureBody, { color: colors.textMuted }]}>{feature.body}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.sectionLabel, { color: colors.textDim }]}>Developer</Text>
        <View style={styles.devRow}>
          <LinearGradient colors={[colors.brand, '#4338ca']} style={styles.devAvatar}>
            <Text style={styles.devAvatarText}>MF</Text>
          </LinearGradient>
          <View style={styles.devInfo}>
            <Text style={[styles.devName, { color: colors.text }]}>Md Foysal Ali</Text>
            <Text style={[styles.devRole, { color: colors.brandLight }]}>Creator & full-stack developer</Text>
            <Text style={[styles.devStack, { color: colors.textDim }]}>Expo · React Native · Django</Text>
          </View>
        </View>
        <Text style={[styles.body, { color: colors.textMuted }]}>
          Built as a modern debate-first social network with live video, real-time chat, and a UI
          tuned for long sessions. Open to feedback and new features from the community.
        </Text>
      </View>

      <Pressable
        onPress={() => Linking.openURL('https://project-injustice.com')}
        style={[styles.linkBtn, { borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}
      >
        <Ionicons name="globe-outline" size={18} color={colors.brandLight} />
        <Text style={[styles.linkText, { color: colors.brandLight }]}>project-injustice.com</Text>
      </Pressable>
    </MenuScreenLayout>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  featureGrid: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  featureCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  featureTitle: {
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 4,
  },
  featureBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  devRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  devAvatar: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  devAvatarText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },
  devInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  devName: {
    ...typography.heading,
    fontSize: 17,
  },
  devRole: {
    fontSize: 13,
    marginTop: 2,
  },
  devStack: {
    fontSize: 12,
    marginTop: 4,
  },
  linkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 14,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  linkText: {
    fontWeight: '600',
    fontSize: 15,
  },
});
