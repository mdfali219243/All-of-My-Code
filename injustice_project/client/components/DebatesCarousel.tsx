import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { Debate } from '../shared/types';
import { colors, radius, spacing } from '../shared/theme';

type Props = {
  debates: Debate[];
};

export function DebatesCarousel({ debates }: Props) {
  const router = useRouter();

  if (!debates.length) return null;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.wrap}>
      {debates.map((debate) => (
        <View key={debate.id} style={styles.card}>
          <View style={styles.liveRow}>
            <View style={styles.liveDot} />
            <Text style={styles.liveLabel}>LIVE DEBATE</Text>
          </View>
          <Text style={styles.topic} numberOfLines={2}>{debate.topic}</Text>
          <Text style={styles.host}>Hosted by {debate.creator_display_name}</Text>
          <Pressable
            style={styles.joinBtn}
            onPress={() => router.push(`/(app)/debate/${debate.id}`)}
          >
            <Text style={styles.joinText}>Join Debate</Text>
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.md,
  },
  card: {
    width: 240,
    backgroundColor: colors.surfaceHover,
    borderRadius: radius.md,
    padding: spacing.md,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: '#4e4f50',
  },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.sm,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  liveLabel: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  topic: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 4,
  },
  host: {
    color: colors.textDim,
    fontSize: 12,
    marginBottom: spacing.sm,
  },
  joinBtn: {
    backgroundColor: colors.brand,
    borderRadius: radius.sm,
    paddingVertical: 8,
    alignItems: 'center',
  },
  joinText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
});
