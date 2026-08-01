import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState } from 'react';
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Button } from '../components/Button';
import { MenuScreenLayout } from '../components/MenuScreenLayout';
import { useTheme } from '../contexts/ThemeContext';
import { radius, spacing } from '../shared/theme';

const FEEDBACK_KEY = 'injustice_feedback_drafts';
const FEEDBACK_EMAIL = 'mdfoysalali.dev@gmail.com';

export function FeedbackScreen() {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  async function handleSend() {
    const body = message.trim();
    if (!body) {
      Alert.alert('Message required', 'Please enter your feedback before sending.');
      return;
    }

    setSending(true);
    try {
      const draft = { email: email.trim(), message: body, at: new Date().toISOString() };
      const existing = await AsyncStorage.getItem(FEEDBACK_KEY);
      const list = existing ? JSON.parse(existing) : [];
      list.unshift(draft);
      await AsyncStorage.setItem(FEEDBACK_KEY, JSON.stringify(list.slice(0, 20)));

      const subject = encodeURIComponent('Project Injustice feedback');
      const mailBody = encodeURIComponent(
        `${body}\n\n---\nFrom: ${email.trim() || 'anonymous'}\nSent via Project Injustice app`,
      );
      const mailto = `mailto:${FEEDBACK_EMAIL}?subject=${subject}&body=${mailBody}`;

      const canOpen = await Linking.canOpenURL(mailto);
      if (canOpen) {
        await Linking.openURL(mailto);
        Alert.alert('Thanks!', 'Your email app should open with the message ready to send.');
      } else if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(`To: ${FEEDBACK_EMAIL}\n\n${body}`);
        Alert.alert('Copied', 'Feedback copied to clipboard. Paste it into an email to the developer.');
      } else {
        Alert.alert('Saved locally', 'Your feedback was saved on this device. Email the developer when you can.');
      }

      setMessage('');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not send feedback');
    } finally {
      setSending(false);
    }
  }

  return (
    <MenuScreenLayout title="Feedback">
      <Text style={[styles.intro, { color: colors.textMuted }]}>
        Share bugs, ideas, or anything about Project Injustice. Your message opens in your email
        app, or copies to clipboard on web.
      </Text>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.label, { color: colors.textMuted }]}>Your email (optional)</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          placeholderTextColor={colors.textDim}
          keyboardType="email-address"
          autoCapitalize="none"
          style={[styles.input, { backgroundColor: colors.surfaceMuted, borderColor: colors.border, color: colors.text }]}
        />

        <Text style={[styles.label, { color: colors.textMuted }]}>Message</Text>
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="Tell us what you think..."
          placeholderTextColor={colors.textDim}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          style={[styles.textarea, { backgroundColor: colors.surfaceMuted, borderColor: colors.border, color: colors.text }]}
        />

        <Button title="Send feedback" onPress={handleSend} loading={sending} disabled={!message.trim()} />
      </View>

      <Pressable
        onPress={() => Linking.openURL(`mailto:${FEEDBACK_EMAIL}`)}
        style={styles.altLink}
      >
        <Text style={[styles.altLinkText, { color: colors.brandLight }]}>
          Or email {FEEDBACK_EMAIL} directly
        </Text>
      </Pressable>
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
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    marginBottom: spacing.md,
  },
  textarea: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    minHeight: 140,
    marginBottom: spacing.md,
  },
  altLink: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  altLinkText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
