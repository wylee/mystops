from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="stops.index"),
    path(".geojson", views.geojson, name="stops.geojson"),
    path("<int:stop_id>", views.stop, name="stops.stop"),
]
