from django.contrib import admin
from django.contrib.gis.admin import GeoModelAdmin

from . import models

admin.site.register(models.Page)
admin.site.register(models.Route)
admin.site.register(models.Stop, GeoModelAdmin)
admin.site.register(models.StopRoute)
