import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { createPost } from '../api/social';
import { useAuth } from '../contexts/AuthContext';
import { colors, radius, spacing } from '../shared/theme';
import { Avatar } from './Avatar';

type Props = {
  onPosted: () => void;
  onOpenDebate: () => void;
};

export function CreatePostCard({ onPosted, onOpenDebate }: Props) {
  const { user } = useAuth();
  const [caption, setCaption] = useState('');
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canPost = caption.trim().length > 0 || mediaUri;

  async function pickMedia(type: 'image' | 'video') {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: type === 'image' ? ['images'] : ['videos'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setMediaUri(result.assets[0].uri);
      setMediaType(type);
    }
  }

  async function handlePost() {
    if (!canPost) return;
    setSubmitting(true);
    try {
      await createPost({
        caption: caption.trim(),
        imageUri: mediaType === 'image' ? mediaUri ?? undefined : undefined,
        videoUri: mediaType === 'video' ? mediaUri ?? undefined : undefined,
      });
      setCaption('');
      setMediaUri(null);
      setMediaType(null);
      onPosted();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not create post');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.inputRow}>
        <Avatar name={user?.username ?? 'U'} size={40} />
        <TextInput
          value={caption}
          onChangeText={setCaption}
          placeholder={`What's on your mind, ${user?.username}?`}
          placeholderTextColor={colors.textDim}
          multiline
          style={styles.input}
        />
      </View>

      {mediaUri ? (
        <Text style={styles.fileName}>{mediaType === 'video' ? '🎬 Video' : '📷 Photo'} selected</Text>
      ) : null}

      <View style={styles.toolbar}>
        <Pressable style={styles.toolBtn} onPress={onOpenDebate}>
          <Ionicons name="chatbubbles" size={22} color="#f97316" />
          <Text style={styles.toolText}>Live Debate</Text>
        </Pressable>
        <Pressable style={styles.toolBtn} onPress={() => pickMedia('video')}>
          <Ionicons name="videocam" size={22} color="#ef4444" />
          <Text style={styles.toolText}>Video</Text>
        </Pressable>
        <Pressable style={styles.toolBtn} onPress={() => pickMedia('image')}>
          <Ionicons name="images" size={22} color="#22c55e" />
          <Text style={styles.toolText}>Photo</Text>
        </Pressable>
        <Pressable
          style={[styles.postBtn, canPost && styles.postBtnActive]}
          onPress={handlePost}
          disabled={!canPost || submitting}
        >
          <Text style={[styles.postBtnText, canPost && styles.postBtnTextActive]}>
            {submitting ? '...' : 'Post'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceHover,
    borderRadius: radius.xl,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 15,
    minHeight: 48,
    maxHeight: 120,
  },
  fileName: {
    color: colors.brandLight,
    fontSize: 12,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    gap: 4,
  },
  toolBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  toolText: { color: colors.textMuted, fontSize: 13, fontWeight: '500' },
  postBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceHover,
  },
  postBtnActive: { backgroundColor: colors.brand },
  postBtnText: { color: colors.textDim, fontWeight: '600' },
  postBtnTextActive: { color: colors.white },
});
