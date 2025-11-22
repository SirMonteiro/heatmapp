from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="PostAreaVerde",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("local_latitude", models.FloatField()),
                ("local_longitude", models.FloatField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("titulo", models.CharField(max_length=150)),
                ("modo_acesso", models.CharField(max_length=255)),
                ("descricao", models.TextField(blank=True)),
                ("imagem_nome", models.CharField(max_length=255)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
    ]
