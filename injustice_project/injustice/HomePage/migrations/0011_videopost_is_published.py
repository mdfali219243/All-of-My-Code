from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('HomePage', '0010_debateroom_recording'),
    ]

    operations = [
        migrations.AddField(
            model_name='videopost',
            name='is_published',
            field=models.BooleanField(default=True),
        ),
    ]
