import django.contrib.gis.db.models.fields
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    operations = [
        migrations.CreateModel(
            name="Route",
            fields=[
                ("id", models.AutoField(primary_key=True, serialize=False)),
                ("route_id", models.PositiveIntegerField()),
                (
                    "direction",
                    models.CharField(
                        choices=[("inbound", "Inbound"), ("outbound", "Outbound")],
                        max_length=255,
                    ),
                ),
                (
                    "type",
                    models.CharField(
                        choices=[
                            ("bus", "Bus"),
                            ("shuttle", "Shuttle"),
                            ("light-rail", "Light Rail"),
                            ("streetcar", "Portland Streetcar"),
                            ("aerial-tram", "Aerial Tram"),
                            ("commuter-rail", "Commuter Rail"),
                        ],
                        max_length=255,
                    ),
                ),
                ("name", models.TextField()),
                ("short_name", models.TextField()),
                ("description", models.TextField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "db_table": "route",
                "unique_together": {("route_id", "direction")},
            },
        ),
        migrations.CreateModel(
            name="Stop",
            fields=[
                ("id", models.AutoField(primary_key=True, serialize=False)),
                ("stop_id", models.PositiveIntegerField(unique=True)),
                ("name", models.TextField()),
                (
                    "direction",
                    models.CharField(
                        blank=True,
                        choices=[
                            ("eastbound", "Eastbound"),
                            ("northbound", "Northbound"),
                            ("southbound", "Southbound"),
                            ("westbound", "Westbound"),
                        ],
                        max_length=255,
                        null=True,
                    ),
                ),
                ("location", django.contrib.gis.db.models.fields.PointField(srid=4326)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "db_table": "stop",
            },
        ),
        migrations.CreateModel(
            name="StopRoute",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "route",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, to="mystops.route"
                    ),
                ),
                (
                    "stop",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, to="mystops.stop"
                    ),
                ),
            ],
            options={
                "db_table": "stop_route",
            },
        ),
        migrations.AddField(
            model_name="stop",
            name="routes",
            field=models.ManyToManyField(
                through="mystops.StopRoute", to="mystops.route"
            ),
        ),
    ]
