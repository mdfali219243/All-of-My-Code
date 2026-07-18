import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiError } from '../api/client';
import { fetchSearch } from '../api/search';
import { Avatar } from '../components/Avatar';
import { useTheme } from '../contexts/ThemeContext';
import type { Post, User } from '../shared/types';
import { radius, spacing, type ThemeColors } from '../shared/theme';

type Tab = 'people' | 'videos';

function displayName(user: User): string {
  return user.first_name?.trim() || user.username;
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.bgSecondary,
    },
    header: {
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.sm,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    backBtn: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    backText: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '600',
    },
    searchWrap: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceMuted,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.sm,
      gap: spacing.xs,
    },
    searchInput: {
      flex: 1,
      color: colors.text,
      fontSize: 16,
      paddingVertical: 10,
    },
    tabs: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 10,
      borderRadius: radius.md,
      backgroundColor: colors.surfaceMuted,
    },
    tabActive: {
      backgroundColor: colors.accentSoft,
    },
    tabText: {
      color: colors.textDim,
      fontWeight: '700',
      fontSize: 14,
    },
    tabTextActive: {
      color: colors.brandLight,
    },
    list: {
      paddingBottom: spacing.xxl,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    rowText: {
      flex: 1,
    },
    name: {
      color: colors.text,
      fontWeight: '700',
      fontSize: 16,
    },
    username: {
      color: colors.textDim,
      fontSize: 14,
      marginTop: 2,
    },
    caption: {
      color: colors.text,
      fontSize: 15,
      lineHeight: 20,
    },
    author: {
      color: colors.textDim,
      fontSize: 13,
      marginTop: 4,
    },
    thumb: {
      width: 72,
      height: 72,
      borderRadius: radius.md,
      backgroundColor: colors.bgSecondary,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    thumbImage: {
      width: '100%',
      height: '100%',
    },
    empty: {
      padding: spacing.xl,
      alignItems: 'center',
    },
    emptyText: {
      color: colors.textDim,
      fontSize: 15,
      textAlign: 'center',
    },
    hint: {
      padding: spacing.lg,
      color: colors.textDim,
      fontSize: 15,
      textAlign: 'center',
    },
    loadingWrap: {
      paddingTop: spacing.xl,
      alignItems: 'center',
    },
    errorText: {
      color: colors.brandLight,
      fontSize: 15,
      textAlign: 'center',
      lineHeight: 22,
    },
  });
}

export function SearchScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [tab, setTab] = useState<Tab>('people');
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!debouncedQuery) {
      setUsers([]);
      setPosts([]);
      setLoading(false);
      setError(null);
      return;
    }

    if (debouncedQuery.length < 2) {
      setUsers([]);
      setPosts([]);
      setLoading(false);
      setError('Enter at least 2 characters to search.');
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchSearch(debouncedQuery)
      .then((data) => {
        if (!cancelled) {
          setUsers(data.users);
          setPosts(data.posts);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setUsers([]);
          setPosts([]);
          if (err instanceof ApiError && err.status === 404) {
            setError('Search is updating — try again in a few minutes.');
          } else if (err instanceof ApiError && err.status === 401) {
            setError('Sign in to search for people and videos.');
          } else {
            setError('Search failed. Check your connection and try again.');
          }
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(app)');
    }
  }

  function renderPeopleItem({ item }: { item: User }) {
    return (
      <Pressable
        style={styles.row}
        onPress={() => router.push(`/(app)/profile/${item.username}`)}
      >
        <Avatar name={displayName(item)} size={48} />
        <View style={styles.rowText}>
          <Text style={styles.name}>{displayName(item)}</Text>
          <Text style={styles.username}>@{item.username}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
      </Pressable>
    );
  }

  function renderVideoItem({ item }: { item: Post }) {
    const previewUrl = item.image_url;
    return (
      <Pressable
        style={styles.row}
        onPress={() => router.push(`/(app)/profile/${item.username}`)}
      >
        <View style={styles.thumb}>
          {previewUrl ? (
            <Image source={{ uri: previewUrl }} style={styles.thumbImage} contentFit="cover" />
          ) : (
            <Ionicons name="videocam" size={28} color={colors.textDim} />
          )}
        </View>
        <View style={styles.rowText}>
          <Text style={styles.caption} numberOfLines={2}>
            {item.caption?.trim() || 'Video post'}
          </Text>
          <Text style={styles.author}>
            {item.display_name} · @{item.username}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
      </Pressable>
    );
  }

  const showPeople = tab === 'people';
  const data = showPeople ? users : posts;
  const hasQuery = debouncedQuery.length > 0;

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <View style={styles.topRow}>
          <Pressable onPress={handleBack} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
            <Text style={styles.backText}>Back</Text>
          </Pressable>
        </View>

        <View style={styles.searchWrap}>
          <Ionicons name="search" size={20} color={colors.textDim} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search people or videos"
            placeholderTextColor={colors.textDim}
            style={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {query.length > 0 ? (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={20} color={colors.textDim} />
            </Pressable>
          ) : null}
        </View>

        <View style={[styles.tabs, { marginTop: spacing.sm }]}>
          <Pressable
            style={[styles.tab, showPeople && styles.tabActive]}
            onPress={() => setTab('people')}
          >
            <Text style={[styles.tabText, showPeople && styles.tabTextActive]}>People</Text>
          </Pressable>
          <Pressable
            style={[styles.tab, !showPeople && styles.tabActive]}
            onPress={() => setTab('videos')}
          >
            <Text style={[styles.tabText, !showPeople && styles.tabTextActive]}>Videos</Text>
          </Pressable>
        </View>
      </SafeAreaView>

      {!hasQuery ? (
        <Text style={styles.hint}>Type to search for people or video posts.</Text>
      ) : loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : error ? (
        <View style={styles.empty}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => (showPeople ? `user-${(item as User).id}` : `post-${(item as Post).id}`)}
          contentContainerStyle={styles.list}
          renderItem={showPeople ? renderPeopleItem : renderVideoItem}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                {showPeople ? 'No people found' : 'No videos found'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
