import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';

import { MenuScreenLayout } from '../components/MenuScreenLayout';
import { useTheme } from '../contexts/ThemeContext';
import { spacing } from '../shared/theme';

export function PrivacyScreen() {
  const { colors } = useTheme();

  return (
    <MenuScreenLayout title="Privacy Policy">
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.updated, { color: colors.textDim }]}>Last updated: August 8, 2026</Text>

        <Text style={[styles.heading, { color: colors.text }]}>Overview</Text>
        <Text style={[styles.body, { color: colors.textMuted }]}>
          Project Injustice (“the App”) is a social debate platform. This policy explains what
          information we collect and how we use it when you use the mobile app or website at
          project-injustice.com.
        </Text>

        <Text style={[styles.heading, { color: colors.text }]}>Information we collect</Text>
        <Text style={[styles.body, { color: colors.textMuted }]}>
          Account details you provide (username, email, password), profile content you post
          (text, photos, videos, debate recordings), messages you send, and basic technical data
          needed to run the service (device type, app version, and IP address for security).
        </Text>

        <Text style={[styles.heading, { color: colors.text }]}>How we use information</Text>
        <Text style={[styles.body, { color: colors.textMuted }]}>
          We use your information to create and secure your account, show your feed and profile,
          enable live debates and messaging, store drafts you choose to save, and improve reliability
          and safety. We do not sell your personal information.
        </Text>

        <Text style={[styles.heading, { color: colors.text }]}>Camera, microphone & photos</Text>
        <Text style={[styles.body, { color: colors.textMuted }]}>
          Camera and microphone are used only when you join a live debate or capture media.
          Photo library access is used only when you choose to upload or share content. You can
          deny these permissions in system settings; some features will then be unavailable.
        </Text>

        <Text style={[styles.heading, { color: colors.text }]}>Third-party services</Text>
        <Text style={[styles.body, { color: colors.textMuted }]}>
          Live video may use Jitsi-compatible conference servers. Hosting and API services may
          process data necessary to deliver the App. Push notifications may be delivered through
          Apple or Google notification services when enabled.
        </Text>

        <Text style={[styles.heading, { color: colors.text }]}>Data retention & deletion</Text>
        <Text style={[styles.body, { color: colors.textMuted }]}>
          Content remains while your account is active. You can delete posts/drafts you own.
          Contact us to request account deletion, and we will remove personal account data except
          where we must keep limited records for legal or security reasons.
        </Text>

        <Text style={[styles.heading, { color: colors.text }]}>Children</Text>
        <Text style={[styles.body, { color: colors.textMuted }]}>
          The App is not directed to children under 13, and we do not knowingly collect personal
          information from children under 13.
        </Text>

        <Text style={[styles.heading, { color: colors.text }]}>Contact</Text>
        <Text style={[styles.body, { color: colors.textMuted }]}>
          Questions about privacy: use Feedback in the app menu, or visit{' '}
          <Text
            style={{ color: colors.brandLight }}
            onPress={() => void Linking.openURL('https://project-injustice.com')}
          >
            project-injustice.com
          </Text>
          .
        </Text>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </MenuScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.sm },
  updated: { fontSize: 13, marginBottom: spacing.sm },
  heading: { fontSize: 18, fontWeight: '800', marginTop: spacing.md },
  body: { fontSize: 15, lineHeight: 22 },
});
