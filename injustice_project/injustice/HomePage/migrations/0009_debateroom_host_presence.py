from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('HomePage', '0008_videopost_shared_from'),
    ]

    operations = [
        migrations.AddField(
            model_name='debateroom',
            name='host_last_seen',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='debateroom',
            name='host_online',
            field=models.BooleanField(default=False),
        ),
    ]
