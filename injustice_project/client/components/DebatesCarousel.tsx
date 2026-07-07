import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { endDebate } from '../api/social';
import type { Debate } from '../shared/types';
import { colors, radius, spacing } from '../shared/theme';

type Props = {
  debates: Debate[];
  onChanged?: () => void;
};

export function DebatesCarousel({ debates, onChanged }: Props) {
  const router = useRouter();

  if (!debates.length) return null;

  async function handleDelete(debate: Debate) {
    Alert.alert(
      'End debate?',
      `Remove "${debate.topic}" and stop the live meeting?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End debate',
          style: 'destructive',
          onPress: async () => {
            try {
              await endDebate(debate.id);
              onChanged?.();
            } catch (e) {
              Alert.alert('Error', e instanceof Error ? e.message : 'Could not end debate');
            }
          },
        },
      ],
    );
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
                onPress={() => handleDelete(debate)}
                style={styles.deleteBtn}
                hitSlop={8}
              >
                <Ionicons name="trash-outline" size={18} color="#fca5a5" />
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

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  card: {
    width: 240,
    backgroundColor: colors.surfaceHover,
    borderRadius: radius.md,
    padding: spacing.md,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: '#4e4f50',
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
    backgroundColor: 'rgba(127, 29, 29, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topic: { color: colors.white, fontWeight: '700', fontSize: 15, marginBottom: 4 },
  host: { color: colors.textDim, fontSize: 12, marginBottom: spacing.sm },
  joinBtn: {
    backgroundColor: colors.brand,
    borderRadius: radius.sm,
    paddingVertical: 8,
    alignItems: 'center',
  },
  joinText: { color: colors.white, fontWeight: '700', fontSize: 14 },
});
