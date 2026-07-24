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

import { endDebate, fetchDebate, fetchDebateMessages, sendDebateMessage, sendHostHeartbeat, clearHostPresence } from '../api/social';
import { useDebateSocket } from '../api/websocket';
import { DebateHostPanel } from '../components/DebateHostPanel';
import { JitsiEmbed, type JitsiApi } from '../components/JitsiEmbed';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  clearRecordingBackup,
  isDebateRecordingSupported,
  loadRecordingBackup,
  recordingErrorMessage,
  startDebateRecording,
  type DebateRecorder,
  type DebateRecordingError,
} from '../shared/debateRecording';
import { confirmDestructive, showAlert } from '../shared/confirm';
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
      backgroundColor: 'rgba(0,0,0,0.88)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.lg,
      zIndex: 40,
      gap: spacing.md,
    },
    recordingTitle: { color: colors.white, fontWeight: '800', fontSize: 20, textAlign: 'center' },
    recordingHint: {
      color: '#d1d5db',
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 21,
      maxWidth: 360,
    },
    recordingErrorText: {
      color: '#fca5a5',
      fontSize: 13,
      textAlign: 'center',
      lineHeight: 19,
      maxWidth: 360,
    },
    recordingPrimaryBtn: {
      backgroundColor: '#dc2626',
      borderRadius: radius.md,
      paddingVertical: 14,
      paddingHorizontal: 22,
      minWidth: 240,
      alignItems: 'center',
    },
    recordingPrimaryBtnDisabled: { opacity: 0.6 },
    recordingPrimaryBtnText: { color: colors.white, fontWeight: '800', fontSize: 15 },
    recordingSecondaryBtn: {
      paddingVertical: 10,
      paddingHorizontal: 16,
    },
    recordingSecondaryBtnText: { color: '#9ca3af', fontWeight: '600', fontSize: 13 },
    toast: {
      position: 'absolute',
      top: spacing.md,
      alignSelf: 'center',
      backgroundColor: 'rgba(220,38,38,0.95)',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: radius.md,
      zIndex: 50,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    toastText: { color: colors.white, fontWeight: '700', fontSize: 13 },
    endingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colors.overlay,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.lg,
      zIndex: 30,
      gap: spacing.md,
    },
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
  const [endingPhase, setEndingPhase] = useState<'closing' | 'recording' | 'uploading' | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordingPaused, setRecordingPaused] = useState(false);
  const [recordingGateOpen, setRecordingGateOpen] = useState(false);
  const [recordingBusy, setRecordingBusy] = useState(false);
  const [recordingRequiredError, setRecordingRequiredError] = useState<DebateRecordingError | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const recorderRef = useRef<DebateRecorder | null>(null);
  const recordingBusyRef = useRef(false);
  const endingRef = useRef(false);
  const presenceGenerationRef = useRef(0);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Evaluate in-component (not module scope) so SSR / first paint cannot permanently disable capture.
  const recordingSupported = isDebateRecordingSupported();
  // Mobile / unsupported: skip gate. Web hosts must record.
  const [hostInConference, setHostInConference] = useState(() => !isDebateRecordingSupported());

  const roomId = debate?.id;
  const isHost = Boolean(debate?.is_host);
  const mustRecord = isHost && recordingSupported;

  const appendMessage = useCallback((msg: DebateMessage) => {
    setMessages((prev) => (prev.some((item) => item.id === msg.id) ? prev : [...prev, msg]));
  }, []);

  const { sendText } = useDebateSocket(roomId, appendMessage, Boolean(roomId && chatOpen));

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 3500);
  }, []);

  useEffect(() => {
    if (id) fetchDebate(Number(id)).then(setDebate);
  }, [id]);

  useEffect(() => {
    if (!roomId) return;
    fetchDebateMessages(roomId).then(setMessages);
  }, [roomId]);

  useEffect(() => {
    if (debate && !debate.is_active && !endingRef.current) {
      showAlert('Debate ended', 'This live debate has ended.');
      router.back();
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

  const attachRecorder = useCallback(
    (recorder: DebateRecorder) => {
      recorder.onStopped(() => {
        if (endingRef.current) return;
        setRecording(false);
        setRecordingPaused(false);
        setRecordingRequiredError('stopped');
        recorderRef.current = null;
        setRecordingGateOpen(true);
      });
      recorderRef.current = recorder;
      setRecording(true);
      setRecordingPaused(false);
      setRecordingRequiredError(null);
      setRecordingGateOpen(false);
      showToast('Recording started — keep this tab selected');
    },
    [showToast],
  );

  /**
   * Start tab capture. Auto-invoked on videoConferenceJoined; browsers that require a
   * user gesture will deny — then the blocking "Recording required" modal + Retry owns recovery.
   */
  const beginRecording = useCallback(async () => {
    if (!isHost || !recordingSupported || !roomId) return;
    if (recordingBusyRef.current) return;

    recordingBusyRef.current = true;
    setRecordingBusy(true);
    setRecordingRequiredError(null);
    setRecordingGateOpen(true);

    // Stop any prior half-dead recorder before retrying.
    if (recorderRef.current) {
      try {
        await recorderRef.current.stop();
      } catch {
        /* ignore */
      }
      recorderRef.current = null;
      setRecording(false);
    }

    const result = await startDebateRecording(roomId);
    if (result.recorder) {
      attachRecorder(result.recorder);
    } else {
      setRecording(false);
      setRecordingRequiredError(result.error ?? 'failed');
      // Never continue silently — keep the host behind the mandatory gate.
      setRecordingGateOpen(true);
    }
    recordingBusyRef.current = false;
    setRecordingBusy(false);
  }, [isHost, roomId, attachRecorder, recordingSupported]);

  const beginRecordingRef = useRef(beginRecording);
  beginRecordingRef.current = beginRecording;

  useEffect(() => {
    if (!jitsiApi || !isHost || !roomId || !recordingSupported) return;

    const onJoined = () => {
      setHostInConference(true);
      if (recorderRef.current || endingRef.current) return;
      // Immediate capture attempt; on deny/fail the blocking Retry gate stays up.
      setRecordingGateOpen(true);
      void beginRecordingRef.current();
    };
    const onLeft = () => {
      setHostInConference(false);
      if (endingRef.current) return;
      presenceGenerationRef.current += 1;
      void clearHostPresence(roomId).catch(() => {});
      if (recorderRef.current) {
        showAlert(
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
  }, [jitsiApi, isHost, roomId, recordingSupported]);

  // Keep the mandatory gate open whenever a web host is in-conference without an active recorder.
  useEffect(() => {
    if (!mustRecord || recording || ending || !hostInConference) return;
    setRecordingGateOpen(true);
  }, [mustRecord, hostInConference, recording, ending]);

  useEffect(() => {
    return () => {
      void recorderRef.current?.stop();
      recorderRef.current = null;
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
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

  function navigateToReview(params: Record<string, string>) {
    router.replace({
      pathname: '/(app)/debate/review',
      params: {
        roomId: String(roomId),
        topic: debate?.topic ?? '',
        ...params,
      },
    });
  }

  function disposeJitsi() {
    if (!jitsiApi) return;
    try {
      jitsiApi.executeCommand('hangup');
    } catch {
      /* conference may already be closing */
    }
    try {
      jitsiApi.dispose();
    } catch {
      /* ignore dispose errors */
    }
    setJitsiApi(null);
  }

  async function finishEndDebate(videoBlob: Blob | null, capturedRecordingError: DebateRecordingError | null) {
    if (!roomId) return;

    setEndingPhase('uploading');
    try {
      const result = await endDebate(roomId, videoBlob);
      const draft = result.draft;
      const postId = draft?.id ?? result.post_id;
      const previewUrl =
        Platform.OS === 'web' && videoBlob && typeof URL !== 'undefined'
          ? URL.createObjectURL(videoBlob)
          : draft?.video_url ?? '';

      if (videoBlob) {
        void clearRecordingBackup(roomId);
      }

      navigateToReview({
        postId: postId ? String(postId) : '',
        previewUrl,
        videoUrl: draft?.video_url ?? '',
        hasRecording: videoBlob ? '1' : '0',
        recordingError: capturedRecordingError ?? '',
      });
    } catch (e) {
      // Keep local backup so review can still play the blob URL we create.
      const previewUrl =
        Platform.OS === 'web' && videoBlob && typeof URL !== 'undefined'
          ? URL.createObjectURL(videoBlob)
          : '';
      navigateToReview({
        postId: '',
        previewUrl,
        videoUrl: '',
        hasRecording: videoBlob ? '1' : '0',
        recordingError: capturedRecordingError ?? '',
        uploadError: e instanceof Error ? e.message : 'Could not end debate',
      });
    }
  }

  async function handleEndDebate() {
    if (!roomId) return;

    if (mustRecord && !recording) {
      const backup = await loadRecordingBackup(roomId);
      if (!backup || backup.size === 0) {
        setRecordingGateOpen(true);
        showAlert(
          'Recording required',
          'Start screen recording before ending. Tap “Retry screen recording”, choose This tab, and enable Share tab audio.',
        );
        return;
      }
    }

    setEnding(true);
    setEndingPhase('closing');
    endingRef.current = true;
    presenceGenerationRef.current += 1;
    setHostInConference(false);
    setRecordingGateOpen(false);
    disposeJitsi();

    const capturedRecordingError = recordingRequiredError;

    try {
      setEndingPhase('recording');
      let videoBlob = recorderRef.current ? await recorderRef.current.stop() : null;
      recorderRef.current = null;
      setRecording(false);
      setRecordingPaused(false);

      if (!videoBlob || videoBlob.size === 0) {
        videoBlob = await loadRecordingBackup(roomId);
      }

      const finalError: DebateRecordingError | null =
        videoBlob && videoBlob.size > 0
          ? null
          : capturedRecordingError ?? (mustRecord ? 'empty' : null);

      await finishEndDebate(videoBlob && videoBlob.size > 0 ? videoBlob : null, finalError);
    } catch (e) {
      navigateToReview({
        postId: '',
        previewUrl: '',
        videoUrl: '',
        hasRecording: '0',
        recordingError: capturedRecordingError ?? 'failed',
        uploadError: e instanceof Error ? e.message : 'Could not end debate',
      });
    }
  }

  function handleToggleRecordingPause() {
    const recorder = recorderRef.current;
    if (!recorder) return;

    if (recorder.isPaused()) {
      recorder.resume();
      setRecordingPaused(false);
    } else {
      recorder.pause();
      setRecordingPaused(true);
    }
  }

  if (!debate) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  const showRecordingGate = mustRecord && recordingGateOpen && !ending && !recording;

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
              <Text style={styles.recBadge}>{recordingPaused ? 'PAUSED' : 'REC'}</Text>
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
        {toast ? (
          <View style={styles.toast}>
            <Ionicons name="radio-button-on" size={14} color="#fff" />
            <Text style={styles.toastText}>{toast}</Text>
          </View>
        ) : null}

        {!ending ? (
          <JitsiEmbed
            roomId={debate.id}
            displayName={user?.username ?? user?.first_name ?? 'Host'}
            isHost={isHost}
            onApiReady={handleJitsiApi}
          />
        ) : null}

        {ending ? (
          <View style={styles.endingOverlay}>
            <ActivityIndicator size="large" color={colors.brand} />
            <Text style={styles.recordingTitle}>
              {endingPhase === 'closing'
                ? 'Closing video room…'
                : endingPhase === 'recording'
                  ? 'Saving recording…'
                  : 'Uploading draft…'}
            </Text>
            <Text style={styles.recordingHint}>
              Hang tight — you will review your debate next.
            </Text>
          </View>
        ) : null}

        {showRecordingGate ? (
          <View style={styles.recordingOverlay}>
            <Ionicons name="videocam" size={40} color="#f87171" />
            <Text style={styles.recordingTitle}>Recording required — share this tab</Text>
            <Text style={styles.recordingHint}>
              Every host debate must be recorded. When the browser prompt appears, choose{' '}
              <Text style={{ fontWeight: '800', color: '#fff' }}>This tab</Text>
              {' '}(or Chrome Tab) and turn on{' '}
              <Text style={{ fontWeight: '800', color: '#fff' }}>Share tab audio</Text>
              {' '}— then click Share / Allow. Do not leave until a red REC badge shows.
            </Text>
            {recordingRequiredError ? (
              <Text style={styles.recordingErrorText}>{recordingErrorMessage(recordingRequiredError)}</Text>
            ) : recordingBusy ? (
              <Text style={styles.recordingErrorText}>
                Waiting for the browser screen-share prompt…
              </Text>
            ) : null}
            <Pressable
              style={[styles.recordingPrimaryBtn, recordingBusy && styles.recordingPrimaryBtnDisabled]}
              disabled={recordingBusy}
              onPress={() => void beginRecording()}
            >
              {recordingBusy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.recordingPrimaryBtnText}>
                  {recordingRequiredError ? 'Retry' : 'Start screen recording'}
                </Text>
              )}
            </Pressable>
            <Text style={styles.recordingSecondaryBtnText}>
              If no prompt appeared, click the button above — browsers require a click to share this tab.
            </Text>
          </View>
        ) : null}

        {isHost ? (
          <DebateHostPanel
            jitsiApi={jitsiApi}
            onEndDebate={handleEndDebate}
            onRetryRecording={mustRecord && !recording ? () => void beginRecording() : undefined}
            onToggleRecordingPause={recording ? handleToggleRecordingPause : undefined}
            ending={ending}
            recording={recording}
            recordingPaused={recordingPaused}
            recordingError={recordingRequiredError ? recordingErrorMessage(recordingRequiredError) : undefined}
            recordingRequired={mustRecord && !recording}
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
