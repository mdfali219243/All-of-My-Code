import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ResizeMode } from 'expo-av';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ViewToken,
} from 'react-native';

import { fetchReels } from '../api/posts';
import { followUser, likePost } from '../api/social';
import { Avatar } from '../components/Avatar';
import { MenuButton } from '../components/MenuButton';
import { ShareModal } from '../components/ShareModal';
import { VideoPlayer } from '../components/VideoPlayer';
import { useTheme } from '../contexts/ThemeContext';
import { showAlert } from '../shared/confirm';
import type { Post } from '../shared/types';
import { spacing } from '../shared/theme';

type ReelTab = 'following' | 'foryou';

export function ReelsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { height: windowHeight, width } = useWindowDimensions();
  const reelHeight = windowHeight;
  const [posts, setPosts] = useState<Post[]>([]);
  const [followedIds, setFollowedIds] = useState<number[]>([]);
  const [tab, setTab] = useState<ReelTab>('foryou');
  const [loading, setLoading] = useState(true);
  const [activePost, setActivePost] = useState<number | null>(null);
  const [sharePostId, setSharePostId] = useState<number | null>(null);

  const loadReels = useCallback(async () => {
    const data = await fetchReels();
    const videos = data.posts.filter((p) => p.video_url);
    setPosts(videos);
    setFollowedIds(data.followed_ids ?? []);
    if (videos.length > 0) {
      setActivePost(videos[0].id);
    }
  }, []);

  useEffect(() => {
    loadReels().finally(() => setLoading(false));
  }, [loadReels]);

  const visiblePosts = useMemo(() => {
    if (tab !== 'following') return posts;
    const followed = new Set(followedIds);
    return posts.filter((p) => (p.user_id != null ? followed.has(p.user_id) : false));
  }, [posts, followedIds, tab]);

  useEffect(() => {
    if (visiblePosts.length > 0) {
      setActivePost(visiblePosts[0].id);
    } else {
      setActivePost(null);
    }
  }, [tab, visiblePosts]);

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 70 }).current;

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const first = viewableItems[0]?.item as Post | undefined;
    if (first) {
      setActivePost(first.id);
    }
  }).current;

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.white} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.push('/(app)')} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={colors.white} />
        </Pressable>
        <View style={styles.headerTabs}>
          <Pressable onPress={() => setTab('following')}>
            <Text style={tab === 'following' ? styles.tabActive : styles.tabMuted}>Following</Text>
          </Pressable>
          <Pressable onPress={() => setTab('foryou')}>
            <Text style={tab === 'foryou' ? styles.tabActive : styles.tabMuted}>For You</Text>
          </Pressable>
        </View>
        <View style={{ width: 40 }}>
          <MenuButton size={26} color={colors.white} />
        </View>
      </View>

      <FlatList
        data={visiblePosts}
        keyExtractor={(item) => String(item.id)}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={reelHeight}
        decelerationRate="fast"
        style={Platform.OS === 'web' ? styles.webList : undefined}
        getItemLayout={(_, index) => ({
          length: reelHeight,
          offset: reelHeight * index,
          index,
        })}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        renderItem={({ item }) => (
          <ReelItem
            post={item}
            reelHeight={reelHeight}
            reelWidth={width}
            isActive={activePost === item.id}
            onShare={() => setSharePostId(item.source_id)}
            onFollow={async () => {
              try {
                const r = await followUser(item.username);
                showAlert(r.following ? 'Following' : 'Unfollowed', `@${item.username}`);
                if (r.following && item.user_id != null) {
                  setFollowedIds((prev) => (prev.includes(item.user_id!) ? prev : [...prev, item.user_id!]));
                } else if (item.user_id != null) {
                  setFollowedIds((prev) => prev.filter((id) => id !== item.user_id));
                }
              } catch (e) {
                showAlert('Error', e instanceof Error ? e.message : 'Failed');
              }
            }}
            onLike={async () => {
              const wasLiked = item.is_liked;
              setPosts((prev) =>
                prev.map((p) =>
                  p.id === item.id
                    ? {
                        ...p,
                        is_liked: !wasLiked,
                        likes_count: Math.max(0, p.likes_count + (wasLiked ? -1 : 1)),
                      }
                    : p,
                ),
              );
              try {
                await likePost(item.source_id);
              } catch {
                setPosts((prev) =>
                  prev.map((p) =>
                    p.id === item.id
                      ? {
                          ...p,
                          is_liked: wasLiked,
                          likes_count: Math.max(0, p.likes_count + (wasLiked ? 1 : -1)),
                        }
                      : p,
                  ),
                );
              }
            }}
          />
        )}
        ListEmptyComponent={
          <View style={[styles.empty, { height: reelHeight }]}>
            <Text style={styles.emptyText}>
              {tab === 'following'
                ? 'No videos from people you follow yet'
                : 'No video posts yet'}
            </Text>
            <Pressable style={styles.emptyBtn} onPress={() => router.push('/(app)/search')}>
              <Text style={styles.emptyBtnText}>Find people</Text>
            </Pressable>
          </View>
        }
      />

      {sharePostId ? (
        <ShareModal
          visible
          postId={sharePostId}
          onClose={() => setSharePostId(null)}
          onShared={() => setSharePostId(null)}
        />
      ) : null}
    </View>
  );
}

function ReelItem({
  post,
  reelHeight,
  reelWidth,
  isActive,
  onShare,
  onFollow,
  onLike,
}: {
  post: Post;
  reelHeight: number;
  reelWidth: number;
  isActive: boolean;
  onShare: () => void;
  onFollow: () => void;
  onLike: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.reel, { height: reelHeight, width: reelWidth }]}>
      {post.video_url ? (
        <VideoPlayer
          uri={post.video_url}
          style={StyleSheet.absoluteFillObject}
          autoPlay={isActive}
          loop
          muted
          nativeControls={false}
          resizeMode={ResizeMode.COVER}
        />
      ) : null}

      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={styles.gradient} />

      <View style={styles.reelContent}>
        <View style={styles.reelInfo}>
          <Text style={styles.reelUser}>@{post.username}</Text>
          {post.caption ? <Text style={styles.reelCaption}>{post.caption}</Text> : null}
        </View>

        <View style={styles.reelActions}>
          <Pressable style={styles.reelAction} onPress={onFollow}>
            <Avatar name={post.display_name} size={44} />
            <View style={styles.followPill}>
              <Ionicons name="add" size={14} color={colors.white} />
            </View>
          </Pressable>
          <Pressable style={styles.reelAction} onPress={onLike}>
            <Ionicons name="heart" size={32} color={post.is_liked ? '#ec4899' : colors.white} />
            <Text style={styles.actionLabel}>{post.likes_count || ''}</Text>
          </Pressable>
          <Pressable style={styles.reelAction} onPress={onShare}>
            <Ionicons name="share-social" size={30} color={colors.white} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  webList: { flex: 1, height: '100vh' as unknown as number },
  loading: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  header: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTabs: { flexDirection: 'row', gap: 20 },
  tabMuted: { color: 'rgba(255,255,255,0.6)', fontWeight: '700', fontSize: 16 },
  tabActive: { color: '#ffffff', fontWeight: '700', fontSize: 16 },
  reel: { backgroundColor: '#111', overflow: 'hidden' },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
  },
  reelContent: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
  },
  reelInfo: { flex: 1, paddingRight: 60 },
  reelUser: { color: '#ffffff', fontWeight: '700', fontSize: 16, marginBottom: 8 },
  reelCaption: { color: '#ffffff', fontSize: 14, lineHeight: 20 },
  reelActions: { alignItems: 'center', gap: 20 },
  reelAction: { alignItems: 'center' },
  followPill: {
    position: 'absolute',
    bottom: -6,
    backgroundColor: '#6366f1',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { color: '#fff', fontSize: 12, marginTop: 4 },
  empty: { alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 32 },
  emptyText: { fontSize: 16, color: 'rgba(255,255,255,0.7)', textAlign: 'center' },
  emptyBtn: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyBtnText: { color: '#fff', fontWeight: '700' },
});
