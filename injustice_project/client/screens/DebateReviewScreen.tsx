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

import { deletePost, publishDebate, publishPost, updatePostCaption, uploadDebateRecording } from '../api/social';
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
    captionCount: {
      color: colors.textDim,
      fontSize: 12,
      textAlign: 'right',
      marginTop: 6,
    },
    actions: { gap: spacing.sm, marginTop: spacing.sm },
    actionHint: { color: colors.textDim, fontSize: 13, lineHeight: 18, marginBottom: 4 },
    draftBadge: {
      alignSelf: 'flex-start',
      color: '#fcd34d',
      fontWeight: '800',
      fontSize: 11,
      backgroundColor: 'rgba(245,158,11,0.2)',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
      overflow: 'hidden',
    },
    secondaryRow: { flexDirection: 'row', gap: spacing.sm },
    secondaryBtn: { flex: 1 },
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
  const [localBlob, setLocalBlob] = useState<Blob | null>(null);
  const [localPostId, setLocalPostId] = useState<string | null>(postId ?? null);
  const [localUploadError, setLocalUploadError] = useState<string | null>(uploadError ?? null);
  const [localVideoUrl, setLocalVideoUrl] = useState<string | null>(videoUrl ?? null);
  const [hydrating, setHydrating] = useState(Platform.OS === 'web');
  const [downloading, setDownloading] = useState(false);

  const playbackUrl =
    localPreviewUrl ||
    (typeof previewUrl === 'string' && previewUrl.startsWith('blob:') ? previewUrl : null) ||
    localVideoUrl ||
    (typeof videoUrl === 'string' && videoUrl ? videoUrl : null) ||
    null;
  const numericRoomId = roomId ? Number(roomId) : null;
  const numericPostId = localPostId ? Number(localPostId) : null;
  const hasVideo = Boolean(playbackUrl) || hasRecording === '1';
  const recordingWasDenied = recordingError === 'denied';
  const recordingFailed =
    recordingError === 'failed' ||
    recordingError === 'unsupported' ||
    recordingError === 'empty';
  const noRecordingCaptured = hasRecording !== '1' && !hasVideo;

  useEffect(() => {
    let createdUrl: string | null = null;
    let cancelled = false;

    async function hydrateFromBackup() {
      if (Platform.OS !== 'web' || typeof URL === 'undefined') {
        setHydrating(false);
        return;
      }
      if (!numericRoomId) {
        setHydrating(false);
        return;
      }

      try {
        // Always prefer IndexedDB backup for a stable local preview.
        const blob = await loadRecordingBackup(numericRoomId);
        if (cancelled) return;
        if (blob?.size) {
          createdUrl = URL.createObjectURL(blob);
          setLocalBlob(blob);
          setLocalPreviewUrl(createdUrl);
          return;
        }

        if (typeof previewUrl === 'string' && previewUrl.startsWith('blob:')) {
          try {
            const res = await fetch(previewUrl);
            const fromParam = await res.blob();
            if (!cancelled && fromParam.size > 0) {
              createdUrl = URL.createObjectURL(fromParam);
              setLocalBlob(fromParam);
              setLocalPreviewUrl(createdUrl);
            }
          } catch {
            /* preview param may already be revoked */
          }
        }
      } finally {
        if (!cancelled) setHydrating(false);
      }
    }

    void hydrateFromBackup();

    return () => {
      cancelled = true;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
        setLocalPreviewUrl((current) => (current === createdUrl ? null : current));
      }
    };
  }, [numericRoomId, previewUrl]);

  const needsUpload = Boolean((playbackUrl || hasRecording === '1') && !numericPostId);

  async function resolveLocalBlob(): Promise<Blob | null> {
    if (Platform.OS !== 'web') return null;
    if (localBlob?.size) return localBlob;
    if (numericRoomId) {
      const backup = await loadRecordingBackup(numericRoomId);
      if (backup?.size) {
        setLocalBlob(backup);
        return backup;
      }
    }
    const url = localPreviewUrl || (typeof previewUrl === 'string' ? previewUrl : null);
    if (url?.startsWith('blob:') && typeof fetch !== 'undefined') {
      try {
        const res = await fetch(url);
        const blob = await res.blob();
        if (blob?.size) {
          setLocalBlob(blob);
          return blob;
        }
      } catch {
        /* ignore */
      }
    }
    return null;
  }

  /** Upload the recorded video to the server as a draft. Returns post id when successful. */
  async function uploadRecordingToServer(): Promise<number | null> {
    if (!numericRoomId) {
      throw new Error('Missing debate room id');
    }
    const blob = await resolveLocalBlob();
    if (!blob?.size) {
      throw new Error('No local recording found in this browser to upload.');
    }
    const result = await uploadDebateRecording(numericRoomId, blob);
    const draft = result.draft;
    const id = draft?.id ?? result.post_id ?? null;
    if (id) setLocalPostId(String(id));
    if (draft?.video_url) setLocalVideoUrl(draft.video_url);
    setLocalUploadError(null);
    // Keep backup until we confirm a playable server URL exists.
    if (draft?.video_url) {
      void clearRecordingBackup(numericRoomId);
    }
    return id;
  }

  async function handleUploadRecording() {
    if (!numericRoomId) return;
    setRetryingUpload(true);
    try {
      const id = await uploadRecordingToServer();
      if (!id) {
        throw new Error('Upload finished but no draft was created.');
      }
      if (caption.trim()) {
        await updatePostCaption(id, caption.trim());
      }
      showAlert('Recording uploaded', 'Your video is saved as a draft. You can post it now or keep it in Profile → Drafts.');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Upload failed';
      setLocalUploadError(message);
      showAlert('Upload failed', message);
    } finally {
      setRetryingUpload(false);
    }
  }

  function triggerBrowserDownload(blob: Blob, filename: string) {
    const href = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = href;
    a.download = filename;
    a.rel = 'noopener';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    // Revoking immediately cancels many browser downloads — wait until save starts.
    window.setTimeout(() => {
      a.remove();
      URL.revokeObjectURL(href);
    }, 60_000);
  }

  async function handleDownloadRecording() {
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      showAlert('Download', 'Downloading the recording file is available on desktop web.');
      return;
    }

    setDownloading(true);
    try {
      let blob = localBlob;
      if (!blob?.size) {
        blob = await resolveLocalBlob();
      }

      // If we only have a remote server URL, fetch it as a blob so download= works cross-origin.
      if ((!blob || !blob.size) && localVideoUrl && typeof fetch !== 'undefined') {
        const res = await fetch(localVideoUrl);
        if (!res.ok) {
          throw new Error('Could not download the recording from the server.');
        }
        blob = await res.blob();
        setLocalBlob(blob);
      }

      if (!blob?.size) {
        showAlert(
          'No recording',
          'There is no video file to download yet. Wait for the preview to load, or upload first.',
        );
        return;
      }

      const mime = blob.type || 'video/webm';
      const ext = mime.includes('mp4') ? 'mp4' : mime.includes('webm') ? 'webm' : 'webm';
      const filename = `injustice-debate-${numericRoomId ?? 'recording'}.${ext}`;

      // Chrome/Edge: native save dialog (most reliable).
      const anyWindow = window as unknown as {
        showSaveFilePicker?: (options: {
          suggestedName?: string;
          types?: Array<{ description: string; accept: Record<string, string[]> }>;
        }) => Promise<{ createWritable: () => Promise<{ write: (data: Blob) => Promise<void>; close: () => Promise<void> }> }>;
      };
      if (typeof anyWindow.showSaveFilePicker === 'function') {
        try {
          const handle = await anyWindow.showSaveFilePicker({
            suggestedName: filename,
            types: [
              {
                description: 'Video',
                accept: { [mime || 'video/webm']: [`.${ext}`] },
              },
            ],
          });
          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();
          showAlert('Downloaded', `Saved ${filename} to your computer.`);
          return;
        } catch (e) {
          // User cancelled the picker — don't fall through as an error.
          if (e instanceof DOMException && e.name === 'AbortError') return;
          // Fall back to anchor download below.
        }
      }

      triggerBrowserDownload(blob, filename);
      showAlert('Download started', `Saving ${filename}. Check your Downloads folder.`);
    } catch (e) {
      showAlert('Download failed', e instanceof Error ? e.message : 'Could not download recording');
    } finally {
      setDownloading(false);
    }
  }

  function handleBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/(app)');
  }

  function noticeMessage(): string {
    if (localUploadError) {
      return 'The debate ended, but the recording is still on this device. Tap “Upload recording” below to save it to your account.';
    }
    if (recordingWasDenied) {
      return recordingErrorMessage('denied');
    }
    if (recordingFailed) {
      return recordingErrorMessage(recordingError as DebateRecordingError);
    }
    if (noRecordingCaptured) {
      return 'No video was captured for this debate. Discard and start a new debate with screen capture enabled.';
    }
    if (needsUpload) {
      return 'Your recording is ready below. Upload it to your account, then post it or save it as a draft.';
    }
    return 'Your recording is uploaded. Write a caption, then post it to the feed or keep it as a draft.';
  }

  async function ensureDraftUploaded(): Promise<number | null> {
    if (numericPostId) return numericPostId;
    if (!hasVideo || !numericRoomId) return null;
    return uploadRecordingToServer();
  }

  async function handleSaveForLater() {
    setSaving(true);
    try {
      const id = await ensureDraftUploaded();
      if (!id) {
        showAlert(
          'Nothing to save',
          'No recording was captured for this debate. Start a new debate and allow screen capture to save a video.',
        );
        return;
      }
      await updatePostCaption(id, caption.trim());
      showAlert('Recording saved', 'Saved to Profile → Drafts. Open it anytime to post.');
      router.replace(`/(app)/profile/${user?.username ?? ''}`);
    } catch (e) {
      showAlert('Error', e instanceof Error ? e.message : 'Could not save recording');
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
      let id = numericPostId;
      if (!id) {
        id = await ensureDraftUploaded();
      }
      if (!id) {
        throw new Error('Could not upload the recording before posting.');
      }

      if (numericRoomId) {
        await publishDebate(numericRoomId, trimmed);
      } else {
        await publishPost(id, trimmed);
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

          {localUploadError || needsUpload ? (
            <View style={styles.noticeCard}>
              <Text style={styles.noticeTitle}>
                {localUploadError ? 'Recording not uploaded yet' : 'Ready to upload'}
              </Text>
              <Text style={styles.noticeText}>
                {localUploadError
                  ? localUploadError
                  : 'Your recorded video is on this device. Upload it to save it to your Injustice account.'}
              </Text>
            </View>
          ) : null}

          <View style={styles.previewCard}>
            <Text style={styles.previewLabel}>Recording preview</Text>
            {hydrating ? (
              <View style={[styles.previewPlayer, styles.previewPlaceholder]}>
                <ActivityIndicator size="large" color={colors.brand} />
                <Text style={styles.noticeText}>Loading recording from this device…</Text>
              </View>
            ) : playbackUrl ? (
              <VideoPlayer uri={playbackUrl} style={styles.previewPlayer} nativeControls />
            ) : (
              <View style={[styles.previewPlayer, styles.previewPlaceholder]}>
                <Ionicons name="videocam-off-outline" size={40} color={colors.textDim} />
                <Text style={styles.noticeText}>
                  {recordingWasDenied
                    ? 'Screen capture was not allowed.'
                    : noRecordingCaptured
                      ? 'No recording available for preview.'
                      : 'Video preview unavailable. If you still have the recording, tap Upload recording.'}
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
          <Text style={styles.captionCount}>{caption.length}/500</Text>

          <View style={styles.actions}>
            <Text style={styles.actionHint}>
              {hasVideo
                ? 'Choose what to do with this recording:'
                : 'No recording is available for this session.'}
            </Text>

            {needsUpload || localUploadError ? (
              <Button
                title="Upload recording"
                onPress={() => void handleUploadRecording()}
                loading={retryingUpload}
                disabled={!hasVideo || saving || publishing || discarding}
              />
            ) : null}

            <Button
              title="Post recording to feed"
              onPress={() => void handlePublish()}
              loading={publishing}
              disabled={(!hasVideo && !numericPostId) || saving || discarding || retryingUpload}
            />
            <Button
              title="Save recording as draft"
              variant="secondary"
              onPress={() => void handleSaveForLater()}
              loading={saving}
              disabled={(!hasVideo && !numericPostId) || publishing || discarding || retryingUpload}
            />

            {hasVideo && Platform.OS === 'web' ? (
              <Button
                title="Download recording to my device"
                variant="secondary"
                onPress={() => void handleDownloadRecording()}
                loading={downloading}
                disabled={saving || publishing || discarding || retryingUpload || hydrating}
              />
            ) : null}

            <Pressable
              style={styles.discardBtn}
              onPress={() => void handleDiscard()}
              disabled={saving || publishing || discarding || retryingUpload}
            >
              {discarding ? (
                <ActivityIndicator size="small" color="#f87171" />
              ) : (
                <Text style={styles.discardText}>
                  {numericPostId || hasVideo ? 'Discard recording' : 'Leave without posting'}
                </Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
