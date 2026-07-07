import { apiRequest } from './client';
import { getAccessToken } from './storage';
import { API_BASE_URL } from './config';
import { normalizePost } from '../shared/mediaUrl';
import type { Comment, Debate, DebateMessage, Post, ShareContact } from '../shared/types';

export async function fetchDebates(): Promise<Debate[]> {
  const data = await apiRequest<{ debates: Debate[] }>('/debates/');
  return data.debates;
}

export async function createDebate(topic: string): Promise<Debate> {
  return apiRequest<Debate>('/debates/create/', { method: 'POST', body: { topic } });
}

export async function fetchDebate(roomId: number): Promise<Debate> {
  return apiRequest<Debate>(`/debates/${roomId}/`);
}

export async function fetchDebateMessages(roomId: number, lastId = 0): Promise<DebateMessage[]> {
  const data = await apiRequest<{ messages: DebateMessage[] }>(
    `/debates/${roomId}/messages/?last_id=${lastId}`,
  );
  return data.messages;
}

export async function sendDebateMessage(roomId: number, message: string): Promise<DebateMessage> {
  const data = await apiRequest<{ message: DebateMessage }>(`/debates/${roomId}/messages/`, {
    method: 'POST',
    body: { message },
  });
  return data.message;
}

export async function endDebate(roomId: number, videoBlob?: Blob | null): Promise<{ status: string }> {
  const token = await getAccessToken();

  if (videoBlob) {
    const form = new FormData();
    form.append('video_file', videoBlob, 'debate_recording.webm');

    const response = await fetch(`${API_BASE_URL}/debates/${roomId}/end/`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.detail ?? 'Failed to end debate');
    return data as { status: string };
  }

  return apiRequest(`/debates/${roomId}/end/`, { method: 'POST' });
}

export async function likePost(postId: number): Promise<{ liked: boolean; likes_count: number }> {
  return apiRequest(`/posts/${postId}/like/`, { method: 'POST' });
}

export async function fetchComments(postId: number): Promise<{ comments: Comment[]; comments_count: number }> {
  return apiRequest(`/posts/${postId}/comments/`);
}

export async function addComment(postId: number, comment_text: string): Promise<{ comments_count: number; comment: Comment }> {
  return apiRequest(`/posts/${postId}/comments/`, { method: 'POST', body: { comment_text } });
}

export async function shareToFeed(postId: number): Promise<{ message: string }> {
  return apiRequest(`/posts/${postId}/share/`, { method: 'POST', body: { action: 'feed' } });
}

export async function shareToDm(postId: number, username: string): Promise<{ message: string }> {
  return apiRequest(`/posts/${postId}/share/`, { method: 'POST', body: { action: 'dm', username } });
}

export async function fetchShareContacts(): Promise<ShareContact[]> {
  const data = await apiRequest<{ contacts: ShareContact[] }>('/share/contacts/');
  return data.contacts;
}

export async function followUser(username: string): Promise<{ following: boolean }> {
  return apiRequest(`/users/${username}/follow/`, { method: 'POST' });
}

export async function createPost(fields: { caption?: string; imageUri?: string; videoUri?: string }): Promise<Post> {
  const token = await getAccessToken();
  const form = new FormData();

  if (fields.caption) form.append('caption', fields.caption);

  if (fields.imageUri) {
    form.append('image_file', {
      uri: fields.imageUri,
      name: 'photo.jpg',
      type: 'image/jpeg',
    } as unknown as Blob);
  }

  if (fields.videoUri) {
    form.append('video_file', {
      uri: fields.videoUri,
      name: 'video.mp4',
      type: 'video/mp4',
    } as unknown as Blob);
  }

  const response = await fetch(`${API_BASE_URL}/posts/`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.detail ?? 'Failed to create post');
  return normalizePost(data as Post);
}

export async function uploadPhoto(username: string, imageUri: string, caption?: string): Promise<Post> {
  const token = await getAccessToken();
  const form = new FormData();
  form.append('image_file', {
    uri: imageUri,
    name: 'photo.jpg',
    type: 'image/jpeg',
  } as unknown as Blob);
  if (caption) form.append('caption', caption);

  const response = await fetch(`${API_BASE_URL}/profile/${username}/photos/`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.detail ?? 'Failed to upload photo');
  return normalizePost(data as Post);
}
