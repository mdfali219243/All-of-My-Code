import { apiRequest } from './client';
import { normalizePost } from '../shared/mediaUrl';
import type { Post, User } from '../shared/types';

export type SearchResults = {
  users: User[];
  posts: Post[];
};

export async function fetchSearch(query: string): Promise<SearchResults> {
  const q = query.trim();
  if (!q) {
    return { users: [], posts: [] };
  }

  const data = await apiRequest<SearchResults>(`/search/?q=${encodeURIComponent(q)}`);
  return {
    users: data.users,
    posts: data.posts.map(normalizePost),
  };
}
