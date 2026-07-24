import os
from typing import Optional

from .models import DebateRoom, VideoPost
from .video_utils import prepare_video_upload


def debate_recording_caption(room: DebateRoom) -> str:
    topic = (room.topic or '').strip()
    return topic or 'Live debate'


# Convert synchronously only for short clips so Render/gunicorn do not time out
# on long debates. Longer WebM files are kept as-is and can be converted offline.
_SYNC_CONVERT_MAX_BYTES = 40 * 1024 * 1024


def _uploaded_size(video_file) -> int:
    size = getattr(video_file, 'size', None)
    if isinstance(size, int) and size >= 0:
        return size
    try:
        pos = video_file.tell()
        video_file.seek(0, os.SEEK_END)
        size = video_file.tell()
        video_file.seek(pos)
        return int(size or 0)
    except Exception:
        return 0


def _save_recording_file(room: DebateRoom, video_file) -> None:
    """Persist the host recording. Prefer keeping the upload even if MP4 convert fails."""
    name = os.path.basename(getattr(video_file, 'name', None) or 'debate_recording.webm')
    prepared = video_file
    size = _uploaded_size(video_file)

    if size and size <= _SYNC_CONVERT_MAX_BYTES:
        try:
            prepared = prepare_video_upload(video_file)
            name = os.path.basename(prepared.name or name)
        except Exception:
            prepared = video_file
            name = os.path.basename(getattr(video_file, 'name', None) or 'debate_recording.webm')

    if room.recording_file:
        room.recording_file.delete(save=False)
    room.recording_file.save(name, prepared, save=True)


def save_debate_recording_draft(
    room: DebateRoom,
    *,
    video_file=None,
    caption: Optional[str] = None,
) -> Optional[VideoPost]:
    """Save a debate recording as an unpublished draft post."""
    room.refresh_from_db()

    if video_file:
        _save_recording_file(room, video_file)

    if room.recording_post_id:
        post = room.recording_post
        if caption is not None:
            post.caption = caption
            post.save(update_fields=['caption'])
        return post

    if not room.recording_file:
        return None

    post = VideoPost.objects.create(
        user=room.creator,
        caption=caption if caption is not None else debate_recording_caption(room),
        is_published=False,
    )
    post.video_file.save(
        os.path.basename(room.recording_file.name),
        room.recording_file,
        save=True,
    )
    room.recording_post = post
    room.save(update_fields=['recording_post'])
    return post


def publish_debate_draft(room: DebateRoom, *, caption: Optional[str] = None) -> Optional[VideoPost]:
    """Publish an existing debate draft to the public feed."""
    room.refresh_from_db()

    if not room.recording_post_id:
        return None

    post = room.recording_post
    if caption is not None:
        post.caption = caption
    post.is_published = True
    post.save(update_fields=['caption', 'is_published'])
    return post


def publish_debate_recording(room: DebateRoom, *, video_file=None) -> Optional[VideoPost]:
    """Save recording and publish immediately (legacy web UI)."""
    post = save_debate_recording_draft(room, video_file=video_file)
    if not post:
        return None
    return publish_debate_draft(room, caption=post.caption)
