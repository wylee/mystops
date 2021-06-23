from django.contrib.gis.db import models


class Route(models.Model):
    class Meta:
        db_table = "route"
        unique_together = ("route_id", "direction")

    id = models.AutoField(primary_key=True)

    route_id = models.PositiveIntegerField()

    direction = models.CharField(
        max_length=255,
        choices=(
            ("inbound", "Inbound"),
            ("outbound", "Outbound"),
        ),
    )

    type = models.CharField(
        max_length=255,
        choices=(
            ("bus", "Bus"),
            ("shuttle", "Shuttle"),
            ("light-rail", "Light Rail"),
            ("streetcar", "Portland Streetcar"),
            ("aerial-tram", "Aerial Tram"),
            ("commuter-rail", "Commuter Rail"),
        ),
    )

    name = models.TextField()
    short_name = models.TextField()
    description = models.TextField()

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Route {self.route_id} -> {self.name} -> {self.direction}"
