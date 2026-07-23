import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

import { publishDebate, publishPost, updatePostCaption } from '../api/social';
import { Button } from '../components/Button';
import { VideoPlayer } from '../components/VideoPlayer';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
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
    headerTitle: { flex: 1, color: colors.text, fontWeight: '700', fontSize: 18 },
    content: { padding: spacing.md, gap: spacing.md },
    subtitle: { color: colors.textDim, fontSize: 15, lineHeight: 22 },
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
  });
}

export function DebateReviewScreen() {
  const { roomId, postId, topic, previewUrl, videoUrl } = useLocalSearchParams<{
    roomId?: string;
    postId?: string;
    topic?: string;
    previewUrl?: string;
    videoUrl?: string;
  }>();
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [caption, setCaption] = useState(topic ?? '');
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const playbackUrl = previewUrl || videoUrl || null;
  const numericRoomId = roomId ? Number(roomId) : null;
  const numericPostId = postId ? Number(postId) : null;

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith('blob:') && typeof URL !== 'undefined') {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function handleBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/(app)');
  }

  async function handleSaveForLater() {
    if (!numericPostId) {
      handleBack();
      return;
    }

    setSaving(true);
    try {
      await updatePostCaption(numericPostId, caption.trim());
      Alert.alert('Saved', 'Your debate recording was saved as a draft. You can post it anytime from your profile.');
      router.replace(`/(app)/profile/${user?.username ?? ''}`);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not save draft');
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    setPublishing(true);
    try {
      const trimmed = caption.trim();
      if (numericRoomId) {
        await publishDebate(numericRoomId, trimmed);
      } else if (numericPostId) {
        await publishPost(numericPostId, trimmed);
      } else {
        throw new Error('Missing debate or post id');
      }
      Alert.alert('Posted', 'Your debate recording is now on the feed.');
      router.replace('/(app)');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not publish');
    } finally {
      setPublishing(false);
    }
  }

  if (!playbackUrl && !numericPostId) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
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
          <Text style={styles.draftBadge}>DRAFT</Text>
          <Text style={styles.subtitle}>
            Preview your debate, write a caption, then save for later or post to the feed when you are ready.
          </Text>

          <View style={styles.previewCard}>
            <Text style={styles.previewLabel}>Recording preview</Text>
            {playbackUrl ? (
              <VideoPlayer uri={playbackUrl} style={styles.previewPlayer} nativeControls />
            ) : (
              <View style={[styles.previewPlayer, styles.loading]}>
                <ActivityIndicator size="large" color={colors.brand} />
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
              disabled={saving}
            />
            <Button
              title="Save for later"
              variant="secondary"
              onPress={() => void handleSaveForLater()}
              loading={saving}
              disabled={publishing}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
