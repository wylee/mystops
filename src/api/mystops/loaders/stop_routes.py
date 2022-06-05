import json
import sys
from pathlib import Path

from ..apps.routes.models import Route
from ..apps.stops.models import Stop, StopRoute


def load(path, clear, batch_size=100):
    if clear:
        print("Clearing stop routes...")
        StopRoute.objects.all().delete()

    path = Path(path)
    with path.open() as fp:
        stops = json.load(fp)["data"]

    batch = []
    total = sum(len(s["routes"]) for s in stops)
    inserted = 0

    message = f"Loading stop routes from {path}..."
    print(message, end="")

    for stop in stops:
        routes = stop["routes"]
        q = Stop.objects.values_list("id", flat=True)
        try:
            stop_pk = q.get(stop_id=stop["id"])
        except Stop.DoesNotExist:
            print(f"Stop not found: {stop_id}", file=sys.stderr)
            continue
        for route in routes:
            q = Route.objects.values_list("id", flat=True)
            try:
                route_pk = q.get(route_id=route["id"], direction=route["direction"])
            except Route.DoesNotExist:
                print(
                    f"Route not found: {route['id']}/{route['direction']}",
                    file=sys.stderr,
                )
                continue
            batch.append(StopRoute(stop_id=stop_pk, route_id=route_pk))
            if len(batch) == batch_size:
                StopRoute.objects.bulk_create(batch)
                batch.clear()
                inserted += batch_size
                percent_done = f"{inserted / total:.1%}"
                print(f"\r{message}", end=percent_done, flush=True)

    if batch:
        StopRoute.objects.bulk_create(batch)
        print(f"\r{message}", end="100%", flush=True)

    print(f"\r{message}", end="Done \n", flush=True)
