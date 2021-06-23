from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/arrivals/", include("mystops.apps.arrivals.urls")),
    path("api/stops/", include("mystops.apps.stops.urls")),
]
