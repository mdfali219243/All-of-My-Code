import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import { EmptyState } from '../components/EmptyState';
import { PostCard } from '../components/PostCard';
import { useTheme } from '../contexts/ThemeContext';
import { showAlert } from '../shared/confirm';
import type { Debate, Post } from '../shared/types';
import { radius, spacing, type ThemeColors } from '../shared/theme';

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bgSecondary },
    loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgSecondary },
    list: { padding: spacing.md, paddingBottom: spacing.xxl },
    errorBanner: {
      backgroundColor: colors.errorBg,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.error,
      padding: spacing.md,
      marginBottom: spacing.md,
      gap: spacing.sm,
    },
    errorText: { color: colors.error, fontSize: 14, lineHeight: 20 },
    errorRetry: { alignSelf: 'flex-start' },
    errorRetryText: { color: colors.brandLight, fontWeight: '700', fontSize: 14 },
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
    modalTitle: { color: colors.text, fontSize: 20, fontWeight: '700', marginBottom: spacing.xs },
    modalHint: { color: colors.textDim, fontSize: 14, lineHeight: 20, marginBottom: spacing.md },
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
      minWidth: 120,
      alignItems: 'center',
    },
    modalStartDisabled: { opacity: 0.55 },
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
  const [error, setError] = useState<string | null>(null);
  const [debateModal, setDebateModal] = useState(false);
  const [debateTopic, setDebateTopic] = useState('');
  const [creatingDebate, setCreatingDebate] = useState(false);
  const focusedRef = useRef(true);
  const hasLoadedRef = useRef(false);

  const loadAll = useCallback(async () => {
    try {
      const [postsData, debatesData] = await Promise.all([fetchPosts(), fetchDebates()]);
      setPosts(postsData);
      setDebates(debatesData);
      setError(null);
      hasLoadedRef.current = true;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not load feed';
      setError(message);
      throw e;
    }
  }, []);

  const removeDebate = useCallback((debateId: number) => {
    setDebates((prev) => prev.filter((debate) => debate.id !== debateId));
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadAll();
    } catch {
      /* banner shows error */
    } finally {
      setRefreshing(false);
    }
  }, [loadAll]);

  useFocusEffect(
    useCallback(() => {
      focusedRef.current = true;
      let cancelled = false;

      const boot = async () => {
        try {
          await loadAll();
        } catch {
          /* banner */
        } finally {
          if (!cancelled) setLoading(false);
        }
      };

      void boot();

      const interval = setInterval(() => {
        if (!focusedRef.current) return;
        fetchDebates()
          .then(setDebates)
          .catch(() => {});
      }, 45_000);

      return () => {
        cancelled = true;
        focusedRef.current = false;
        clearInterval(interval);
      };
    }, [loadAll]),
  );

  async function handleCreateDebate() {
    const topic = debateTopic.trim();
    if (!topic || creatingDebate) return;
    setCreatingDebate(true);
    try {
      const debate = await createDebate(topic);
      setDebateModal(false);
      setDebateTopic('');
      router.push(`/(app)/debate/${debate.id}`);
    } catch (e) {
      showAlert('Error', e instanceof Error ? e.message : 'Could not create debate');
    } finally {
      setCreatingDebate(false);
    }
  }

  if (loading && !hasLoadedRef.current) {
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
        renderItem={({ item }) => <PostCard post={item} onUpdate={() => void loadAll().catch(() => {})} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />
        }
        ListHeaderComponent={
          <>
            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
                <Pressable style={styles.errorRetry} onPress={() => void onRefresh()}>
                  <Text style={styles.errorRetryText}>Retry</Text>
                </Pressable>
              </View>
            ) : null}
            <CreatePostCard
              onPosted={() => void loadAll().catch(() => {})}
              onOpenDebate={() => setDebateModal(true)}
            />
            <DebatesCarousel
              debates={debates}
              onChanged={() => void loadAll().catch(() => {})}
              onRemove={removeDebate}
              onStartDebate={() => setDebateModal(true)}
            />
          </>
        }
        ListEmptyComponent={
          <EmptyState
            icon="newspaper-outline"
            title="No posts yet"
            subtitle="Share a photo or video, or start a live debate to get the conversation going."
            actionLabel="Start a Live Debate"
            onAction={() => setDebateModal(true)}
          />
        }
        contentContainerStyle={styles.list}
      />

      <Modal visible={debateModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Start a Live Debate</Text>
            <Text style={styles.modalHint}>
              On desktop Chrome or Edge, you&apos;ll be asked to share this tab so the debate can be recorded.
            </Text>
            <TextInput
              value={debateTopic}
              onChangeText={setDebateTopic}
              placeholder="What's the topic?"
              placeholderTextColor={colors.textDim}
              style={styles.modalInput}
              editable={!creatingDebate}
              onSubmitEditing={() => void handleCreateDebate()}
            />
            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancel}
                onPress={() => !creatingDebate && setDebateModal(false)}
                disabled={creatingDebate}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalStart, (creatingDebate || !debateTopic.trim()) && styles.modalStartDisabled]}
                onPress={() => void handleCreateDebate()}
                disabled={creatingDebate || !debateTopic.trim()}
              >
                {creatingDebate ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.modalStartText}>Start Debate</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
