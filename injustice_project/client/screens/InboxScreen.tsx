import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
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
import type { InboxContact, InboxConversation } from '../shared/types';
import { colors, radius, spacing } from '../shared/theme';

export function InboxScreen() {
  const router = useRouter();
  const [conversations, setConversations] = useState<InboxConversation[]>([]);
  const [contacts, setContacts] = useState<InboxContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const data = await fetchInbox();
    setConversations(data.conversations);
    setContacts(data.contacts);
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  useInboxListSocket(() => {
    load();
  }, !loading);

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
        data={[...conversations.map((c) => ({ ...c, type: 'chat' as const })), ...contacts.map((c) => ({ ...c, type: 'contact' as const }))]}
        keyExtractor={(item) => `${item.type}-${item.username}`}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={colors.brand} />
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() => router.push(`/(app)/inbox/${item.username}`)}
          >
            <Avatar name={item.display_name} size={48} />
            <View style={styles.rowText}>
              <View style={styles.rowTop}>
                <Text style={styles.name}>{item.display_name}</Text>
                {'unread_count' in item && item.unread_count > 0 ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.unread_count}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.preview} numberOfLines={1}>
                {'last_message' in item && item.last_message
                  ? item.last_message
                  : item.connection_label ?? 'Start a conversation'}
              </Text>
            </View>
          </Pressable>
        )}
        ListHeaderComponent={
          conversations.length ? <Text style={styles.section}>Chats</Text> : null
        }
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
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
    paddingVertical: spacing.sm,
  },
  list: { paddingBottom: spacing.xxl },
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
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { color: colors.text, fontWeight: '700', fontSize: 16 },
  preview: { color: colors.textDim, fontSize: 14, marginTop: 4 },
  badge: {
    backgroundColor: colors.brand,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { color: colors.white, fontSize: 11, fontWeight: '800' },
});
