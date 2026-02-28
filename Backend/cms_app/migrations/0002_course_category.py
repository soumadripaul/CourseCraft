from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('cms_app', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='course',
            name='category',
            field=models.CharField(
                choices=[
                    ('programming', 'Programming'),
                    ('design', 'Design'),
                    ('business', 'Business'),
                    ('marketing', 'Marketing'),
                    ('data_science', 'Data Science'),
                    ('personal_dev', 'Personal Development'),
                    ('other', 'Other'),
                ],
                default='other',
                max_length=50,
            ),
        ),
    ]
