import getpass
import os
import shutil

import dotenv

from tzlocal import get_localzone

from runcommands import abort, command, printer
from runcommands import commands as c


@command
def format_code(check=False, where="./"):
    """Format code with black."""
    if check:
        printer.header("Checking code formatting code with black")
        check_arg = "--check"
        raise_on_error = True
    else:
        printer.header("Formatting code with black")
        check_arg = None
        raise_on_error = False
    result = c.local(("black", check_arg, where), raise_on_error=raise_on_error)
    return result


@command
def lint(show_errors=True, where="./", raise_on_error=True):
    """Check for lint with flake8."""
    printer.header("Checking for lint with flake8")
    result = c.local(("flake8", where), stdout="capture", raise_on_error=False)
    pieces_of_lint = len(result.stdout_lines)
    if pieces_of_lint:
        ess = "" if pieces_of_lint == 1 else "s"
        message = f"{pieces_of_lint} piece{ess} of lint found"
        if show_errors:
            message = "\n".join(
                (
                    message,
                    result.stdout.rstrip(),
                    "NOTE: Many lint errors can be fixed by running `run format-code`",
                )
            )
        if raise_on_error:
            abort(result.return_code, message)
        else:
            printer.error(message)
    else:
        printer.success("No lint found")
    return result


# Docker ---------------------------------------------------------------


@command
def db(data_dir="/opt/homebrew/var/postgres"):
    c.local(("postgres", "-D", data_dir))


@command
def db_setup():
    args = {
        "raise_on_error": False,
        "stderr": "capture",
        "environ": {"PGPASSWORD": "mystops"},
    }
    commands = [
        "createuser --login mystops",
        "createdb --owner mystops mystops",
        "psql -c 'create extension postgis' mystops",
    ]
    for cmd in commands:
        result = c.local(cmd, **args)
        if "exists" in result.stderr:
            printer.print("[red]Exists[/red]:", cmd)
        else:
            abort(1, result.stdout)


# Docker ---------------------------------------------------------------


@command
def docker():
    """Run `docker compose up`."""
    network_name = "mystops"
    result = c.local(
        f"docker network inspect {network_name}",
        raise_on_error=False,
        stdout="hide",
    )
    if result.succeeded:
        printer.success(f"Network {network_name} exists")
    else:
        printer.info(f"Creating network {network_name}")
        c.local(f"docker network create {network_name}")

    volume_name = "mystops-postgres-data"
    result = c.local(
        f"docker volume inspect {volume_name}",
        raise_on_error=False,
        stdout="hide",
    )
    if result.succeeded:
        printer.success(f"Volume {volume_name} exists")
    else:
        printer.info(f"Creating volume {volume_name}")
        c.local(f"docker volume create {volume_name}")

    c.local("docker compose up")


# Django ---------------------------------------------------------------


def run_django_command(argv):
    from django.core.management import execute_from_command_line

    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "mystops.settings")
    argv = ["./manage.py"] + list(argv)
    execute_from_command_line(argv)


def django_settings():
    """Get Django settings."""
    import os
    import django
    from django.conf import settings

    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "mystops.settings")
    os.environ.setdefault("LOCAL_SETTINGS_CONFIG_QUIET", "true")
    django.setup()
    return settings


@command
def django(*args):
    """Run a Django management command.

    From the command line, pass additional options after -- like so::

        run django runserver -- --noreload

    """
    run_django_command(args)


@command
def dev_server():
    django("runserver")


@command
def make_migrations():
    django("makemigrations", "stops", "routes")


@command
def migrate(make=True, start_over=False):
    from django.contrib.auth import get_user_model
    from django.db import connection

    django_settings()

    if start_over:
        with connection.cursor() as cursor:
            cursor.execute("drop table if exists stop_route")
            cursor.execute("drop table if exists stop")
            cursor.execute("drop table if exists route")
            cursor.execute("delete from django_migrations where app = 'stops'")
            cursor.execute("delete from django_migrations where app = 'routes'")
        shutil.rmtree("src/api/mystops/apps/stops/migrations", ignore_errors=True)
        shutil.rmtree("src/api/mystops/apps/routes/migrations", ignore_errors=True)

    if make:
        make_migrations()

    django("migrate")

    user_model = get_user_model()
    username = getpass.getuser()
    if not user_model.objects.filter(username=username).exists():
        printer.info("Creating superuser")
        email = f"{username}@mystops.io"
        user_model.objects.create_superuser(username, email, "password")


# Node -----------------------------------------------------------------


@command
def ui():
    c.local("npm start")


# Import ---------------------------------------------------------------


@command
def get_stops(out_dir="./data/trimet", overwrite=False):
    """Get all stops from TriMet API and save to disk."""
    from mystops.trimet import api

    settings = django_settings()
    api_key = settings.TRIMET.api_key
    api.get_stops(api_key, out_dir, overwrite)


@command
def load_stops(path="./data/trimet/stops.json", clear=True):
    """Load stops from disk into database."""
    django_settings()
    from mystops.loaders.stops import load

    load(path, clear)


@command
def load_routes(path="./data/trimet/routes.json", clear=True):
    """Load routes from disk into database."""
    django_settings()
    from mystops.loaders.routes import load

    load(path, clear)


@command
def load_stop_routes(path="./data/trimet/stops.json", clear=True):
    """Load stop routes from disk into database."""
    django_settings()
    from mystops.loaders.stop_routes import load

    load(path, clear)


# Export ---------------------------------------------------------------


@command
def export_stops(destination="all-stops.geojson"):
    """Export all stops as GeoJSON

    Run this, remove `crs` from GeoJSON file, then upload file to Mapbox
    Studio at https://studio.mapbox.com/tilesets/.

    Go to https://studio.mapbox.com/styles/wylee/cjgpolk6s00002rpi4xovx6tc
    and set the new tileset as the source for Stops layers:

        Stops > Labels > Select data
        Stops > Icons > Select data

    Wait for Mapbox to refresh tiles.

    """
    c.local(
        (
            "curl",
            "https://mystops.io/api/stops?bbox=-180,-90,180,90&format=geojson",
            "--output",
            destination,
        )
    )


# Arrivals -------------------------------------------------------------


def load_dotenv(env):
    dotenv_path = f".env.{env}"
    if not os.path.exists(dotenv_path):
        abort(404, f".env file not found: {dotenv_path}")
    dotenv.load_dotenv(dotenv_path)


@command
def get_arrivals(env, *stop_ids, route_ids=()):
    from mystops.trimet import api

    load_dotenv(env)
    api_key = os.environ["TRIMET_API_KEY"]

    result = api.get_arrivals(api_key, stop_ids, route_ids)
    if result["count"] == 0:
        printer.danger("No arrivals found")
        return
    for stop in result["stops"]:
        stop_id = stop["id"]
        stop_name = stop["name"]
        coords = stop["coordinates"]
        lat = f"{coords[1]:0.6f}"
        lon = f"{coords[0]:0.6f}"
        printer.hr()
        printer.hr()
        printer.print(f"Stop {stop_id}\n{stop_name}\n{lat}, {lon}")
        printer.hr()
        routes = stop["routes"]
        for route in routes:
            route_name = route["name"]
            printer.print(route_name)
            printer.hr(color="blue")
            arrivals = route["arrivals"]
            for arrival in arrivals:
                distances = arrival["distanceAway"]
                feet = distances["feet"]
                if feet > 528:
                    miles = distances["miles"]
                    distance = f"{miles:.1f} miles away"
                else:
                    distance = f"{feet:.1f} feet away"
                printer.print(f"{arrival['status']:<23} {distance}")

                estimated = format_datetime(arrival["estimated"])
                scheduled = format_datetime(arrival["scheduled"])
                printer.print(f"Estimated: {estimated}")
                printer.print(f"Scheduled: {scheduled}")
                printer.hr(color="none")


def format_datetime(value):
    if not value:
        return "???"
    time_zone = get_localzone()
    value = value.replace(tzinfo=time_zone)
    day = value.day
    hour = (value.hour % 12) or 12
    return value.strftime(f"{day} %b %Y at {hour}:%M %p")


# Provisioning & Deployment --------------------------------------------


@command
def ansible(env, hostname, version=None, tags=(), skip_tags=(), extra_vars=()):
    version = version or c.git_version()
    if isinstance(tags, str):
        tags = (tags,)
    if tags:
        tags = tuple(("--tag", tag) for tag in tags)
    if skip_tags:
        skip_tags = tuple(("--skip-tag", tag) for tag in skip_tags)
    if extra_vars:
        extra_vars = tuple(("--extra-var", f"{n}={v}") for (n, v) in extra_vars.items())
    c.local(
        (
            "ansible-playbook",
            "-i",
            f"ansible/{env}",
            "ansible/site.yaml",
            tags,
            skip_tags,
            extra_vars,
            ("--extra-var", f"env={env}"),
            ("--extra-var", f"hostname={hostname}"),
            ("--extra-var", f"version={version}"),
        ),
    )


@command
def provision(env, hostname):
    ansible(env, hostname, tags="provision")


@command
def upgrade_remote(env, hostname):
    ansible(env, hostname, tags="provision-update-packages")


@command
def prepare(env, hostname, version=None, provision_=False):
    version = version or c.git_version()
    tags = []
    if provision_:
        tags.append("provision")
    tags.append("prepare")
    printer.hr(f"Preparing MyStops version {version} for deployment")
    ansible(env, hostname, tags=tags, extra_vars={"version": version})


@command
def deploy(
    env,
    hostname,
    version=None,
    provision_=False,
    prepare_=True,
    backend=True,
    frontend=True,
):
    version = version or c.git_version()
    tags = []
    skip_tags = []
    if provision_:
        tags.append("provision")
    if prepare_:
        tags.append("prepare")
    if not backend:
        skip_tags.append("prepare-backend")
        skip_tags.append("deploy-backend")
    if not frontend:
        skip_tags.append("prepare-frontend")
        skip_tags.append("deploy-frontend")
    tags.append("deploy")
    printer.hr(f"Deploying MyStops version {version}")
    ansible(env, hostname, version, tags=tags, skip_tags=skip_tags)
