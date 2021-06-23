import json
from pathlib import Path

from django.contrib.gis.geos import Point

from ..apps.stops.models import Stop


def load(path, clear, batch_size=100):
    if clear:
        print("Clearing stops...")
        Stop.objects.all().delete()

    path = Path(path)
    with path.open() as fp:
        stops = json.load(fp)["data"]

    batch = []
    total = len(stops)
    inserted = 0

    message = f"Loading {total} stops from {path}..."
    print(message, end="")

    for stop in stops:
        x, y = stop["location"]
        batch.append(
            Stop(
                stop_id=stop["id"],
                name=stop["name"],
                direction=stop["direction"],
                location=Point(x, y, srid=4326),
            )
        )
        if len(batch) == batch_size:
            Stop.objects.bulk_create(batch)
            batch.clear()
            inserted += batch_size
            percent_done = f"{inserted / total:.1%}"
            print(f"\r{message}", end=percent_done, flush=True)

    if batch:
        Stop.objects.bulk_create(batch)
        print(f"\r{message}", end="100%", flush=True)

    print(f"\r{message}", end="Done \n", flush=True)
