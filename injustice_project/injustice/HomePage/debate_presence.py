from datetime import timedelta

from django.utils import timezone

from .models import DebateRoom

HOST_PRESENCE_TIMEOUT_SECONDS = 90
STALE_DEBATE_HOURS = 24


def mark_stale_hosts_offline():
    cutoff = timezone.now() - timedelta(seconds=HOST_PRESENCE_TIMEOUT_SECONDS)
    DebateRoom.objects.filter(
        is_active=True,
        host_online=True,
    ).filter(
        host_last_seen__lt=cutoff,
    ).update(host_online=False)


def live_debates_queryset():
    mark_stale_hosts_offline()
    cutoff = timezone.now() - timedelta(seconds=HOST_PRESENCE_TIMEOUT_SECONDS)
    return DebateRoom.objects.filter(
        is_active=True,
        host_online=True,
        host_last_seen__gte=cutoff,
    ).select_related('creator')
