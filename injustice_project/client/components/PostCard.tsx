import { StyleSheet, Text, View } from 'react-native';

import type { Post } from '../shared/types';

type Props = {
  post: Post;
};

export function PostCard({ post }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.author}>@{post.username}</Text>
      {post.caption ? <Text style={styles.caption}>{post.caption}</Text> : null}
      <View style={styles.meta}>
        <Text style={styles.metaText}>{post.likes_count} likes</Text>
        <Text style={styles.metaText}>{post.comments_count} comments</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  author: {
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 6,
  },
  caption: {
    fontSize: 15,
    color: '#374151',
    marginBottom: 10,
  },
  meta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaText: {
    color: '#6b7280',
    fontSize: 13,
  },
});
