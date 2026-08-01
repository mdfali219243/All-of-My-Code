import { apiRequest } from './client';
import { clearTokens, getAccessToken, getRefreshToken, saveTokens } from './storage';
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

async function postMultipart(
  path: string,
  form: FormData,
  token: string | null,
): Promise<Response> {
  try {
    return await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      // Do not set Content-Type — browser must add multipart boundary.
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
  } catch (e) {
    const message =
      e instanceof TypeError
        ? 'Network error while uploading (server may be waking up or the file is too large). Tap Upload recording to retry.'
        : e instanceof Error
          ? e.message
          : 'Upload failed';
    throw new Error(message);
  }
}

async function postEndDebateForm(
  roomId: number,
  form: FormData,
  token: string | null,
): Promise<Response> {
  return postMultipart(`/debates/${roomId}/end/`, form, token);
}

async function uploadDebateRecordingForm(
  roomId: number,
  form: FormData,
  token: string | null,
): Promise<Response> {
  return postMultipart(`/debates/${roomId}/recording/`, form, token);
}

function buildVideoForm(videoBlob: Blob): { form: FormData; filename: string; mime: string } {
  const mime = videoBlob.type || 'video/webm';
  const ext = mime.includes('mp4') ? 'mp4' : 'webm';
  const filename = `debate_recording.${ext}`;
  const form = new FormData();
  const file =
    typeof File !== 'undefined' ? new File([videoBlob], filename, { type: mime }) : videoBlob;
  form.append('video_file', file, filename);
  return { form, filename, mime };
}

async function withAuthRetry(
  videoBlob: Blob,
  send: (form: FormData, token: string | null) => Promise<Response>,
): Promise<Response> {
  const { form } = buildVideoForm(videoBlob);
  let token = await getAccessToken();
  let response = await send(form, token);

  if (response.status === 401) {
    const retry = buildVideoForm(videoBlob);
    const refresh = await getRefreshToken();
    if (refresh) {
      const refreshRes = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      });
      if (refreshRes.ok) {
        const data = await refreshRes.json();
        await saveTokens({ access: data.access, refresh });
        token = data.access;
        response = await send(retry.form, token);
      } else {
        await clearTokens();
      }
    }
  }

  return response;
}

export async function endDebate(
  roomId: number,
  videoBlob?: Blob | null,
): Promise<{ status: string; post_id?: number; draft?: Post }> {
  // Always close the room with a lightweight request first so a large video
  // upload cannot leave the debate "stuck live" if the network drops.
  const closed = await apiRequest<{ status: string; post_id?: number; draft?: Post }>(
    `/debates/${roomId}/end/`,
    { method: 'POST' },
  );

  if (!videoBlob || videoBlob.size === 0) {
    return {
      ...closed,
      draft: closed.draft ? normalizePost(closed.draft) : undefined,
    };
  }

  try {
    const response = await withAuthRetry(videoBlob, (form, token) =>
      uploadDebateRecordingForm(roomId, form, token),
    );
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const detail =
        typeof data.detail === 'string'
          ? data.detail
          : response.status === 413
            ? 'Recording too large for the server to accept.'
            : response.status === 502 || response.status === 503
              ? 'Server is temporarily unavailable. Tap Upload recording to retry.'
              : 'Failed to upload recording';
      throw new Error(detail);
    }
    return {
      status: 'ok',
      post_id: data.post_id ?? closed.post_id,
      draft: data.draft ? normalizePost(data.draft as Post) : closed.draft ? normalizePost(closed.draft) : undefined,
    };
  } catch (e) {
    // Room is already ended — surface upload failure so the review screen can retry.
    throw e instanceof Error ? e : new Error('Failed to upload recording');
  }
}

/** Upload a local recording blob for a debate that already ended. */
export async function uploadDebateRecording(
  roomId: number,
  videoBlob: Blob,
): Promise<{ status: string; post_id?: number; draft?: Post }> {
  if (!videoBlob.size) {
    throw new Error('Recording file is empty.');
  }
  const response = await withAuthRetry(videoBlob, (form, token) =>
    uploadDebateRecordingForm(roomId, form, token),
  );
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail =
      typeof data.detail === 'string'
        ? data.detail
        : response.status === 413
          ? 'Recording too large for the server to accept.'
          : response.status === 502 || response.status === 503
            ? 'Server is temporarily unavailable. Tap Upload recording to retry.'
            : 'Failed to upload recording';
    throw new Error(detail);
  }
  return {
    status: 'ok',
    post_id: data.post_id,
    draft: data.draft ? normalizePost(data.draft as Post) : undefined,
  };
}

export async function publishDebate(
  roomId: number,
  caption?: string,
): Promise<Post> {
  const data = await apiRequest<{ status: string; post: Post }>(
    `/debates/${roomId}/publish/`,
    { method: 'POST', body: caption !== undefined ? { caption } : {} },
  );
  return normalizePost(data.post);
}

export async function fetchDrafts(): Promise<Post[]> {
  const data = await apiRequest<{ drafts: Post[] }>('/drafts/');
  return data.drafts.map(normalizePost);
}

export async function updatePostCaption(postId: number, caption: string): Promise<Post> {
  const data = await apiRequest<Post>(`/posts/${postId}/`, {
    method: 'PATCH',
    body: { caption },
  });
  return normalizePost(data);
}

export async function publishPost(postId: number, caption?: string): Promise<Post> {
  const data = await apiRequest<{ status: string; post: Post }>(`/posts/${postId}/publish/`, {
    method: 'POST',
    body: caption !== undefined ? { caption } : {},
  });
  return normalizePost(data.post);
}

export async function deletePost(postId: number): Promise<void> {
  await apiRequest(`/posts/${postId}/`, { method: 'DELETE' });
}

export async function sendHostHeartbeat(roomId: number): Promise<void> {
  await apiRequest(`/debates/${roomId}/host-heartbeat/`, { method: 'POST' });
}

export async function clearHostPresence(roomId: number): Promise<void> {
  await apiRequest(`/debates/${roomId}/host-leave/`, { method: 'POST' });
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
