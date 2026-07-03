import { apiRequest } from './client';
import type { Post, Profile } from '../shared/types';
import { normalizePost } from '../shared/mediaUrl';

export async function fetchPosts(): Promise<Post[]> {
  const data = await apiRequest<{ posts: Post[] }>('/posts/');
  return data.posts.map(normalizePost);
}

export async function fetchReels(): Promise<{ posts: Post[]; followed_ids: number[] }> {
  const data = await apiRequest<{ posts: Post[]; followed_ids: number[] }>('/reels/');
  return { ...data, posts: data.posts.map(normalizePost) };
}

export async function fetchProfile(username: string): Promise<Profile> {
  const data = await apiRequest<Profile>(`/profile/${username}/`);
  return {
    ...data,
    posts: data.posts.map(normalizePost),
    photo_posts: data.photo_posts.map(normalizePost),
    video_posts: data.video_posts.map(normalizePost),
  };
}
