from django.contrib.gis.db import models


class StopRoute(models.Model):
    class Meta:
        db_table = "stop_route"

    stop = models.ForeignKey("stops.Stop", on_delete=models.CASCADE)
    route = models.ForeignKey("routes.Route", on_delete=models.CASCADE)


class Stop(models.Model):
    class Meta:
        db_table = "stop"

    id = models.AutoField(primary_key=True)

    stop_id = models.PositiveIntegerField(unique=True)

    name = models.TextField()

    direction = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        choices=(
            ("eastbound", "Eastbound"),
            ("northbound", "Northbound"),
            ("southbound", "Southbound"),
            ("westbound", "Westbound"),
        ),
    )

    location = models.PointField()

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    routes = models.ManyToManyField("routes.Route", through=StopRoute)

    def __str__(self):
        string = f"Stop {self.stop_id} -> {self.name}"
        if self.direction:
            string = f"{string} -> {self.direction}"
        return string
