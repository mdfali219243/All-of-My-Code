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
  const [recordingError, setRecordingError] = useState<DebateRecordingError | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const recorderRef = useRef<DebateRecorder | null>(null);
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
        setRecordingError('failed');
        recorderRef.current = null;
        setRecordingGateOpen(true);
        showAlert(
          'Recording stopped',
          'Screen sharing ended. You must start recording again before ending the debate, or your session will have no video.',
        );
      });
      recorderRef.current = recorder;
      setRecording(true);
      setRecordingPaused(false);
      setRecordingError(null);
      setRecordingGateOpen(false);
      showToast('Recording started — keep this tab selected');
    },
    [showToast],
  );

  /** Must be invoked from a button click (user gesture) — browsers block getDisplayMedia otherwise. */
  const beginRecording = useCallback(async () => {
    if (!isHost || !recordingSupported || !roomId) return;
    if (recordingBusy) return;

    setRecordingBusy(true);
    setRecordingError(null);

    // Stop any prior half-dead recorder before retrying.
    if (recorderRef.current) {
      try {
        await recorderRef.current.stop();
      } catch {
        /* ignore */
      }
      recorderRef.current = null;
    }

    const result = await startDebateRecording(roomId);
    if (result.recorder) {
      attachRecorder(result.recorder);
    } else if (result.error) {
      setRecordingError(result.error);
      setRecording(false);
      setRecordingGateOpen(true);
    }
    setRecordingBusy(false);
  }, [isHost, roomId, recordingBusy, attachRecorder, recordingSupported]);

  useEffect(() => {
    if (!jitsiApi || !isHost || !roomId || !recordingSupported) return;

    const onJoined = () => {
      setHostInConference(true);
      // Open mandatory gate — do NOT auto-call getDisplayMedia (needs user gesture).
      if (!recorderRef.current) {
        setRecordingGateOpen(true);
      }
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

  // Open the mandatory gate once the host is in-conference (or Jitsi API is ready as a fallback).
  useEffect(() => {
    if (!mustRecord || recording || ending) return;
    if (!hostInConference && !jitsiApi) return;
    setRecordingGateOpen(true);
  }, [mustRecord, hostInConference, jitsiApi, recording, ending]);

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
        if (!recordingError) {
          showAlert(
            'Recording required',
            'Start screen recording before ending. Tap “Start screen recording”, choose This tab, and enable Share tab audio.',
          );
          return;
        }
        const proceed = await confirmDestructive(
          'End without a usable recording?',
          'Screen capture failed or was denied. Ending now will close the debate with no video. Retry recording if you can.',
          'End without video',
        );
        if (!proceed) return;
      }
    }

    setEnding(true);
    setEndingPhase('closing');
    endingRef.current = true;
    presenceGenerationRef.current += 1;
    setHostInConference(false);
    setRecordingGateOpen(false);
    disposeJitsi();

    const capturedRecordingError = recordingError;

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
            <Text style={styles.recordingTitle}>Recording required</Text>
            <Text style={styles.recordingHint}>
              Every host debate must be recorded. Tap the button below, then choose{' '}
              <Text style={{ fontWeight: '800', color: '#fff' }}>This tab</Text>
              {' '}(or this Chrome Tab) and turn on{' '}
              <Text style={{ fontWeight: '800', color: '#fff' }}>Share tab audio</Text>
              {' '}so the meeting is saved.
            </Text>
            {recordingError ? (
              <Text style={styles.recordingErrorText}>{recordingErrorMessage(recordingError)}</Text>
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
                  {recordingError ? 'Retry screen recording' : 'Start screen recording'}
                </Text>
              )}
            </Pressable>
            <Text style={styles.recordingSecondaryBtnText}>
              Browsers only show the capture prompt after you click this button.
            </Text>
          </View>
        ) : null}

        {isHost ? (
          <DebateHostPanel
            jitsiApi={jitsiApi}
            onEndDebate={handleEndDebate}
            onRetryRecording={
              mustRecord && !recording ? () => {
                setRecordingGateOpen(true);
              } : recordingError ? () => {
                setRecordingGateOpen(true);
              } : undefined
            }
            onToggleRecordingPause={recording ? handleToggleRecordingPause : undefined}
            ending={ending}
            recording={recording}
            recordingPaused={recordingPaused}
            recordingError={recordingError ? recordingErrorMessage(recordingError) : undefined}
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
