from django.conf import settings
from django.db import connection
from django.http import HttpResponse, HttpResponseBadRequest, JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.cache import cache_page

import mercantile

from .models import Stop


CACHE_TIME = 30 if settings.DEBUG else (6 * 60 * 60)


@cache_page(CACHE_TIME)
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


@cache_page(CACHE_TIME)
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


GEOJSON_STATEMENT = """\
SELECT row_to_json(feature_collection) AS feature_collection FROM (
  SELECT
    'FeatureCollection' AS type,
    (SELECT items FROM (
      SELECT 'name' AS type,
      (SELECT p FROM (SELECT 'EPSG:4326' AS name) AS p) AS properties
    ) AS items) AS crs,
    array_agg(features) AS features FROM (
      SELECT
        'Feature' AS type,
        ST_AsGeoJSON(stop.location)::json AS geometry,
        'stop.' || stop.stop_id::text AS id,
        (SELECT p FROM (
          SELECT
            stop.stop_id AS id,
            stop.name,
            stop.direction,
            string_agg(route.short_name, ', ') AS routes
          ) AS p
        ) AS properties
      FROM
        stop
      JOIN
        stop_route
        ON stop_route.stop_id = stop.id
      JOIN
        route
        ON stop_route.route_id = route.id 
      WHERE
        stop.location && {envelope}
      GROUP BY
        stop.id
      {limit}
    ) AS features
) AS feature_collection;\
"""


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
    envelope = f"ST_MakeEnvelope({','.join(str(c) for c in coords)}, 4326)"
    return envelope


@cache_page(CACHE_TIME)
def geojson(request, *, statement=GEOJSON_STATEMENT):
    envelope = get_envelope(request)
    if isinstance(envelope, HttpResponse):
        return envelope
    limit = request.GET.get("limit")
    limit = int(limit) if limit else ""
    statement = statement.format(envelope=envelope, limit=limit)
    with connection.cursor() as cursor:
        cursor.execute(statement)
        row = cursor.fetchone()
        if row is None:
            return JsonResponse(None)
        data = row[0]
        if data["features"] is None:
            data["features"] = []
        return JsonResponse(row[0], safe=False)


MVT_STATEMENT = """\
SELECT
  ST_AsMVT(q, 'stops')
FROM (
  SELECT
    'stop.' || stop.stop_id::text AS feature_id,
    stop.stop_id AS id,
    stop.name,
    stop.direction,
    string_agg(route.short_name, ', ') as routes,
    ST_AsMVTGeom(
      ST_Transform(stop.location, 3857),
      ST_MakeEnvelope(%s, %s, %s, %s, 3857),
      NULL,
      NULL,
      false
    ) AS geom
  FROM
    stop
  JOIN
    stop_route
    ON stop_route.stop_id = stop.id
  JOIN
    route
    ON stop_route.route_id = route.id
  WHERE
    ST_Intersects(
      ST_Transform(stop.location, 3857),
      ST_MakeEnvelope(%s, %s, %s, %s, 3857)
    )
  GROUP BY
    stop.id
) AS q;\
"""


@cache_page(CACHE_TIME)
def mvt(request, z, x, y, *, statement=MVT_STATEMENT, bounds=mercantile.xy_bounds):
    minx, miny, maxx, maxy = bounds(x, y, z)
    bind_params = (minx, miny, maxx, maxy, minx, miny, maxx, maxy)
    with connection.cursor() as cursor:
        cursor.execute(statement, bind_params)
        row = cursor.fetchone()
        content = row[0]
    return HttpResponse(
        content=content, charset=None, content_type="application/x-protobuf"
    )
