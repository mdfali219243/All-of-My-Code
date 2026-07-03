import { API_BASE_URL } from '../api/config';

/** Always build media URLs using the same host as the API (works on phone). */
export function normalizeMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  const base = API_BASE_URL.replace(/\/api\/?$/, '');

  if (url.startsWith('/media/')) {
    return `${base}${url}`;
  }

  const mediaIndex = url.indexOf('/media/');
  if (mediaIndex >= 0) {
    return `${base}${url.slice(mediaIndex)}`;
  }

  if (url.startsWith('videos/') || url.startsWith('photos/')) {
    return `${base}/media/${url}`;
  }

  if (!url.startsWith('http')) {
    return `${base}${url.startsWith('/') ? url : `/media/${url}`}`;
  }

  try {
    const parsed = new URL(url);
    return `${base}${parsed.pathname}`;
  } catch {
    return url;
  }
}

export function normalizePost<T extends { image_url?: string | null; video_url?: string | null }>(post: T): T {
  return {
    ...post,
    image_url: normalizeMediaUrl(post.image_url),
    video_url: normalizeMediaUrl(post.video_url),
  };
}
