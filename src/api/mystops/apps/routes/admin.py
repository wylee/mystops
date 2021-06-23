from django.contrib import admin
from django.contrib.gis.admin import GeoModelAdmin

from . import models

admin.site.register(models.Route)
