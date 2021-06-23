import json
from pathlib import Path

from ..apps.routes.models import Route


def load(path, clear, batch_size=100):
    if clear:
        print("Clearing routes...")
        Route.objects.all().delete()

    path = Path(path)
    with path.open() as fp:
        routes = json.load(fp)["data"]

    batch = []
    total = len(routes)
    inserted = 0

    message = f"Loading {total} routes from {path}..."
    print(message, end="")

    for route in routes:
        batch.append(
            Route(
                route_id=route["id"],
                direction=route["direction"],
                type=route["type"],
                name=route["name"],
                short_name=route["short_name"],
                description=route["description"],
            )
        )
        if len(batch) == batch_size:
            Route.objects.bulk_create(batch)
            batch.clear()
            inserted += batch_size
            percent_done = f"{inserted / total:.1%}"
            print(f"\r{message}", end=percent_done, flush=True)

    if batch:
        Route.objects.bulk_create(batch)
        print(f"\r{message}", end="100%", flush=True)

    print(f"\r{message}", end="Done \n", flush=True)
