from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('HomePage', '0009_debateroom_host_presence'),
    ]

    operations = [
        migrations.AddField(
            model_name='debateroom',
            name='recording_file',
            field=models.FileField(blank=True, null=True, upload_to='debate_recordings/'),
        ),
        migrations.AddField(
            model_name='debateroom',
            name='recording_post',
            field=models.OneToOneField(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='debate_room',
                to='HomePage.videopost',
            ),
        ),
    ]
