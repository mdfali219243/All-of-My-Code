import { API_BASE_URL } from '../api/config';

/** Always build media URLs using the same host as the API (works on phone). */
export function normalizeMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  // Local blob / data URLs must never be rewritten — that breaks debate recording preview.
  if (url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }

  const base = API_BASE_URL.replace(/\/api\/?$/, '');

  if (url.startsWith('/media/')) {
    return `${base}${url}`;
  }

  const mediaIndex = url.indexOf('/media/');
  if (mediaIndex >= 0) {
    return `${base}${url.slice(mediaIndex)}`;
  }

  if (url.startsWith('videos/') || url.startsWith('photos/') || url.startsWith('debate_recordings/')) {
    return `${base}/media/${url}`;
  }

  if (!url.startsWith('http')) {
    return `${base}${url.startsWith('/') ? url : `/media/${url}`}`;
  }

  try {
    const parsed = new URL(url);
    // Keep same-origin absolute media URLs on the API host.
    if (parsed.pathname.includes('/media/')) {
      return `${base}${parsed.pathname}${parsed.search}`;
    }
    return url;
  } catch {
    return url;
  }
}

export function mp4FallbackUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('blob:') || url.startsWith('data:')) return null;
  if (/\.webm(\?|$)/i.test(url)) return url.replace(/\.webm(\?.*)?$/i, '.mp4$1');
  return null;
}

export function normalizePost<T extends { image_url?: string | null; video_url?: string | null }>(post: T): T {
  return {
    ...post,
    image_url: normalizeMediaUrl(post.image_url),
    video_url: normalizeMediaUrl(post.video_url),
  };
}
