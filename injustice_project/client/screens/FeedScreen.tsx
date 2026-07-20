import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { fetchPosts } from '../api/posts';
import { createDebate, fetchDebates } from '../api/social';
import { AppHeader } from '../components/AppHeader';
import { CreatePostCard } from '../components/CreatePostCard';
import { DebatesCarousel } from '../components/DebatesCarousel';
import { PostCard } from '../components/PostCard';
import { useTheme } from '../contexts/ThemeContext';
import type { Debate, Post } from '../shared/types';
import { radius, spacing, type ThemeColors } from '../shared/theme';

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bgSecondary },
    loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgSecondary },
    list: { padding: spacing.md, paddingBottom: spacing.xxl },
    empty: {
      alignItems: 'center',
      padding: spacing.xxl,
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    emptyTitle: { color: colors.text, fontSize: 20, fontWeight: '700', marginBottom: 8 },
    emptySub: { color: colors.textDim, textAlign: 'center', lineHeight: 22 },
    modalOverlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'center',
      padding: spacing.lg,
    },
    modalCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalTitle: { color: colors.text, fontSize: 20, fontWeight: '700', marginBottom: spacing.md },
    modalInput: {
      backgroundColor: colors.surfaceHover,
      borderRadius: radius.md,
      padding: 14,
      color: colors.text,
      fontSize: 16,
      marginBottom: spacing.md,
    },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm },
    modalCancel: { padding: 12 },
    modalCancelText: { color: colors.textDim, fontWeight: '600' },
    modalStart: {
      backgroundColor: colors.brand,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: radius.sm,
    },
    modalStartText: { color: colors.white, fontWeight: '700' },
  });
}

export function FeedScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [debates, setDebates] = useState<Debate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [debateModal, setDebateModal] = useState(false);
  const [debateTopic, setDebateTopic] = useState('');

  const loadAll = useCallback(async () => {
    const [postsData, debatesData] = await Promise.all([fetchPosts(), fetchDebates()]);
    setPosts(postsData);
    setDebates(debatesData);
  }, []);

  const removeDebate = useCallback((debateId: number) => {
    setDebates((prev) => prev.filter((debate) => debate.id !== debateId));
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadAll();
    } finally {
      setRefreshing(false);
    }
  }, [loadAll]);

  useEffect(() => {
    loadAll().finally(() => setLoading(false));

    const interval = setInterval(() => {
      fetchDebates().then(setDebates).catch(() => {});
    }, 45_000);

    return () => clearInterval(interval);
  }, [loadAll]);

  useFocusEffect(
    useCallback(() => {
      if (loading) return;
      void loadAll().catch(() => {});
    }, [loading, loadAll]),
  );

  async function handleCreateDebate() {
    const topic = debateTopic.trim();
    if (!topic) return;
    try {
      const debate = await createDebate(topic);
      setDebateModal(false);
      setDebateTopic('');
      router.push(`/(app)/debate/${debate.id}`);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not create debate');
    }
  }

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader activeTab="feed" />

      <FlatList
        data={posts}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <PostCard post={item} onUpdate={loadAll} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />
        }
        ListHeaderComponent={
          <>
            <CreatePostCard onPosted={loadAll} onOpenDebate={() => setDebateModal(true)} />
            <DebatesCarousel debates={debates} onChanged={loadAll} onRemove={removeDebate} />
          </>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No posts yet</Text>
            <Text style={styles.emptySub}>When your friends share photos and videos, they'll appear here.</Text>
          </View>
        }
        contentContainerStyle={styles.list}
      />

      <Modal visible={debateModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Start a Live Debate</Text>
            <TextInput
              value={debateTopic}
              onChangeText={setDebateTopic}
              placeholder="What's the topic?"
              placeholderTextColor={colors.textDim}
              style={styles.modalInput}
            />
            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancel} onPress={() => setDebateModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalStart} onPress={handleCreateDebate}>
                <Text style={styles.modalStartText}>Start Debate</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
