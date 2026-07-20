import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MenuScreenLayout } from '../components/MenuScreenLayout';
import { useTheme } from '../contexts/ThemeContext';
import { radius, spacing } from '../shared/theme';

type FaqItem = {
  q: string;
  a: string;
};

const FAQ_ITEMS: FaqItem[] = [
  {
    q: 'How do I start a live debate?',
    a: 'On the feed, tap Create Debate, enter a topic, and join the Jitsi room. You can invite others and record the session to your profile when finished.',
  },
  {
    q: 'Can anyone join my debate?',
    a: 'Yes — debates are open rooms. Anyone signed in can join from the feed carousel or a shared link. Be respectful; hosts can end the session.',
  },
  {
    q: 'How does recording work?',
    a: 'On web (Chrome or Edge), after you join the video room as host, the browser asks to record this tab. Allow screen and audio capture. When you tap End debate for everyone in Host controls, the recording uploads to your profile feed. The mobile app does not record debates yet.',
  },
  {
    q: 'What are Reels?',
    a: 'Reels are full-screen vertical videos from posts with video attached. Swipe up/down on the Reels tab to browse.',
  },
  {
    q: 'How do I message someone?',
    a: 'Open Inbox from the header tabs. Tap a conversation or a follower to start a direct chat.',
  },
  {
    q: 'How do I create an account?',
    a: 'Tap Register from the landing page or log out and choose Create account. You need a username, email, and password.',
  },
  {
    q: 'Can I change my theme?',
    a: 'Yes — open Menu → Theme and switch between dark and light mode. Your choice is saved on this device.',
  },
  {
    q: 'How do I send feedback?',
    a: 'Open Menu → Feedback, write your message, and tap Send. It opens your email app with a pre-filled message to the developer.',
  },
];

function FaqRow({ item }: { item: FaqItem }) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Pressable onPress={() => setOpen((v) => !v)} style={styles.rowHead}>
        <Text style={[styles.question, { color: colors.text }]}>{item.q}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textDim} />
      </Pressable>
      {open ? (
        <Text style={[styles.answer, { color: colors.textMuted, borderTopColor: colors.border }]}>
          {item.a}
        </Text>
      ) : null}
    </View>
  );
}

export function FaqScreen() {
  const { colors } = useTheme();

  return (
    <MenuScreenLayout title="Q&A">
      <Text style={[styles.intro, { color: colors.textMuted }]}>
        Common questions about debates, recording, accounts, and the app.
      </Text>
      <View style={styles.list}>
        {FAQ_ITEMS.map((item) => (
          <FaqRow key={item.q} item={item} />
        ))}
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
  list: {
    gap: spacing.sm,
  },
  row: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  rowHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    padding: spacing.md,
  },
  question: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 21,
  },
  answer: {
    fontSize: 14,
    lineHeight: 21,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    paddingTop: spacing.sm,
  },
});
