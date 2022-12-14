from datetime import datetime, timedelta
from typing import List

from django.conf import settings

from ...models import Route, Stop
from ...trimet import api


def get(request):
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
    stop_id_set = set()
    for i, stop_id in enumerate(stop_ids):
        try:
            stop_id = int(stop_id)
        except ValueError:
            return make_error_response(
                400,
                f'Bad Stop ID: "{stop_id}"',
                "TriMet stop IDs should be numbers",
            )
        stop_id_set.add(stop_id)

    # Ensure stop IDs exist before querying TriMet API
    q = Stop.objects.filter(stop_id__in=stop_id_set)
    existing_stop_ids = q.values_list("stop_id", flat=True)
    num_existing_stop_ids = len(existing_stop_ids)
    num_passed_stop_ids = len(stop_id_set)
    if num_existing_stop_ids != num_passed_stop_ids:
        delta = num_passed_stop_ids - num_existing_stop_ids
        ess, verb = ("", "does") if delta == 1 else ("s", "do")
        not_found = sorted(stop_id_set - set(existing_stop_ids))
        not_found = ", ".join(str(id) for id in not_found)
        return make_error_response(
            404,
            "Stop Not Found",
            f"Stop ID{ess} {verb} not exist: {not_found}",
        )

    if settings.DEBUG and settings.MYSTOPS_USE_FAKE_ARRIVALS_DATA:
        return get_fake_arrival_data(q.all())

    try:
        arrivals = api.get_arrivals(settings.TRIMET_API_KEY, stop_ids)
    except api.TriMetAPIStopIDNotFoundError as exc:
        return make_error_response(
            404,
            "Stop Not Found",
            f"Stop ID {exc.stop_id} does not exist",
        )
    except api.TriMetAPIError as exc:
        return make_error_response(502, "TriMet API Error", str(exc))

    if arrivals["count"] == 0:
        ess = "" if len(stop_ids) == 1 else "s"
        stop_ids = ", ".join(str(id) for id in stop_ids)
        return make_error_response(
            404,
            "No Arrivals Found",
            f"No arrivals found for stop{ess}: {stop_ids}",
        )

    return arrivals


def make_error_response(status, title, explanation, detail=None):
    return status, {
        "title": title,
        "explanation": explanation,
        "detail": detail,
    }


def get_fake_arrival_data(stops: List[Stop]):
    now = datetime.now()
    update_time = now.strftime("%I:%M:%S %p").lstrip("0")
    return {
        "count": len(stops),
        "updateTime": update_time,
        "stops": [get_fake_stop_data(stop) for stop in stops],
    }


def get_fake_stop_data(stop: Stop):
    route: Route = stop.routes.first()
    now = datetime.now().replace(microsecond=0)

    estimated = now + timedelta(minutes=2)
    estimated_str = estimated.isoformat()
    estimated_str = f"{estimated_str}-08:00"

    scheduled = now + timedelta(minutes=1, seconds=30)
    scheduled_str = scheduled.isoformat()
    scheduled_str = f"{scheduled_str}-08:00"

    status = "2 minutes (late)"

    return {
        "id": stop.stop_id,
        "name": f"FAKE {stop.name}",
        "coordinates": [stop.location.x, stop.location.y],
        "routes": [
            {
                "id": route.id,
                "name": f"FAKE {route.name}",
                "arrivals": [
                    {
                        "estimated": estimated,
                        "scheduled": scheduled,
                        "status": status,
                        "distanceAway": {
                            "feet": 5280,
                            "miles": 1.0,
                            "meters": 5280 * 0.3048,
                            "kilometers": 5280 * 0.3048 / 1000.0,
                        },
                        "designation": None,
                    }
                ],
            },
        ],
    }
