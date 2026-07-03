import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { addComment, fetchComments, likePost } from '../api/social';
import type { Comment as PostComment, Post } from '../shared/types';
import { colors, radius, spacing, timeAgo } from '../shared/theme';
import { Avatar } from './Avatar';
import { ShareModal } from './ShareModal';
import { VideoPlayer } from './VideoPlayer';

type Props = {
  post: Post;
  onUpdate?: () => void;
};

export function PostCard({ post, onUpdate }: Props) {
  const router = useRouter();
  const [localPost, setLocalPost] = useState(post);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [shareVisible, setShareVisible] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  const sourceId = localPost.source_id;

  const handleLike = useCallback(async () => {
    try {
      const result = await likePost(sourceId);
      setLocalPost((prev) => ({
        ...prev,
        is_liked: result.liked,
        likes_count: result.likes_count,
      }));
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not like post');
    }
  }, [sourceId]);

  const toggleComments = useCallback(async () => {
    if (!showComments) {
      try {
        const data = await fetchComments(sourceId);
        setComments(data.comments);
      } catch {
        Alert.alert('Error', 'Could not load comments');
        return;
      }
    }
    setShowComments((v) => !v);
  }, [showComments, sourceId]);

  const handleComment = useCallback(async () => {
    const text = commentText.trim();
    if (!text) return;
    setSubmittingComment(true);
    try {
      const result = await addComment(sourceId, text);
      setComments((prev) => [result.comment, ...prev]);
      setLocalPost((prev) => ({ ...prev, comments_count: result.comments_count }));
      setCommentText('');
      onUpdate?.();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not post comment');
    } finally {
      setSubmittingComment(false);
    }
  }, [commentText, sourceId, onUpdate]);

  return (
    <>
      <View style={styles.card}>
        <View style={styles.header}>
          <Pressable
            style={styles.authorRow}
            onPress={() => router.push(`/(app)/profile/${localPost.username}`)}
          >
            <Avatar name={localPost.display_name} size={40} />
            <View style={styles.headerText}>
              <Text style={styles.name}>{localPost.display_name}</Text>
              <Text style={styles.meta}>
                {localPost.shared_from_username ? `shared @${localPost.source_username}'s post · ` : ''}
                {timeAgo(localPost.created_at)} ago · 🌎
              </Text>
            </View>
          </Pressable>
        </View>

        {localPost.shared_from_username ? (
          <View style={styles.sharedWrap}>
            <Text style={styles.sharedLabel}>@{localPost.source_username}</Text>
            {localPost.caption ? <Text style={styles.caption}>{localPost.caption}</Text> : null}
            {localPost.image_url ? (
              <Image source={{ uri: localPost.image_url }} style={styles.media} contentFit="contain" />
            ) : null}
            {localPost.video_url ? (
              <VideoPlayer uri={localPost.video_url} style={styles.media} nativeControls />
            ) : null}
          </View>
        ) : (
          <>
            {localPost.caption ? <Text style={styles.caption}>{localPost.caption}</Text> : null}
            {localPost.image_url ? (
              <Image source={{ uri: localPost.image_url }} style={styles.media} contentFit="contain" />
            ) : null}
            {localPost.video_url ? (
              <Image source={{ uri: localPost.video_url }} style={styles.media} contentFit="cover" />
            ) : null}
          </>
        )}

        <View style={styles.countsRow}>
          <Text style={styles.countText}>
            {localPost.likes_count > 0 ? `${localPost.likes_count} likes` : 'Like'}
          </Text>
          <View style={styles.countRight}>
            <Pressable onPress={toggleComments}>
              <Text style={styles.countText}>
                {localPost.comments_count > 0 ? `${localPost.comments_count} Comments` : 'Comment'}
              </Text>
            </Pressable>
            <Pressable onPress={() => setShareVisible(true)}>
              <Text style={[styles.countText, { marginLeft: 12 }]}>Share</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable style={styles.actionBtn} onPress={handleLike}>
            <Ionicons
              name={localPost.is_liked ? 'thumbs-up' : 'thumbs-up-outline'}
              size={22}
              color={localPost.is_liked ? '#3b82f6' : colors.textDim}
            />
            <Text style={[styles.actionText, localPost.is_liked && styles.likedText]}>Like</Text>
          </Pressable>
          <Pressable style={styles.actionBtn} onPress={toggleComments}>
            <Ionicons name="chatbubble-outline" size={22} color={colors.textDim} />
            <Text style={styles.actionText}>Comment</Text>
          </Pressable>
          <Pressable style={styles.actionBtn} onPress={() => setShareVisible(true)}>
            <Ionicons name="share-social-outline" size={22} color={colors.textDim} />
            <Text style={styles.actionText}>Share</Text>
          </Pressable>
        </View>

        {showComments ? (
          <View style={styles.commentsSection}>
            {comments.map((c) => (
              <View key={c.id} style={styles.commentRow}>
                <Avatar name={c.display_name} size={32} />
                <View style={styles.commentBubble}>
                  <Text style={styles.commentAuthor}>{c.display_name}</Text>
                  <Text style={styles.commentText}>{c.text}</Text>
                </View>
              </View>
            ))}
            <View style={styles.commentInputRow}>
              <TextInput
                value={commentText}
                onChangeText={setCommentText}
                placeholder="Write a comment..."
                placeholderTextColor={colors.textDim}
                style={styles.commentInput}
                editable={!submittingComment}
              />
              <Pressable onPress={handleComment} disabled={submittingComment}>
                <Ionicons name="send" size={20} color={colors.brandLight} />
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>

      <ShareModal
        visible={shareVisible}
        postId={sourceId}
        onClose={() => setShareVisible(false)}
        onShared={() => {
          setShareVisible(false);
          onUpdate?.();
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerText: { flex: 1 },
  name: { color: colors.text, fontWeight: '700', fontSize: 15 },
  meta: { color: colors.textDim, fontSize: 13, marginTop: 2 },
  sharedWrap: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  sharedLabel: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    backgroundColor: 'rgba(58,59,60,0.4)',
    color: colors.textDim,
    fontSize: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  caption: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  media: {
    width: '100%',
    aspectRatio: 16 / 10,
    backgroundColor: colors.bgSecondary,
    minHeight: 220,
  },
  countsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  countText: { color: colors.textDim, fontSize: 15 },
  countRight: { flexDirection: 'row' },
  actions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    marginHorizontal: spacing.sm,
    marginBottom: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: radius.sm,
  },
  actionText: { color: colors.textDim, fontWeight: '600', fontSize: 15 },
  likedText: { color: '#3b82f6' },
  commentsSection: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  commentRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  commentBubble: {
    flex: 1,
    backgroundColor: colors.surfaceHover,
    borderRadius: radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  commentAuthor: { color: colors.text, fontWeight: '700', fontSize: 14 },
  commentText: { color: colors.text, fontSize: 14, marginTop: 2 },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceHover,
    borderRadius: radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  commentInput: { flex: 1, color: colors.text, fontSize: 15 },
});
