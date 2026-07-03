import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
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
import type { DirectMessage } from '../shared/types';
import { colors, radius, spacing } from '../shared/theme';

export function ChatScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const router = useRouter();
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [text, setText] = useState('');
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
    fetchMessages(username, 0).then((initial) => {
      if (initial.length) setMessages(initial);
    });
  }, [username]);

  async function handleSend() {
    const msg = text.trim();
    if (!msg || !username) return;
    setText('');

    if (sendText(msg)) {
      setTimeout(() => listRef.current?.scrollToEnd(), 100);
      return;
    }

    const sent = await sendMessage(username, msg);
    appendMessage(sent);
    setTimeout(() => listRef.current?.scrollToEnd(), 100);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Avatar name={username ?? 'U'} size={36} />
        <Text style={styles.headerName}>@{username}</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.messages}
          renderItem={({ item }) => (
            <View style={[styles.bubbleWrap, item.is_me ? styles.bubbleWrapMe : styles.bubbleWrapThem]}>
              <View style={[styles.bubble, item.is_me ? styles.bubbleMe : styles.bubbleThem]}>
                <Text style={styles.bubbleText}>{item.text}</Text>
              </View>
            </View>
          )}
          onContentSizeChange={() => listRef.current?.scrollToEnd()}
        />

        <View style={styles.inputBar}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Message..."
            placeholderTextColor={colors.textDim}
            style={styles.input}
            multiline
          />
          <Pressable onPress={handleSend} style={styles.sendBtn}>
            <Ionicons name="send" size={22} color={colors.white} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  headerName: { color: colors.text, fontWeight: '700', fontSize: 16 },
  messages: { padding: spacing.md, paddingBottom: spacing.lg },
  bubbleWrap: { marginBottom: spacing.sm, maxWidth: '80%' },
  bubbleWrapMe: { alignSelf: 'flex-end' },
  bubbleWrapThem: { alignSelf: 'flex-start' },
  bubble: { borderRadius: radius.lg, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleMe: { backgroundColor: colors.brand },
  bubbleThem: { backgroundColor: colors.surfaceHover },
  bubbleText: { color: colors.text, fontSize: 15, lineHeight: 20 },
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
});
