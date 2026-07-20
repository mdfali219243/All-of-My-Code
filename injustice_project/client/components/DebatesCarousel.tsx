import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { endDebate } from '../api/social';
import { useTheme } from '../contexts/ThemeContext';
import { confirmDestructive, showAlert } from '../shared/confirm';
import type { Debate } from '../shared/types';
import { radius, spacing, type ThemeColors } from '../shared/theme';

type Props = {
  debates: Debate[];
  onChanged?: () => void;
  onRemove?: (debateId: number) => void;
};

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: { marginBottom: spacing.md },
    card: {
      width: 240,
      backgroundColor: colors.surfaceHover,
      borderRadius: radius.md,
      padding: spacing.md,
      marginRight: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
    },
    liveRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
    liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444' },
    liveLabel: { color: '#ef4444', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
    deleteBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.errorBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    topic: { color: colors.text, fontWeight: '700', fontSize: 15, marginBottom: 4 },
    host: { color: colors.textDim, fontSize: 12, marginBottom: spacing.sm },
    joinBtn: {
      backgroundColor: colors.brand,
      borderRadius: radius.sm,
      paddingVertical: 8,
      alignItems: 'center',
    },
    joinText: { color: colors.white, fontWeight: '700', fontSize: 14 },
  });
}

export function DebatesCarousel({ debates, onChanged, onRemove }: Props) {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  if (!debates.length) return null;

  async function handleDelete(debate: Debate) {
    const confirmed = await confirmDestructive(
      'End without saving video?',
      'Ending from the feed does not upload a recording. Open the debate and tap "End debate for everyone" in Host controls to save the video.',
      'End without video',
    );
    if (!confirmed) return;

    try {
      onRemove?.(debate.id);
      await endDebate(debate.id);
      onChanged?.();
    } catch (e) {
      onChanged?.();
      showAlert('Error', e instanceof Error ? e.message : 'Could not end debate');
    }
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.wrap}>
      {debates.map((debate) => (
        <View key={debate.id} style={styles.card}>
          <View style={styles.topRow}>
            <View style={styles.liveRow}>
              <View style={styles.liveDot} />
              <Text style={styles.liveLabel}>LIVE DEBATE</Text>
            </View>
            {debate.is_host ? (
              <Pressable
                onPress={() => void handleDelete(debate)}
                style={styles.deleteBtn}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`End debate ${debate.topic}`}
              >
                <Ionicons name="trash-outline" size={18} color={colors.error} />
              </Pressable>
            ) : null}
          </View>
          <Text style={styles.topic} numberOfLines={2}>{debate.topic}</Text>
          <Text style={styles.host}>Hosted by {debate.creator_display_name}</Text>
          <Pressable
            style={styles.joinBtn}
            onPress={() => router.push(`/(app)/debate/${debate.id}`)}
          >
            <Text style={styles.joinText}>{debate.is_host ? 'Rejoin as host' : 'Join Debate'}</Text>
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}
