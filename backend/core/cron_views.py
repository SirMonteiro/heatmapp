from django.http import JsonResponse, HttpResponseForbidden
from django.views.decorators.http import require_GET
from django.conf import settings
from django.utils import timezone
from django.db.models import Max
from datetime import timedelta

from .models import User, Post


@require_GET
def reset_streaks_cron(request):

    hoje = timezone.localdate()
    ontem = hoje - timedelta(days=1)

    updated = 0
    # itera sobre usuários e zera streak se não postou ontem
    for user in User.objects.all():
        data_ultimo_post = (
            Post.objects.filter(user=user)
            .aggregate(max_date=Max("local_data"))
            .get("max_date")
        )

        if data_ultimo_post != ontem and user.streak != 0:
            user.streak = 0
            user.save()
            updated += 1

    return JsonResponse({"ok": True, "updated": updated, "hoje": str(hoje), "ontem": str(ontem)})