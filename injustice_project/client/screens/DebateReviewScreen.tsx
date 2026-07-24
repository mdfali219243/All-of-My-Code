import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { deletePost, endDebate, publishDebate, publishPost, updatePostCaption } from '../api/social';
import { Button } from '../components/Button';
import { VideoPlayer } from '../components/VideoPlayer';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { confirmDestructive, showAlert } from '../shared/confirm';
import {
  clearRecordingBackup,
  loadRecordingBackup,
  recordingErrorMessage,
  type DebateRecordingError,
} from '../shared/debateRecording';
import { radius, spacing, type ThemeColors } from '../shared/theme';

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bgSecondary },
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
    headerTitle: { flex: 1, color: colors.text, fontWeight: '700', fontSize: 18 },
    content: { padding: spacing.md, gap: spacing.md },
    subtitle: { color: colors.textDim, fontSize: 15, lineHeight: 22 },
    noticeCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      gap: spacing.sm,
    },
    noticeTitle: { color: colors.text, fontWeight: '700', fontSize: 16 },
    noticeText: { color: colors.textDim, fontSize: 14, lineHeight: 20 },
    previewCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    previewPlayer: {
      width: '100%',
      aspectRatio: 16 / 10,
      minHeight: 220,
      backgroundColor: colors.bgSecondary,
    },
    previewPlaceholder: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.lg,
      gap: spacing.sm,
    },
    previewLabel: {
      color: colors.textDim,
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
    },
    captionInput: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      color: colors.text,
      fontSize: 16,
      minHeight: 120,
      textAlignVertical: 'top',
    },
    actions: { gap: spacing.sm, marginTop: spacing.sm },
    draftBadge: {
      alignSelf: 'flex-start',
      color: '#fcd34d',
      fontWeight: '800',
      fontSize: 11,
      backgroundColor: 'rgba(245,158,11,0.2)',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
    },
    discardBtn: {
      alignItems: 'center',
      paddingVertical: spacing.sm,
    },
    discardText: { color: '#f87171', fontWeight: '600', fontSize: 14 },
  });
}

export function DebateReviewScreen() {
  const {
    roomId,
    postId,
    topic,
    previewUrl,
    videoUrl,
    hasRecording,
    recordingError,
    uploadError,
  } = useLocalSearchParams<{
    roomId?: string;
    postId?: string;
    topic?: string;
    previewUrl?: string;
    videoUrl?: string;
    hasRecording?: string;
    recordingError?: string;
    uploadError?: string;
  }>();
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [caption, setCaption] = useState(topic ?? '');
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [discarding, setDiscarding] = useState(false);
  const [retryingUpload, setRetryingUpload] = useState(false);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [localPostId, setLocalPostId] = useState<string | null>(postId ?? null);
  const [localUploadError, setLocalUploadError] = useState<string | null>(uploadError ?? null);
  const [localVideoUrl, setLocalVideoUrl] = useState<string | null>(videoUrl ?? null);

  const playbackUrl = localPreviewUrl || previewUrl || localVideoUrl || videoUrl || null;
  const numericRoomId = roomId ? Number(roomId) : null;
  const numericPostId = localPostId ? Number(localPostId) : null;
  const hasVideo = Boolean(playbackUrl);
  const recordingWasDenied = recordingError === 'denied';
  const recordingFailed =
    recordingError === 'failed' ||
    recordingError === 'unsupported' ||
    recordingError === 'empty';
  const noRecordingCaptured = hasRecording !== '1' && !hasVideo;

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith('blob:') && typeof URL !== 'undefined') {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    let createdUrl: string | null = null;
    let cancelled = false;

    async function hydrateFromBackup() {
      // Only hydrate when navigation did not already provide a playable URL.
      if (!numericRoomId || previewUrl || videoUrl || Platform.OS !== 'web') return;
      const blob = await loadRecordingBackup(numericRoomId);
      if (cancelled || !blob?.size || typeof URL === 'undefined') return;
      createdUrl = URL.createObjectURL(blob);
      setLocalPreviewUrl(createdUrl);
    }

    void hydrateFromBackup();

    return () => {
      cancelled = true;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
        setLocalPreviewUrl((current) => (current === createdUrl ? null : current));
      }
    };
  }, [numericRoomId, previewUrl, videoUrl]);

  async function handleRetryUpload() {
    if (!numericRoomId) return;
    setRetryingUpload(true);
    try {
      const blob = await loadRecordingBackup(numericRoomId);
      if (!blob?.size) {
        showAlert('No local recording', 'There is no backed-up recording in this browser to upload.');
        return;
      }
      const result = await endDebate(numericRoomId, blob);
      const draft = result.draft;
      if (draft?.id) setLocalPostId(String(draft.id));
      if (draft?.video_url) setLocalVideoUrl(draft.video_url);
      setLocalUploadError(null);
      void clearRecordingBackup(numericRoomId);
      showAlert('Uploaded', 'Your debate recording was saved as a draft.');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Upload failed';
      setLocalUploadError(message);
      showAlert('Upload failed', message);
    } finally {
      setRetryingUpload(false);
    }
  }

  function handleBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/(app)');
  }

  function noticeMessage(): string {
    if (localUploadError) {
      return `The debate ended, but uploading the recording failed: ${localUploadError}. If you see a preview below, retry the upload — the video is still saved in this browser.`;
    }
    if (recordingWasDenied) {
      return recordingErrorMessage('denied');
    }
    if (recordingFailed) {
      return recordingErrorMessage(recordingError as DebateRecordingError);
    }
    if (noRecordingCaptured) {
      return 'No video was captured for this debate. You can still save a caption as a draft note, or discard and return to the feed.';
    }
    return 'Preview your debate, write a caption, then save for later or post to the feed when you are ready.';
  }

  async function handleSaveForLater() {
    if (!numericPostId) {
      showAlert('Saved', 'Your debate has ended. No recording was saved, but you can start a new debate anytime.');
      router.replace(`/(app)/profile/${user?.username ?? ''}`);
      return;
    }

    setSaving(true);
    try {
      await updatePostCaption(numericPostId, caption.trim());
      showAlert('Saved', 'Your debate recording was saved as a draft. You can post it anytime from your profile.');
      router.replace(`/(app)/profile/${user?.username ?? ''}`);
    } catch (e) {
      showAlert('Error', e instanceof Error ? e.message : 'Could not save draft');
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    if (!hasVideo && !numericPostId) {
      showAlert(
        'No recording to post',
        'There is no video to publish. Discard this session or start a new debate with screen capture enabled.',
      );
      return;
    }

    setPublishing(true);
    try {
      const trimmed = caption.trim();
      if (numericRoomId && numericPostId) {
        await publishDebate(numericRoomId, trimmed);
      } else if (numericPostId) {
        await publishPost(numericPostId, trimmed);
      } else {
        throw new Error('Missing debate or post id');
      }
      showAlert('Posted', 'Your debate recording is now on the feed.');
      router.replace('/(app)');
    } catch (e) {
      showAlert('Error', e instanceof Error ? e.message : 'Could not publish');
    } finally {
      setPublishing(false);
    }
  }

  async function handleDiscard() {
    const confirmed = await confirmDestructive(
      numericPostId ? 'Discard recording?' : 'Leave review?',
      numericPostId
        ? 'This will delete the draft recording. You cannot undo this.'
        : 'Return to the feed without posting anything.',
      numericPostId ? 'Discard' : 'Leave',
    );
    if (!confirmed) return;

    setDiscarding(true);
    try {
      if (numericPostId) {
        await deletePost(numericPostId);
      }
      router.replace('/(app)');
    } catch (e) {
      showAlert('Error', e instanceof Error ? e.message : 'Could not discard recording');
    } finally {
      setDiscarding(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Review recording</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {numericPostId ? <Text style={styles.draftBadge}>DRAFT</Text> : null}
          <Text style={styles.subtitle}>{noticeMessage()}</Text>

          {localUploadError ? (
            <View style={styles.noticeCard}>
              <Text style={styles.noticeTitle}>Upload issue</Text>
              <Text style={styles.noticeText}>{localUploadError}</Text>
              {numericRoomId && Platform.OS === 'web' ? (
                <Button
                  title="Retry upload from this browser"
                  onPress={() => void handleRetryUpload()}
                  loading={retryingUpload}
                  disabled={saving || publishing || discarding}
                />
              ) : null}
            </View>
          ) : null}

          <View style={styles.previewCard}>
            <Text style={styles.previewLabel}>Recording preview</Text>
            {hasVideo ? (
              <VideoPlayer uri={playbackUrl!} style={styles.previewPlayer} nativeControls />
            ) : (
              <View style={[styles.previewPlayer, styles.previewPlaceholder]}>
                <Ionicons name="videocam-off-outline" size={40} color={colors.textDim} />
                <Text style={styles.noticeText}>
                  {recordingWasDenied
                    ? 'Screen capture was not allowed.'
                    : noRecordingCaptured
                      ? 'No recording available for preview.'
                      : 'Video preview unavailable.'}
                </Text>
              </View>
            )}
          </View>

          <TextInput
            value={caption}
            onChangeText={setCaption}
            placeholder="Write a caption for this debate..."
            placeholderTextColor={colors.textDim}
            style={styles.captionInput}
            multiline
            maxLength={500}
          />

          <View style={styles.actions}>
            <Button
              title="Post to feed"
              onPress={() => void handlePublish()}
              loading={publishing}
              disabled={saving || discarding || (!hasVideo && !numericPostId)}
            />
            <Button
              title="Save for later"
              variant="secondary"
              onPress={() => void handleSaveForLater()}
              loading={saving}
              disabled={publishing || discarding}
            />
            <Pressable
              style={styles.discardBtn}
              onPress={() => void handleDiscard()}
              disabled={saving || publishing || discarding}
            >
              {discarding ? (
                <ActivityIndicator size="small" color="#f87171" />
              ) : (
                <Text style={styles.discardText}>
                  {numericPostId ? 'Discard recording' : 'Leave without posting'}
                </Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
