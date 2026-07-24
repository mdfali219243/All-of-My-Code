import os

from django.core.files import File
from django.core.management.base import BaseCommand

from HomePage.models import VideoPost
from HomePage.video_utils import convert_video_to_mp4, ffmpeg_available


class Command(BaseCommand):
    help = 'Convert existing WebM debate recordings to MP4 for Safari and iOS playback.'

    def handle(self, *args, **options):
        if not ffmpeg_available():
            self.stderr.write('ffmpeg is not installed on this server.')
            return

        converted = 0
        for post in VideoPost.objects.exclude(video_file='').exclude(video_file__isnull=True):
            path = post.video_file.path
            if not path.lower().endswith('.webm') or not os.path.isfile(path):
                continue

            mp4_path = f'{os.path.splitext(path)[0]}.mp4'
            self.stdout.write(f'Converting {path} -> {mp4_path}')
            convert_video_to_mp4(path, mp4_path)

            with open(mp4_path, 'rb') as handle:
                post.video_file.save(os.path.basename(mp4_path), File(handle), save=True)

            os.remove(path)
            converted += 1

        self.stdout.write(self.style.SUCCESS(f'Converted {converted} video(s) to MP4.'))
