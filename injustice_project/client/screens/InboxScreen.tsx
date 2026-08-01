import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { fetchInbox } from '../api/inbox';
import { useInboxListSocket } from '../api/websocket';
import { AppHeader } from '../components/AppHeader';
import { Avatar } from '../components/Avatar';
import { EmptyState } from '../components/EmptyState';
import { useInboxBadge } from '../contexts/InboxBadgeContext';
import { useTheme } from '../contexts/ThemeContext';
import { timeAgo } from '../shared/timeAgo';
import type { InboxContact, InboxConversation } from '../shared/types';
import { radius, spacing, type ThemeColors } from '../shared/theme';

type InboxRow =
  | { kind: 'header'; title: string; key: string }
  | { kind: 'chat'; key: string; data: InboxConversation }
  | { kind: 'contact'; key: string; data: InboxContact };

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bgSecondary },
    loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgSecondary },
    headerBlock: {
      padding: spacing.md,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: { color: colors.text, fontSize: 24, fontWeight: '800' },
    subtitle: { color: colors.textDim, marginTop: 4 },
    section: {
      color: colors.textDim,
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
    },
    list: { paddingBottom: spacing.xxl, flexGrow: 1 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    rowText: { flex: 1 },
    rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
    name: { color: colors.text, fontWeight: '700', fontSize: 16, flex: 1 },
    time: { color: colors.textDim, fontSize: 12 },
    preview: { color: colors.textDim, fontSize: 14, marginTop: 4 },
    badge: {
      backgroundColor: colors.brand,
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 6,
      marginLeft: spacing.sm,
    },
    badgeText: { color: colors.white, fontSize: 11, fontWeight: '800' },
    emptyWrap: { padding: spacing.md },
  });
}

export function InboxScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { refreshFromConversations } = useInboxBadge();
  const [conversations, setConversations] = useState<InboxConversation[]>([]);
  const [contacts, setContacts] = useState<InboxContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const data = await fetchInbox();
    setConversations(data.conversations);
    setContacts(data.contacts);
    refreshFromConversations(data.conversations);
  }, [refreshFromConversations]);

  useFocusEffect(
    useCallback(() => {
      load().finally(() => setLoading(false));
    }, [load]),
  );

  useInboxListSocket(() => {
    void load();
  }, !loading);

  const rows = useMemo<InboxRow[]>(() => {
    const next: InboxRow[] = [];
    if (conversations.length) {
      next.push({ kind: 'header', title: 'Chats', key: 'h-chats' });
      for (const c of conversations) {
        next.push({ kind: 'chat', key: `chat-${c.username}`, data: c });
      }
    }
    if (contacts.length) {
      next.push({ kind: 'header', title: 'People you can message', key: 'h-people' });
      for (const c of contacts) {
        next.push({ kind: 'contact', key: `contact-${c.username}`, data: c });
      }
    }
    return next;
  }, [conversations, contacts]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader activeTab="inbox" />

      <View style={styles.headerBlock}>
        <Text style={styles.title}>Inbox</Text>
        <Text style={styles.subtitle}>Message followers & friends</Text>
      </View>

      <FlatList
        data={rows}
        keyExtractor={(item) => item.key}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              try {
                await load();
              } finally {
                setRefreshing(false);
              }
            }}
            tintColor={colors.brand}
          />
        }
        renderItem={({ item }) => {
          if (item.kind === 'header') {
            return <Text style={styles.section}>{item.title}</Text>;
          }

          const person = item.data;
          const unread = item.kind === 'chat' ? item.data.unread_count : 0;
          const preview =
            item.kind === 'chat' && item.data.last_message
              ? item.data.last_message
              : person.connection_label ?? 'Start a conversation';
          const time =
            item.kind === 'chat' && item.data.last_message_time
              ? timeAgo(item.data.last_message_time)
              : '';

          return (
            <Pressable
              style={styles.row}
              onPress={() => router.push(`/(app)/inbox/${person.username}`)}
            >
              <Avatar name={person.display_name} size={48} />
              <View style={styles.rowText}>
                <View style={styles.rowTop}>
                  <Text style={styles.name} numberOfLines={1}>{person.display_name}</Text>
                  {time ? <Text style={styles.time}>{time}</Text> : null}
                </View>
                <View style={styles.rowTop}>
                  <Text style={styles.preview} numberOfLines={1}>{preview}</Text>
                  {unread > 0 ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{unread}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <EmptyState
              icon="chatbubbles-outline"
              title="No messages yet"
              subtitle="Follow people or join debates, then start a conversation from Search or their profile."
              actionLabel="Find people"
              onAction={() => router.push('/(app)/search')}
            />
          </View>
        }
        contentContainerStyle={styles.list}
      />
    </View>
  );
}
