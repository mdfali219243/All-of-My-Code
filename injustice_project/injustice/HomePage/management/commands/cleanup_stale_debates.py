from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from HomePage.debate_presence import STALE_DEBATE_HOURS
from HomePage.models import DebateRoom


class Command(BaseCommand):
    help = 'Mark long-abandoned debates inactive when the host has not been seen recently.'

    def handle(self, *args, **options):
        cutoff = timezone.now() - timedelta(hours=STALE_DEBATE_HOURS)
        stale = DebateRoom.objects.filter(is_active=True).filter(
            host_last_seen__lt=cutoff,
        ) | DebateRoom.objects.filter(
            is_active=True,
            host_last_seen__isnull=True,
            created_at__lt=cutoff,
        )
        count = stale.update(is_active=False, host_online=False)
        self.stdout.write(f'Deactivated {count} stale debate(s).')
