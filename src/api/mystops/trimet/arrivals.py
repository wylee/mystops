import re
import sys
from datetime import datetime

import pytz

from . import exc
from .request import make_request


FEET_TO_METERS = 0.3048
LOCAL_TZ = pytz.timezone("America/Los_Angeles")


def get_arrivals(
    api_key,
    # A list of stop IDs to get arrivals for
    stop_ids,
    # If specified, only arrivals corresponding to these route IDs
    # will be included
    route_ids=(),
):
    """Get arrivals corresponding to stop IDs.

    Arrivals are grouped by stop with the following structure::

        {
            count: number of arrivals
            updateTime: when the arrivals were requested
            stops: [
                {
                    id: stop ID,
                    name: "stop name",
                    coordinates: [x, y],
                    routes: [
                        {
                            id: route ID
                            name: "sign text"
                            arrivals: [
                                {
                                    estimated: estimated arrival time,
                                    scheduled: scheduled arrival time,
                                    status: status,
                                    distanceAway: {
                                        feet: feet away,
                                        miles: miles away,
                                        meters: meters away,
                                        kilometers: kilometers away,
                                    }
                                },
                                ...
                            ]
                        },
                        ...
                    ]
                },
                ...
            ]
        }

    Stops will be sorted by stop ID, routes will be sorted by name, and
    arrivals will be sorted by time.

    """
    current_now = now()

    params = {
        "locIDs": ",".join(str(id) for id in stop_ids),
    }
    response = make_request("arrivals", api_key, params=params, version=2)
    data = response.json()
    root = data["resultSet"]

    if "error" in root:
        error = root["error"]
        error = error.get("content") or "Unknown"
        if error.lower().startswith("location id not found"):
            stop_id = error.lower().rsplit(None, 1)[1]
            raise exc.TriMetAPIStopIDNotFoundError(stop_id)
        raise exc.TriMetAPIError(error)

    arrivals = root.get("arrival") or []
    locations = root.get("location") or []

    result = {
        "count": len(arrivals),
        "updateTime": nice_time(root["queryTime"], True),
        "stops": [
            {
                "id": location["id"],
                "name": location["desc"],
                "coordinates": (location["lng"], location["lat"]),
                "routes": [],
            }
            for location in locations
        ],
    }

    for arrival in arrivals:
        route_id = arrival["route"]

        if route_ids and route_id not in route_ids:
            continue

        status = get_status_for_result(arrival)

        if not status:
            # XXX: Just ignore this arrival???
            result["count"] -= 1
            continue

        stops = result["stops"]
        stop_id = arrival["locid"]
        stop = next((s for s in stops if s["id"] == stop_id), None)
        sign_text = re.sub(r"\s+", " ", arrival["fullSign"])
        estimated = arrival.get("estimated")  # timestamp
        estimated = trimet_timestamp_to_datetime(estimated) if estimated else None
        scheduled = trimet_timestamp_to_datetime(arrival["scheduled"])
        feet_away = arrival.get("feet") or 0
        miles_away = feet_away / 5280.0
        meters_away = feet_away * FEET_TO_METERS
        km_away = meters_away / 1000.0
        distance_away = {
            "feet": feet_away,
            "miles": miles_away,
            "meters": meters_away,
            "kilometers": km_away,
        }

        route = next((r for r in stop["routes"] if r["id"] == route_id), None)

        if route is None:
            route = {"id": route_id, "name": sign_text, "arrivals": []}
            stop["routes"].append(route)

        if estimated:
            delta = estimated - current_now
            delta_seconds = delta.seconds
            if delta_seconds <= 60:
                designation = "red"
            elif delta_seconds <= 180:
                designation = "orange"
            elif delta_seconds <= 300:
                designation = "yellow"
            else:
                designation = None
        else:
            designation = None

        route["arrivals"].append(
            {
                "estimated": estimated,
                "scheduled": scheduled,
                "status": status,
                "distanceAway": distance_away,
                "designation": designation,
            }
        )

    result["stops"].sort(key=lambda s: s["id"])

    for stop in result["stops"]:
        stop["routes"].sort(key=lambda r: r["name"].lower())
        for route in stop["routes"]:
            route["arrivals"].sort(key=lambda r: r["estimated"] or r["scheduled"] or 0)

    return result


def now() -> datetime:
    """Return now in TriMet local time."""
    return datetime.now(tz=LOCAL_TZ)


def trimet_timestamp_to_datetime(timestamp) -> datetime:
    """Convert TriMet timestamp to datetime.

    .. note:: Timestamps returned from the TriMet API are in Portland
        local time *and* they're in milliseconds rather than seconds.

    """
    if not timestamp:
        return None
    timestamp = timestamp / 1000
    result = datetime.fromtimestamp(timestamp, tz=LOCAL_TZ)
    return result


def get_status_for_result(result):
    status = result["status"]
    reason = result.get("reason")
    estimated = result.get("estimated")
    scheduled = result.get("scheduled")
    stop_id = result["locid"]
    route_id = result["route"]

    # XXX: Is this necessary? Is status ever not set?
    if not status:
        print(
            f"Status not set for arrival at stop {stop_id} for route {route_id}",
            file=sys.stderr,
        )
        if estimated:
            status = "estimated"
        elif scheduled:
            status = "scheduled"
        else:
            print(
                f"Couldn't guess status for arrival at stop {stop_id} "
                f"for route {route_id}",
                file=sys.stderr,
            )
            return None

    if status == "estimated":
        timestamp = trimet_timestamp_to_datetime(estimated)
        delta = timestamp - now()
        # XXX: If the estimated arrival time is more than hour away,
        #      fall through and show the scheduled time instead.
        if delta.seconds < 3600:
            value = nice_delta(estimated)
            if scheduled:
                # XXX: This holds TriMet to a slightly higher standard than
                #      they hold themselves. They consider an arrival on
                #      time if it's within 3 minutes early and 5 minutes
                #      late (IIRC and they haven't changed that policy in
                #      the meantime).
                if abs(estimated - scheduled) > 60000:
                    if estimated > scheduled:
                        # Estimated arrival time is after scheduled
                        value = f"{value} (late)"
                    elif estimated < scheduled:
                        # Estimated arrival time is before scheduled
                        value = f"{value} (early)"
            return value
        return f"Scheduled: {nice_time(scheduled)}"
    if status == "scheduled":
        return f"Scheduled: {nice_time(scheduled)}"
    if status == "delayed":
        return f"Delayed: {reason}" if reason else "Delayed"
    if status == "canceled":
        return f"Canceled: {reason}" if reason else "Canceled"
    return "N/A"


def nice_delta(trimet_timestamp, with_seconds=False):
    timestamp = trimet_timestamp_to_datetime(trimet_timestamp)
    delta_seconds = (timestamp - now()).seconds

    if delta_seconds <= 30:
        return "Due"

    if delta_seconds < 60:
        return "Less than a minute"

    days, remaining_seconds = divmod(delta_seconds, 86400)
    hours, remaining_seconds = divmod(remaining_seconds, 3600)
    minutes, seconds = divmod(remaining_seconds, 60)

    if seconds > 45:
        # XXX: The number of minutes is truncated by divMod(). We only want
        #      to round that up if the number of seconds remaining is close
        #      to a minute so that riders won't think they have more time
        #      than they actually do.
        minutes += 1

    parts = []
    if days:
        parts.append(f"{days} day${'' if days == 1 else 's'}")
    if hours:
        parts.append(f"{hours} hour{'' if hours == 1 else 's'}")
    if minutes:
        parts.append(f"{minutes} minute{'' if minutes == 1 else 's'}")

    if with_seconds:
        seconds = int(round(seconds))
        if seconds:
            parts.append(f"{seconds} second{'' if seconds == 1 else 's'}")

    return ", ".join(parts)


def nice_time(trimet_timestamp, with_seconds=False):
    timestamp = trimet_timestamp_to_datetime(trimet_timestamp)
    hours = timestamp.hour
    am_pm = "a.m." if hours < 12 else "p.m."
    minutes = timestamp.minute
    hours = hours % 12 or 12
    if minutes < 10:
        minutes = f"0{minutes}"
    if with_seconds:
        seconds = timestamp.second
        if seconds < 10:
            seconds = f"0{seconds}"
        return f"{hours}:{minutes}:{seconds} {am_pm}"
    return f"{hours}:{minutes} {am_pm}"
