import os
from typing import Optional

from .models import DebateRoom, VideoPost
from .video_utils import prepare_video_upload


def debate_recording_caption(room: DebateRoom) -> str:
    topic = (room.topic or '').strip()
    return topic or 'Live debate'


def publish_debate_recording(room: DebateRoom, *, video_file=None) -> Optional[VideoPost]:
    """Save a debate recording on the room and ensure a public feed post exists."""
    room.refresh_from_db()

    if video_file:
        prepared = prepare_video_upload(video_file)
        filename = os.path.basename(prepared.name or 'debate_recording.mp4')
        if room.recording_file:
            room.recording_file.delete(save=False)
        room.recording_file.save(filename, prepared, save=True)

    if room.recording_post_id:
        return room.recording_post

    if not room.recording_file:
        return None

    post = VideoPost.objects.create(
        user=room.creator,
        caption=debate_recording_caption(room),
    )
    post.video_file.save(
        os.path.basename(room.recording_file.name),
        room.recording_file,
        save=True,
    )
    room.recording_post = post
    room.save(update_fields=['recording_post'])
    return post
