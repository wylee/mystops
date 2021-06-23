from django.conf import settings
from django.http import (
    HttpResponse,
    HttpResponseNotFound,
    HttpResponseBadRequest,
    JsonResponse,
)

from mystops.trimet import api


def arrivals(request):
    """Query TriMet API for arrivals.

    This returns the result of :func:`api.get_arrivals` as JSON; see its
    docstring for details on the structure of the returned data.

    """
    params = request.GET
    if "q" not in params:
        return make_error_response(
            400,
            "Missing Query Parameter",
            "The q query parameter is required",
        )
    q = params["q"]
    if not q.strip():
        return make_error_response(
            400,
            "Missing Query Parameter",
            "The q query parameter is required",
        )
    stop_ids = q.split(",")
    for i, stop_id in enumerate(stop_ids):
        try:
            stop_id = int(stop_id)
        except ValueError:
            return make_error_response(
                400,
                f'Bad Stop ID: "{stop_id}"',
                "TriMet stop IDs should be numbers",
            )
        stop_ids[i] = stop_id
    try:
        arrivals = api.get_arrivals(settings.TRIMET.api_key, stop_ids)
    except api.TriMetAPIStopIDNotFoundError as exc:
        return make_error_response(
            404,
            "Stop Not Found",
            f"Stop ID {exc.stop_id} doesn't exist",
        )
    except api.TriMetAPIError as exc:
        return make_error_response(502, f"TriMet API Error", str(exc))
    if arrivals["count"] == 0:
        ess = "" if len(stop_ids) == 1 else "s"
        stop_ids = ', '.join(str(id) for id in stop_ids)
        return make_error_response(
            404,
            "No Arrivals Found",
            f"No arrivals found for stop{ess}: {stop_ids}",
        )
    return JsonResponse(arrivals)


def make_error_response(status, title, message, detail=None):
    return JsonResponse(
        {
            "error": {
                "title": title,
                "message": message,
                "detail": detail,
            }
        },
        status=status,
    )
