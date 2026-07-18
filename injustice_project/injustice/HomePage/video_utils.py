import os
import shutil
import subprocess
import tempfile

from django.core.files.base import ContentFile


def ffmpeg_available() -> bool:
    return shutil.which('ffmpeg') is not None


def convert_webm_to_mp4(input_path: str, output_path: str) -> None:
    subprocess.run(
        [
            'ffmpeg',
            '-y',
            '-i',
            input_path,
            '-c:v',
            'libx264',
            '-preset',
            'fast',
            '-crf',
            '23',
            '-c:a',
            'aac',
            '-movflags',
            '+faststart',
            output_path,
        ],
        check=True,
        capture_output=True,
    )


def convert_video_to_mp4(input_path: str, output_path: str) -> None:
    """Alias used by management commands."""
    convert_webm_to_mp4(input_path, output_path)


def prepare_video_upload(uploaded_file):
    """Convert WebM uploads to MP4 when ffmpeg is available (Safari/iOS compatibility)."""
    name = (uploaded_file.name or '').lower()
    if name.endswith('.mp4'):
        return uploaded_file

    if not name.endswith(('.webm', '.mkv', '.mov', '.avi')):
        return uploaded_file

    if not ffmpeg_available():
        return uploaded_file

    with tempfile.TemporaryDirectory() as tmp:
        in_path = os.path.join(tmp, 'input')
        out_path = os.path.join(tmp, 'output.mp4')
        with open(in_path, 'wb') as handle:
            for chunk in uploaded_file.chunks():
                handle.write(chunk)

        convert_webm_to_mp4(in_path, out_path)

        with open(out_path, 'rb') as handle:
            data = handle.read()

    base = os.path.splitext(uploaded_file.name or 'video')[0]
    return ContentFile(data, name=f'{base}.mp4')
