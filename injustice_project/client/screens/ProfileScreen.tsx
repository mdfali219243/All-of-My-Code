import { Ionicons } from '@expo/vector-icons';
import { ResizeMode } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fetchProfile } from '../api/posts';
import { followUser, uploadPhoto } from '../api/social';
import { Avatar } from '../components/Avatar';
import { MenuButton } from '../components/MenuButton';
import { PostCard } from '../components/PostCard';
import { VideoPlayer } from '../components/VideoPlayer';
import { useTheme } from '../contexts/ThemeContext';
import type { Post, Profile } from '../shared/types';
import { radius, spacing, type ThemeColors } from '../shared/theme';

type Tab = 'posts' | 'about' | 'photos' | 'videos' | 'drafts';

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bgSecondary },
    loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgSecondary },
    topSafe: { backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingRight: spacing.sm,
    },
    backRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: 4 },
    backText: { color: colors.text, fontSize: 16 },
    cover: { height: 180, backgroundColor: colors.surfaceMuted },
    profileHead: { alignItems: 'center', paddingHorizontal: spacing.lg, marginTop: -60 },
    avatarWrap: { borderWidth: 4, borderColor: colors.bgSecondary, borderRadius: 999 },
    name: { color: colors.text, fontSize: 24, fontWeight: '800', marginTop: spacing.sm },
    handle: { color: colors.textDim, fontSize: 15, marginTop: 4 },
    stats: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.md, marginBottom: spacing.md },
    stat: { color: colors.textDim, fontSize: 14 },
    statNum: { color: colors.text, fontWeight: '700' },
    actionBtn: {
      backgroundColor: colors.brand,
      paddingHorizontal: 24,
      paddingVertical: 10,
      borderRadius: radius.sm,
      marginBottom: spacing.md,
    },
    actionBtnText: { color: colors.white, fontWeight: '700' },
    tabBar: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    tab: { flex: 1, alignItems: 'center', paddingVertical: 14 },
    tabActive: { borderBottomWidth: 3, borderBottomColor: colors.brand },
    tabText: { color: colors.textDim, fontWeight: '600' },
    tabTextActive: { color: colors.brandLight },
    tabContent: { padding: spacing.md },
    aboutCard: {
      margin: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    aboutLabel: { color: colors.textDim, fontSize: 12, textTransform: 'uppercase', marginTop: spacing.sm },
    aboutValue: { color: colors.text, fontSize: 16, marginTop: 4 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', padding: spacing.sm },
    gridItem: { width: '33.33%', aspectRatio: 1, padding: 2 },
    videoGridItem: {
      width: '33.33%',
      aspectRatio: 1,
      padding: 2,
      position: 'relative',
      overflow: 'hidden',
      borderRadius: radius.sm,
      backgroundColor: colors.surface,
    },
    videoGridPlayer: {
      width: '100%',
      height: '100%',
      minHeight: 0,
    },
    videoGridOverlay: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.25)',
    },
    videoModalBackdrop: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'center',
      padding: spacing.md,
    },
    videoModalCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      maxWidth: 720,
      width: '100%',
      alignSelf: 'center',
    },
    videoModalClose: {
      alignSelf: 'flex-end',
      padding: spacing.sm,
    },
    videoModalCaption: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '600',
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.sm,
    },
    videoModalPlayer: {
      width: '100%',
      aspectRatio: 16 / 10,
      minHeight: 220,
      backgroundColor: colors.bgSecondary,
    },
    emptyTab: {
      color: colors.textDim,
      textAlign: 'center',
      paddingVertical: spacing.xl,
      fontSize: 15,
      width: '100%',
    },
  });
}

export function ProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tab, setTab] = useState<Tab>('posts');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeVideo, setActiveVideo] = useState<Post | null>(null);

  const load = useCallback(async () => {
    if (!username) return;
    const data = await fetchProfile(username);
    setProfile(data);
  }, [username]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  async function handleFollow() {
    if (!username) return;
    try {
      const result = await followUser(username);
      setProfile((p) => p ? { ...p, is_following: result.following } : p);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed');
    }
  }

  async function handleUploadPhoto() {
    if (!username) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (result.canceled || !result.assets[0]) return;
    try {
      await uploadPhoto(username, result.assets[0].uri);
      await load();
      setTab('photos');
      Alert.alert('Uploaded', 'Photo added to your profile.');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Upload failed');
    }
  }

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(app)');
    }
  }

  if (loading || !profile) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  const displayName = profile.user.first_name
    ? `${profile.user.first_name} ${profile.user.last_name}`.trim()
    : profile.user.username;

  const tabs: { key: Tab; label: string }[] = [
    { key: 'posts', label: 'Posts' },
    ...(profile.is_own_profile ? [{ key: 'drafts' as Tab, label: 'Drafts' }] : []),
    { key: 'about', label: 'About' },
    { key: 'photos', label: 'Photos' },
    { key: 'videos', label: 'Videos' },
  ];

  function openDraftReview(post: Post) {
    router.push({
      pathname: '/(app)/debate/review',
      params: {
        postId: String(post.id),
        topic: post.caption ?? '',
        videoUrl: post.video_url ?? '',
      },
    });
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.topSafe}>
        <View style={styles.topBar}>
          <Pressable onPress={handleBack} style={styles.backRow}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
            <Text style={styles.backText}>Back</Text>
          </Pressable>
          <MenuButton color={colors.text} />
        </View>
      </SafeAreaView>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={colors.brand} />
        }
      >
        <View style={styles.cover} />
        <View style={styles.profileHead}>
          <View style={styles.avatarWrap}>
            <Avatar name={displayName} size={120} />
          </View>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.handle}>@{profile.user.username}</Text>

          <View style={styles.stats}>
            <Text style={styles.stat}><Text style={styles.statNum}>{profile.posts.length}</Text> posts</Text>
            <Text style={styles.stat}><Text style={styles.statNum}>{profile.followers_count}</Text> followers</Text>
            <Text style={styles.stat}><Text style={styles.statNum}>{profile.following_count}</Text> following</Text>
          </View>

          {profile.is_own_profile ? (
            <Pressable style={styles.actionBtn} onPress={handleUploadPhoto}>
              <Text style={styles.actionBtnText}>Upload Photo</Text>
            </Pressable>
          ) : (
            <Pressable style={styles.actionBtn} onPress={handleFollow}>
              <Text style={styles.actionBtnText}>{profile.is_following ? 'Unfollow' : 'Follow'}</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.tabBar}>
          {tabs.map((t) => (
            <Pressable key={t.key} style={[styles.tab, tab === t.key && styles.tabActive]} onPress={() => setTab(t.key)}>
              <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
            </Pressable>
          ))}
        </View>

        {tab === 'posts' && (
          <View style={styles.tabContent}>
            {profile.posts.map((post) => (
              <PostCard key={post.id} post={post} onUpdate={load} />
            ))}
          </View>
        )}

        {tab === 'drafts' && profile.is_own_profile ? (
          <View style={styles.grid}>
            {(profile.draft_posts ?? []).length === 0 ? (
              <Text style={styles.emptyTab}>No draft recordings yet</Text>
            ) : null}
            {(profile.draft_posts ?? []).map((post) =>
              post.video_url ? (
                <Pressable
                  key={post.id}
                  style={styles.videoGridItem}
                  onPress={() => openDraftReview(post)}
                >
                  <VideoPlayer
                    uri={post.video_url}
                    style={styles.videoGridPlayer}
                    nativeControls={false}
                    muted
                    resizeMode={ResizeMode.COVER}
                  />
                  <Text style={styles.draftBadge}>DRAFT</Text>
                  <View style={styles.videoGridOverlay}>
                    <Ionicons name="create-outline" size={28} color={colors.white} />
                  </View>
                </Pressable>
              ) : null,
            )}
          </View>
        ) : null}

        {tab === 'about' && (
          <View style={styles.aboutCard}>
            <Text style={styles.aboutLabel}>Username</Text>
            <Text style={styles.aboutValue}>@{profile.user.username}</Text>
            <Text style={styles.aboutLabel}>Email</Text>
            <Text style={styles.aboutValue}>{profile.user.email || 'Not set'}</Text>
          </View>
        )}

        {tab === 'photos' && (
          <View style={styles.grid}>
            {profile.photo_posts.filter((post) => post.image_url).length === 0 ? (
              <Text style={styles.emptyTab}>No photos yet</Text>
            ) : null}
            {profile.photo_posts.map((post) =>
              post.image_url ? (
                <Image key={post.id} source={{ uri: post.image_url }} style={styles.gridItem} />
              ) : null,
            )}
          </View>
        )}

        {tab === 'videos' && (
          <View style={styles.grid}>
            {profile.video_posts.length === 0 ? (
              <Text style={styles.emptyTab}>No videos yet</Text>
            ) : null}
            {profile.video_posts.map((post) =>
              post.video_url ? (
                <Pressable
                  key={post.id}
                  style={styles.videoGridItem}
                  onPress={() => setActiveVideo(post)}
                >
                  <VideoPlayer
                    uri={post.video_url}
                    style={styles.videoGridPlayer}
                    nativeControls={false}
                    muted
                    resizeMode={ResizeMode.COVER}
                  />
                  <View style={styles.videoGridOverlay}>
                    <Ionicons name="play-circle" size={28} color={colors.white} />
                  </View>
                </Pressable>
              ) : null,
            )}
          </View>
        )}
      </ScrollView>

      <Modal visible={Boolean(activeVideo)} animationType="fade" transparent onRequestClose={() => setActiveVideo(null)}>
        <View style={styles.videoModalBackdrop}>
          <View style={styles.videoModalCard}>
            <Pressable style={styles.videoModalClose} onPress={() => setActiveVideo(null)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
            {activeVideo?.caption ? (
              <Text style={styles.videoModalCaption} numberOfLines={2}>{activeVideo.caption}</Text>
            ) : null}
            {activeVideo?.video_url ? (
              <VideoPlayer uri={activeVideo.video_url} style={styles.videoModalPlayer} nativeControls />
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}
