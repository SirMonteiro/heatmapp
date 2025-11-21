from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db.models import Max
from core.models import User, Post

class Command(BaseCommand):
    help = "Zera streaks dos users que não postaram no dia atual"

    def handle (self, *args, **kwargs):
        hoje = timezone.localdate()
        users = User.objects.all()

        for user in users:
            data_ultimo_post = (
                Post.objects
                .filter(user = user)
                .aggregate(max_date = Max("local_data"))
                .get("max_date")
            )

            if data_ultimo_post != hoje:
                user.streak = 0
                user.save()
            
        self.stdout.write(self.style.SUCCESS("Streaks atualizados!"))
