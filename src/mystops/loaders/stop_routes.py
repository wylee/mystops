import json
import sys
from pathlib import Path

from ..models import Route, Stop, StopRoute


def load(path, clear, batch_size=100):
    if clear:
        print("Clearing stop routes...")
        StopRoute.objects.all().delete()

    path = Path(path)
    with path.open() as fp:
        stops = json.load(fp)["data"]

    stop_records = Stop.objects.all()
    stop_map = {stop.stop_id: stop for stop in stop_records}

    route_records = Route.objects.all()
    route_map = {(route.route_id, route.direction): route for route in route_records}

    batch = []
    total = sum(len(s["routes"]) for s in stops)
    inserted = 0

    message = f"Loading stop routes from {path}..."
    print(message, end="")

    for stop in stops:
        stop_id = stop["id"]

        if stop_id in stop_map:
            stop_pk = stop_map[stop_id].pk
        else:
            print(f"Stop not found: {stop_id}", file=sys.stderr)
            continue

        for route in stop["routes"]:
            route_id = route["id"]
            direction = route["direction"]

            if (route_id, direction) in route_map:
                route_pk = route_map[(route_id, direction)].pk
            else:
                print(
                    f"Route not found: {route_id}/{direction}",
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
