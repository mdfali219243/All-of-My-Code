import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fetchMessages, sendMessage } from '../api/inbox';
import { useInboxSocket } from '../api/websocket';
import { Avatar } from '../components/Avatar';
import { EmptyState } from '../components/EmptyState';
import { useTheme } from '../contexts/ThemeContext';
import { showAlert } from '../shared/confirm';
import { formatMessageTime } from '../shared/timeAgo';
import type { DirectMessage } from '../shared/types';
import { radius, spacing, type ThemeColors } from '../shared/theme';

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bgSecondary },
    flex: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      padding: spacing.md,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backBtn: { padding: 4 },
    headerText: { flex: 1 },
    headerName: { color: colors.text, fontWeight: '700', fontSize: 16 },
    headerHandle: { color: colors.textDim, fontSize: 13, marginTop: 1 },
    messages: { padding: spacing.md, paddingBottom: spacing.lg, flexGrow: 1 },
    bubbleWrap: { marginBottom: spacing.sm, maxWidth: '80%' },
    bubbleWrapMe: { alignSelf: 'flex-end' },
    bubbleWrapThem: { alignSelf: 'flex-start' },
    bubble: { borderRadius: radius.lg, paddingHorizontal: 14, paddingVertical: 10 },
    bubbleMe: { backgroundColor: colors.brand },
    bubbleThem: { backgroundColor: colors.surfaceHover },
    bubbleText: { color: colors.text, fontSize: 15, lineHeight: 20 },
    bubbleTime: { color: colors.textDim, fontSize: 11, marginTop: 4 },
    bubbleTimeMe: { color: 'rgba(255,255,255,0.75)', textAlign: 'right' },
    inputBar: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: spacing.sm,
      padding: spacing.md,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    input: {
      flex: 1,
      backgroundColor: colors.surfaceHover,
      borderRadius: radius.xl,
      paddingHorizontal: 16,
      paddingVertical: 10,
      color: colors.text,
      fontSize: 15,
      maxHeight: 100,
    },
    sendBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.brand,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sendBtnDisabled: { opacity: 0.5 },
    loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  });
}

export function ChatScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  const appendMessage = useCallback((msg: DirectMessage) => {
    setMessages((prev) => {
      if (prev.some((item) => item.id === msg.id)) return prev;
      return [...prev, msg];
    });
  }, []);

  const { sendText } = useInboxSocket(username, appendMessage);

  useEffect(() => {
    if (!username) return;
    setMessages([]);
    setLoading(true);
    fetchMessages(username, 0)
      .then((initial) => {
        if (initial.length) setMessages(initial);
      })
      .catch((e) => {
        showAlert('Chat', e instanceof Error ? e.message : 'Could not load messages');
      })
      .finally(() => setLoading(false));
  }, [username]);

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(app)/inbox');
  }

  async function handleSend() {
    const msg = text.trim();
    if (!msg || !username || sending) return;
    setText('');
    setSending(true);

    try {
      if (sendText(msg)) {
        setTimeout(() => listRef.current?.scrollToEnd(), 100);
        return;
      }
      const sent = await sendMessage(username, msg);
      appendMessage(sent);
      setTimeout(() => listRef.current?.scrollToEnd(), 100);
    } catch (e) {
      setText(msg);
      showAlert('Message failed', e instanceof Error ? e.message : 'Could not send');
    } finally {
      setSending(false);
    }
  }

  const displayName =
    messages.find((m) => !m.is_me)?.sender_username ??
    username ??
    'Chat';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Avatar name={displayName} size={36} />
        <View style={styles.headerText}>
          <Text style={styles.headerName}>{displayName}</Text>
          <Text style={styles.headerHandle}>@{username}</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={colors.brand} />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.messages}
            renderItem={({ item }) => (
              <View style={[styles.bubbleWrap, item.is_me ? styles.bubbleWrapMe : styles.bubbleWrapThem]}>
                <View style={[styles.bubble, item.is_me ? styles.bubbleMe : styles.bubbleThem]}>
                  <Text style={[styles.bubbleText, item.is_me && { color: colors.white }]}>{item.text}</Text>
                  {item.created_at ? (
                    <Text style={[styles.bubbleTime, item.is_me && styles.bubbleTimeMe]}>
                      {formatMessageTime(item.created_at)}
                    </Text>
                  ) : null}
                </View>
              </View>
            )}
            onContentSizeChange={() => listRef.current?.scrollToEnd()}
            ListEmptyComponent={
              <EmptyState
                compact
                icon="chatbubble-outline"
                title="Say hi"
                subtitle={`Start the conversation with @${username}.`}
              />
            }
          />
        )}

        <View style={styles.inputBar}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Message..."
            placeholderTextColor={colors.textDim}
            style={styles.input}
            multiline
            editable={!sending}
          />
          <Pressable
            onPress={() => void handleSend()}
            style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
            disabled={!text.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Ionicons name="send" size={22} color={colors.white} />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
