import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

import { endDebate, fetchDebate, fetchDebateMessages, sendDebateMessage } from '../api/social';
import { useDebateSocket } from '../api/websocket';
import { DebateHostPanel } from '../components/DebateHostPanel';
import { JitsiEmbed, type JitsiApi } from '../components/JitsiEmbed';
import { useAuth } from '../contexts/AuthContext';
import type { Debate, DebateMessage } from '../shared/types';
import { colors, radius, spacing } from '../shared/theme';

export function DebateScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [debate, setDebate] = useState<Debate | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<DebateMessage[]>([]);
  const [text, setText] = useState('');
  const [jitsiApi, setJitsiApi] = useState<JitsiApi | null>(null);
  const [ending, setEnding] = useState(false);

  const roomId = debate?.id;
  const isHost = Boolean(debate?.is_host);

  const appendMessage = useCallback((msg: DebateMessage) => {
    setMessages((prev) => (prev.some((item) => item.id === msg.id) ? prev : [...prev, msg]));
  }, []);

  const { sendText } = useDebateSocket(roomId, appendMessage, Boolean(roomId && chatOpen));

  useEffect(() => {
    if (id) fetchDebate(Number(id)).then(setDebate);
  }, [id]);

  useEffect(() => {
    if (!roomId) return;
    fetchDebateMessages(roomId).then(setMessages);
  }, [roomId]);

  useEffect(() => {
    if (debate && !debate.is_active) {
      Alert.alert('Debate ended', 'This live debate has ended.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }
  }, [debate, router]);

  const handleJitsiApi = useCallback((api: JitsiApi | null) => {
    setJitsiApi(api);
  }, []);

  async function handleSend() {
    const msg = text.trim();
    if (!msg || !roomId) return;
    setText('');

    if (sendText(msg)) return;

    const sent = await sendDebateMessage(roomId, msg);
    appendMessage(sent);
  }

  async function handleEndDebate() {
    if (!roomId) return;
    setEnding(true);
    try {
      await endDebate(roomId);
      router.back();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not end debate');
    } finally {
      setEnding(false);
    }
  }

  if (!debate) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <View style={styles.liveRow}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
            {isHost ? <Text style={styles.hostBadge}>YOU ARE HOST</Text> : null}
          </View>
          <Text style={styles.topic} numberOfLines={1}>{debate.topic}</Text>
          <Text style={styles.host}>Host: {debate.creator_display_name}</Text>
        </View>
        <Pressable onPress={() => setChatOpen((open) => !open)} style={styles.chatToggle}>
          <Ionicons name={chatOpen ? 'chatbubbles' : 'chatbubbles-outline'} size={22} color={colors.text} />
        </Pressable>
      </View>

      <View style={styles.main}>
        <JitsiEmbed
          roomId={debate.id}
          displayName={user?.first_name || user?.username}
          isHost={isHost}
          onApiReady={handleJitsiApi}
        />

        {isHost ? (
          <DebateHostPanel jitsiApi={jitsiApi} onEndDebate={handleEndDebate} ending={ending} />
        ) : null}

        {chatOpen ? (
          <KeyboardAvoidingView
            style={styles.chatPanel}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <Text style={styles.chatTitle}>Debate chat</Text>
            <FlatList
              data={messages}
              keyExtractor={(item) => String(item.id)}
              style={styles.chatList}
              contentContainerStyle={styles.chatMessages}
              renderItem={({ item }) => (
                <View style={[styles.chatBubble, item.is_me ? styles.chatBubbleMe : styles.chatBubbleThem]}>
                  {!item.is_me ? (
                    <Text style={styles.chatAuthor}>{item.display_name ?? item.sender_username}</Text>
                  ) : null}
                  <Text style={styles.chatText}>{item.text}</Text>
                </View>
              )}
            />
            <View style={styles.chatInputBar}>
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder="Say something..."
                placeholderTextColor={colors.textDim}
                style={styles.chatInput}
              />
              <Pressable onPress={handleSend} style={styles.chatSend}>
                <Ionicons name="send" size={18} color={colors.white} />
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgSecondary },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgSecondary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  backBtn: { padding: 4 },
  headerCenter: { flex: 1 },
  chatToggle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceHover,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444' },
  liveText: { color: '#ef4444', fontWeight: '800', fontSize: 11 },
  hostBadge: {
    color: '#a5b4fc',
    fontWeight: '800',
    fontSize: 10,
    backgroundColor: 'rgba(99,102,241,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  topic: { color: colors.text, fontWeight: '700', fontSize: 16 },
  host: { color: colors.textDim, fontSize: 13 },
  main: { flex: 1 },
  chatPanel: {
    height: 240,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  chatTitle: {
    color: colors.textDim,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  chatList: { flex: 1 },
  chatMessages: { padding: spacing.md, gap: spacing.sm },
  chatBubble: {
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: '85%',
  },
  chatBubbleMe: { alignSelf: 'flex-end', backgroundColor: colors.brand },
  chatBubbleThem: { alignSelf: 'flex-start', backgroundColor: colors.surfaceHover },
  chatAuthor: { color: colors.textDim, fontSize: 11, marginBottom: 2 },
  chatText: { color: colors.text, fontSize: 14 },
  chatInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  chatInput: {
    flex: 1,
    backgroundColor: colors.surfaceHover,
    borderRadius: radius.xl,
    paddingHorizontal: 14,
    paddingVertical: 8,
    color: colors.text,
    fontSize: 14,
  },
  chatSend: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
