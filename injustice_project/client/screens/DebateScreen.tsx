import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

import { endDebate, fetchDebate, fetchDebateMessages, sendDebateMessage, sendHostHeartbeat, clearHostPresence } from '../api/social';
import { useDebateSocket } from '../api/websocket';
import { DebateHostPanel } from '../components/DebateHostPanel';
import { JitsiEmbed, type JitsiApi } from '../components/JitsiEmbed';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  recordingErrorMessage,
  startDebateRecording,
  type DebateRecorder,
  type DebateRecordingError,
} from '../shared/debateRecording';
import { confirmDestructive } from '../shared/confirm';
import type { Debate, DebateMessage } from '../shared/types';
import { radius, spacing, type ThemeColors } from '../shared/theme';

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
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
    recBadge: {
      color: '#fecaca',
      fontWeight: '800',
      fontSize: 10,
      backgroundColor: 'rgba(220,38,38,0.35)',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
    },
    topic: { color: colors.text, fontWeight: '700', fontSize: 16 },
    host: { color: colors.textDim, fontSize: 13 },
    main: { flex: 1 },
    recordingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colors.overlay,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.lg,
      zIndex: 20,
    },
    recordingTitle: { color: colors.white, fontWeight: '700', fontSize: 18, marginBottom: spacing.sm },
    recordingHint: { color: colors.textDim, fontSize: 14, textAlign: 'center', lineHeight: 20, maxWidth: 320 },
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
}

export function DebateScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [debate, setDebate] = useState<Debate | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<DebateMessage[]>([]);
  const [text, setText] = useState('');
  const [jitsiApi, setJitsiApi] = useState<JitsiApi | null>(null);
  const [ending, setEnding] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingReady, setRecordingReady] = useState(Platform.OS !== 'web');
  const [recordingPromptOpen, setRecordingPromptOpen] = useState(false);
  const [recordingError, setRecordingError] = useState<DebateRecordingError | null>(null);
  const recorderRef = useRef<DebateRecorder | null>(null);
  const endingRef = useRef(false);
  const presenceGenerationRef = useRef(0);
  const [hostInConference, setHostInConference] = useState(Platform.OS !== 'web');

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

  useEffect(() => {
    if (!isHost || !roomId || !debate?.is_active || !hostInConference) return;

    const generation = ++presenceGenerationRef.current;

    const sendHeartbeat = () => {
      if (generation !== presenceGenerationRef.current || endingRef.current) return;
      void sendHostHeartbeat(roomId).catch(() => {});
    };

    sendHeartbeat();

    const interval = setInterval(sendHeartbeat, 30_000);

    return () => {
      clearInterval(interval);
      if (generation === presenceGenerationRef.current) {
        presenceGenerationRef.current += 1;
      }
      if (!endingRef.current) {
        void clearHostPresence(roomId).catch(() => {});
      }
    };
  }, [isHost, roomId, debate?.is_active, hostInConference]);

  const beginRecording = useCallback(async () => {
    if (!isHost || Platform.OS !== 'web') return;

    setRecordingPromptOpen(true);
    setRecordingError(null);

    const result = await startDebateRecording();
    if (result.recorder) {
      result.recorder.onStopped(() => {
        if (endingRef.current) return;
        setRecording(false);
        setRecordingError('failed');
        recorderRef.current = null;
        Alert.alert(
          'Recording stopped',
          'Screen sharing ended. Tap Retry in Host controls to record again, or end the debate to save what was captured.',
        );
      });
      recorderRef.current = result.recorder;
      setRecording(true);
    } else if (result.error) {
      setRecordingError(result.error);
    }
    setRecordingPromptOpen(false);
    setRecordingReady(true);
  }, [isHost]);

  useEffect(() => {
    if (!jitsiApi || !isHost || !roomId || Platform.OS !== 'web') return;

    const onJoined = () => setHostInConference(true);
    const onLeft = () => {
      setHostInConference(false);
      if (endingRef.current) return;
      presenceGenerationRef.current += 1;
      void clearHostPresence(roomId).catch(() => {});
      if (recorderRef.current) {
        Alert.alert(
          'Save recording?',
          'You left the video room. Use Host controls → End debate for everyone to upload the recording.',
        );
      }
    };

    jitsiApi.addEventListener('videoConferenceJoined', onJoined);
    jitsiApi.addEventListener('videoConferenceLeft', onLeft);

    return () => {
      jitsiApi.removeEventListener('videoConferenceJoined', onJoined);
      jitsiApi.removeEventListener('videoConferenceLeft', onLeft);
    };
  }, [jitsiApi, isHost, roomId]);

  useEffect(() => {
    if (!isHost || Platform.OS !== 'web' || !hostInConference || recordingReady) return;
    void beginRecording();
  }, [isHost, hostInConference, recordingReady, beginRecording]);

  useEffect(() => {
    return () => {
      void recorderRef.current?.stop();
      recorderRef.current = null;
    };
  }, []);

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

  async function handleLeave() {
    if (!isHost || !debate?.is_active) {
      router.back();
      return;
    }

    const confirmed = await confirmDestructive(
      'Leave debate?',
      recording
        ? 'Leaving without ending will discard the recording. Use Host controls → End debate for everyone to save the video.'
        : 'The debate stays live until you end it from Host controls.',
      'Leave anyway',
    );
    if (confirmed) router.back();
  }

  async function handleEndDebate() {
    if (!roomId) return;
    setEnding(true);
    endingRef.current = true;
    presenceGenerationRef.current += 1;
    setHostInConference(false);
    try {
      const videoBlob = recorderRef.current ? await recorderRef.current.stop() : null;
      recorderRef.current = null;
      setRecording(false);
      await endDebate(roomId, videoBlob);
      Alert.alert('Debate ended', videoBlob ? 'Your recording was posted to the feed.' : 'The debate has ended.');
      router.back();
    } catch (e) {
      endingRef.current = false;
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
        <Pressable onPress={() => void handleLeave()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <View style={styles.liveRow}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
            {isHost ? <Text style={styles.hostBadge}>YOU ARE HOST</Text> : null}
            {isHost && recording ? (
              <Text style={styles.recBadge}>REC</Text>
            ) : null}
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
          displayName={user?.username ?? user?.first_name ?? 'Host'}
          isHost={isHost}
          onApiReady={handleJitsiApi}
        />

        {isHost && Platform.OS === 'web' && recordingPromptOpen ? (
          <View style={styles.recordingOverlay}>
            <Text style={styles.recordingTitle}>Starting recording…</Text>
            <Text style={styles.recordingHint}>
              Choose this browser tab and allow audio when prompted so the session can be saved to your feed.
            </Text>
          </View>
        ) : null}

        {isHost ? (
          <DebateHostPanel
            jitsiApi={jitsiApi}
            onEndDebate={handleEndDebate}
            onRetryRecording={recordingError ? () => void beginRecording() : undefined}
            ending={ending}
            recording={recording}
            recordingError={recordingError ? recordingErrorMessage(recordingError) : undefined}
          />
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
