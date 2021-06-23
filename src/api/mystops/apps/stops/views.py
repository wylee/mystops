from django.db import connection
from django.http import HttpResponse, HttpResponseBadRequest, JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.cache import cache_page

from .models import Stop


HALF_DAY_IN_SECONDS = 12 * 60 * 60


@cache_page(HALF_DAY_IN_SECONDS)
def index(request):
    """Return all stops as JSON."""
    stops = Stop.objects.all()
    stops = tuple(
        {
            "id": stop.stop_id,
            "name": stop.name,
            "direction": stop.direction,
            "location": (stop.location.x, stop.location.y),
            "created_at": stop.created_at,
            "updated_at": stop.updated_at,
        }
        for stop in stops
    )
    return JsonResponse(
        {
            "stops": stops,
            "count": len(stops),
        }
    )


@cache_page(HALF_DAY_IN_SECONDS)
def stop(request, stop_id):
    stop = get_object_or_404(Stop, stop_id=stop_id)
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


@cache_page(HALF_DAY_IN_SECONDS)
def geojson(request):
    """Return a GeoJSON response."""
    envelope = get_envelope(request)

    if isinstance(envelope, HttpResponse):
        return envelope

    limit = request.GET.get("limit")
    limit = int(limit) if limit else ""

    statement = f"""
        select row_to_json(feature_collection) as feature_collection from (
          select
            'FeatureCollection' as type,

            (select items from (
              select 'name' as type,
              (select p from (select 'EPSG:4326' as name) as p) as properties
            ) as items) as crs,

            array_agg(features) as features from (
              select
                'Feature' as type,
                ST_AsGeoJSON(stop.location)::json as geometry,
                'stop.' || stop.stop_id::text as id,
                (select p from (
                  select
                    stop.stop_id as id,
                    stop.name,
                    stop.direction,
                    string_agg(route.short_name, ', ') as routes
                  ) as p
                ) as properties
              from
                stop
              join
                stop_route
                on stop_route.stop_id = stop.id
              join
                route
                on stop_route.route_id = route.id 
              where
                stop.location && {envelope}
              group by
                stop.id
              {limit}
            ) as features
        ) as feature_collection
    """

    with connection.cursor() as cursor:
        cursor.execute(statement)
        row = cursor.fetchone()
        if row is None:
            return JsonResponse(None)
        data = row[0]
        if data["features"] is None:
            data["features"] = []
        return JsonResponse(row[0], safe=False)


def get_envelope(request):
    """Get envelope for bounding box query parameter ``bbox``."""
    bbox = request.GET.get("bbox")
    if not bbox:
        return HttpResponseBadRequest("bbox query parameter is required")
    coords = bbox.split(",")
    if len(coords) != 4:
        return HttpResponseBadRequest(f"Bad bounding box: {bbox}")
    try:
        coords = tuple(float(c) for c in coords)
    except ValueError:
        return HttpResponseBadRequest(f"Bad bounding box: {bbox}")
    minx, miny, maxx, maxy = coords
    if abs(minx) > 180 or abs(miny) > 90 or abs(maxx) > 180 or abs(maxy) > 90:
        return HttpResponseBadRequest(f"Bad bounding box: {bbox}")
    print(coords)
    envelope = f"ST_MakeEnvelope({','.join(str(c) for c in coords)}, 4326)"
    return envelope
