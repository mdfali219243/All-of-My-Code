import { apiRequest } from './client';
import type { Post, Profile } from '../shared/types';

export async function fetchPosts(): Promise<Post[]> {
  const data = await apiRequest<{ posts: Post[] }>('/posts/');
  return data.posts;
}

export async function fetchProfile(username: string): Promise<Profile> {
  return apiRequest<Profile>(`/profile/${username}/`);
}
