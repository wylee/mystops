import json
import re
from pathlib import Path

from .request import make_request


def get_stops(api_key, out_dir, overwrite=False):
    """Fetch stops and routes from TriMet API and save as JSON.

    This fetches all stops and their associated routes. Stops and routes
    are saved to separate JSON files in the specified directory.

    The raw data from the TriMet API is also saved into the output
    directory. If the raw data file exists

    """
    out_dir = Path(out_dir)

    # Data from TriMet API as-is
    raw_stops_file = out_dir / "raw_stops.json"

    stops_file = out_dir / "stops.json"
    routes_file = out_dir / "routes.json"

    if not out_dir.exists():
        print(f"Creating output directory: {out_dir}")
        out_dir.mkdir(parents=True)

    if raw_stops_file.exists() and not overwrite:
        print("Reading cached stop data from disk")
        with raw_stops_file.open() as fp:
            data = fp.read()
            data = json.loads(data)
    else:
        print("Fetching stop data from TriMet API")
        response = make_request(
            "stops",
            api_key,
            params={
                "ll": "-122.667369,45.522698",
                "feet": 5280 * 100,
                "showRoutes": "true",
                "showRouteDirs": "true",
            },
        )
        with raw_stops_file.open("w") as fp:
            fp.write(response.text)
        data = response.json()

    root = data["resultSet"]
    results = root["location"]
    query_time = root["queryTime"]
    stops = []
    routes = []
    seen_routes = set()

    for result in results:
        stop_id = result["locid"]
        seen_stop_routes = set()
        stop_routes = []

        stop = {
            "id": stop_id,
            "name": result["desc"],
            "direction": result.get("dir") or None,
            "location": (result["lng"], result["lat"]),
            "routes": stop_routes,
        }

        stops.append(stop)

        route = result.get("route") or ()
        for route_result in route:
            route_id = route_result["route"]
            for dir in route_result["dir"]:
                dir_code = dir["dir"]
                direction = "outbound" if dir_code == 0 else "inbound"
                description = dir["desc"]
                route_key = (route_id, direction)
                stop_route_key = (stop_id, route_id, direction)
                if route_key not in seen_routes:
                    type = route_result["type"]
                    name = route_result["desc"]
                    route = {
                        "id": route_id,
                        "direction": direction,
                        "type": type,
                        "name": name,
                        "description": description,
                    }
                    route["type"] = get_route_type(route)
                    route["short_name"] = get_route_short_name(route)
                    seen_routes.add(route_key)
                    routes.append(route)
                if stop_route_key not in seen_stop_routes:
                    seen_stop_routes.add(stop_route_key)
                    stop_routes.append({"id": route_id, "direction": direction})

    print("Writing stops")
    with stops_file.open("w") as fp:
        stops.sort(key=lambda s: s["id"])
        data = json.dumps(
            {
                "retrieved": query_time,
                "data": stops,
            }
        )
        fp.write(data)

    print("Writing routes")
    with routes_file.open("w") as fp:
        routes.sort(key=lambda r: r["id"])
        data = json.dumps(
            {
                "retrieved": query_time,
                "data": routes,
            }
        )
        fp.write(data)


def get_route_type(route):
    id = route["id"]
    type = route["type"]
    name = route["name"]
    if type == "B":
        if name.endswith("Shuttle"):
            return "shuttle"
        else:
            return "bus"
    if type == "R":
        if name.startswith("MAX"):
            return "light-rail"
        elif name.startswith("Portland Streetcar"):
            return "streetcar"
        elif name.startswith("Aerial Tram"):
            return "aerial-tram"
        elif name.startswith("WES"):
            return "commuter-rail"
        else:
            raise ValueError(f"Could not determine fixed route type for {id}: {type}")
    raise ValueError(f"Unexpected route type for {id}: {type}")


def get_route_short_name(route):
    id = route["id"]
    type = route["type"]
    name = route["name"]
    if type == "bus":
        return str(id)
    elif type == "shuttle":
        parts = name.split(" - ")
        if len(parts) > 1:
            return parts[1]
        return name
    elif type == "light-rail":
        value = re.sub(r"^MAX\s+", "", name)
        value = re.sub(r"\s+Line$", "", name)
        return value
    elif type == "streetcar":
        return name.split(" - ")[1]
    elif type == "aerial-tram":
        return "Aerial Tram"
    elif type == "commuter-rail":
        return "WES"
    raise ValueError(f"Could not determine short name for {id}: {type}")
