from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="stops.index"),
    path("geojson", views.geojson, name="stops.geojson"),
    path("mvt/<int:z>/<int:x>/<int:y>", views.mvt, name="stops.mvt"),
    path("<int:stop_id>", views.stop, name="stops.stop"),
]
