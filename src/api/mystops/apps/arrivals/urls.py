from django.urls import path

from . import views

urlpatterns = [
    path("", views.arrivals, name="arrivals"),
]
