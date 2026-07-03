import mimetypes
import os
import re

from django.conf import settings
from django.http import FileResponse, Http404, HttpResponse, StreamingHttpResponse

_RANGE_RE = re.compile(r'bytes=(\d+)-(\d*)', re.IGNORECASE)


def _file_chunks(path, start, length, chunk_size=8192):
    with open(path, 'rb') as f:
        f.seek(start)
        remaining = length
        while remaining > 0:
            data = f.read(min(chunk_size, remaining))
            if not data:
                break
            remaining -= len(data)
            yield data


def serve_media(request, path):
    """Serve files from MEDIA_ROOT with HTTP Range support.

    Mobile video players (iOS AVPlayer, Safari, Android ExoPlayer) require the
    server to honor `Range` requests and reply with `206 Partial Content`.
    Django's default static.serve does not, so videos never start playing.
    """
    media_root = os.path.realpath(settings.MEDIA_ROOT)
    full_path = os.path.realpath(os.path.join(media_root, path))

    if not full_path.startswith(media_root + os.sep):
        raise Http404('Invalid path')
    if not os.path.isfile(full_path):
        raise Http404('Not found')

    file_size = os.path.getsize(full_path)
    content_type = mimetypes.guess_type(full_path)[0] or 'application/octet-stream'

    range_header = request.headers.get('Range', '').strip()
    match = _RANGE_RE.match(range_header) if range_header else None

    if match:
        start = int(match.group(1))
        end = int(match.group(2)) if match.group(2) else file_size - 1
        end = min(end, file_size - 1)

        if start > end or start >= file_size:
            response = HttpResponse(status=416)
            response['Content-Range'] = f'bytes */{file_size}'
            return response

        length = end - start + 1
        response = StreamingHttpResponse(
            _file_chunks(full_path, start, length),
            status=206,
            content_type=content_type,
        )
        response['Content-Length'] = str(length)
        response['Content-Range'] = f'bytes {start}-{end}/{file_size}'
    else:
        response = FileResponse(open(full_path, 'rb'), content_type=content_type)
        response['Content-Length'] = str(file_size)

    response['Accept-Ranges'] = 'bytes'
    response['Cache-Control'] = 'public, max-age=3600'
    return response
