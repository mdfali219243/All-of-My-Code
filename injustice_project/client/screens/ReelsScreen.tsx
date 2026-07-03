import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ResizeMode } from 'expo-av';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { ShareModal } from '../components/ShareModal';
import { VideoPlayer } from '../components/VideoPlayer';
import type { Post } from '../shared/types';
import { colors, spacing } from '../shared/theme';

export function ReelsScreen() {
  const router = useRouter();
  const { height: windowHeight, width } = useWindowDimensions();
  const reelHeight = windowHeight;
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePost, setActivePost] = useState<number | null>(null);
  const [sharePostId, setSharePostId] = useState<number | null>(null);

  const loadReels = useCallback(async () => {
    const data = await fetchReels();
    const videos = data.posts.filter((p) => p.video_url);
    setPosts(videos);
    if (videos.length > 0) {
      setActivePost(videos[0].id);
    }
  }, []);

  useEffect(() => {
    loadReels().finally(() => setLoading(false));
  }, [loadReels]);

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
          <Text style={styles.tabMuted}>Following</Text>
          <Text style={styles.tabActive}>For You</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={posts}
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
                Alert.alert(r.following ? 'Following' : 'Unfollowed', `@${item.username}`);
              } catch (e) {
                Alert.alert('Error', e instanceof Error ? e.message : 'Failed');
              }
            }}
            onLike={async () => {
              await likePost(item.source_id);
              loadReels();
            }}
          />
        )}
        ListEmptyComponent={
          <View style={[styles.empty, { height: reelHeight }]}>
            <Text style={styles.emptyText}>No video posts yet</Text>
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
  return (
    <View style={[styles.reel, { height: reelHeight, width: reelWidth }]}>
      {post.video_url ? (
        <VideoPlayer
          uri={post.video_url}
          style={StyleSheet.absoluteFill}
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
  tabActive: { color: colors.white, fontWeight: '700', fontSize: 16 },
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
  reelUser: { color: colors.white, fontWeight: '700', fontSize: 16, marginBottom: 8 },
  reelCaption: { color: colors.white, fontSize: 14, lineHeight: 20 },
  reelActions: { alignItems: 'center', gap: 20 },
  reelAction: { alignItems: 'center' },
  followPill: {
    position: 'absolute',
    bottom: -6,
    backgroundColor: colors.brand,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { color: colors.white, fontSize: 12, marginTop: 4 },
  empty: { alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: colors.textDim, fontSize: 16 },
});
