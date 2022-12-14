from django.conf import settings
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.cache import cache_page

from ....models import Stop

CACHE_TIME = 30 if settings.DEBUG else (6 * 60 * 60)


@cache_page(CACHE_TIME)
def get(_request, id):
    stop = get_object_or_404(Stop, stop_id=id)
    return JsonResponse(
        {
            "stop": {
                "id": stop.stop_id,
                "name": stop.name,
                "direction": stop.direction,
                "location": (stop.location.x, stop.location.y),
            }
        }
    )
