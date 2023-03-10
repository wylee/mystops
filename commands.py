import os
import posixpath
import re
import shutil
from pathlib import Path

import django
from mystops.trimet import api
from runcommands import abort, arg, command, confirm, printer
from runcommands import commands as c
from runcommands.commands import remote, sync
from runcommands.util import flatten_args
from tzlocal import get_localzone

TITLE = "MyStops"
SITE_USER = "mystops"
SRC_PATH = "src/mystops"


@command
def clean(deep=False):
    """Clean up locally.

    This removes build, dist, and cache directories by default.

    Use the `--deep` flag to remove the virtualenv and node_modules
    directories, which shouldn't be removed in a normal cleaning.

    """
    printer.header("Cleaning...")

    rm_dir("build")
    rm_dir("dist")
    rm_dir("static")
    rm_dir(f"{SRC_PATH}/app/build")
    rm_dir(f"{SRC_PATH}/website/static/build")
    rm_dir(".mypy_cache")
    rm_dir(".pytest_cache")
    rm_dir(".ruff_cache")

    pycache_dirs = tuple(Path.cwd().glob("__pycache__"))
    if pycache_dirs:
        count = len(pycache_dirs)
        noun = "directory" if count == 1 else "directories"
        printer.info(f"removing {count} __pycache__ {noun}")
        for d in pycache_dirs:
            rm_dir(d, True)

    if deep:
        printer.warning("Deep cleaning...")
        rm_dir(".venv")
        rm_dir("node_modules")


def rm_dir(name, quiet=False):
    path = Path(name).absolute()
    rel_path = path.relative_to(path.cwd())
    if path.is_dir():
        if not quiet:
            printer.warning(f"removing directory tree: {rel_path}")
        shutil.rmtree(path)
    else:
        if not quiet:
            printer.info(f"directory not present: {rel_path}")


# Database -------------------------------------------------------------


@command
def db(data_dir="/opt/homebrew/var/postgres"):
    """Run postgres locally."""
    c.local(("postgres", "-D", data_dir))


@command
def db_setup():
    """Set up local mystops database."""
    commands = [
        "createuser --login mystops",
        "createdb --owner mystops mystops",
        "psql -c 'create extension postgis' mystops",
    ]
    for cmd in commands:
        result = c.local(cmd, stderr="capture", raise_on_error=False)
        if result.failed:
            if "exists" in result.stderr:
                printer.print("[red]exists[/red]:", cmd)
            else:
                abort(1, result.stderr)


# Docker ---------------------------------------------------------------


@command
def docker():
    """Run `docker compose up`.

    This will create the mystops network and database volume first if
    necessary.

    """
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


# TriMet Data Import ---------------------------------------------------


@command
def load(
    env,
    out_dir: arg(
        short_option="-d",
        help="Directory to save downloaded & processed data into",
    ) = None,
    overwrite: "Overwrite previously downloaded (cached) stop data?" = False,
    clear: "Clear existing records from database?" = True,
):
    """Geta stop data from TriMet API and load into database.

    This combines `get_stops`, `load_stops`, `load_routes`, and
    `load_stop_routes` into a single command for convenience.

    """
    get_stops(env, out_dir, overwrite=overwrite)
    load_stops(env, out_dir, clear=clear)
    load_routes(env, out_dir, clear=clear)
    load_stop_routes(env, out_dir, clear=clear)


@command
def get_stops(
    env,
    out_dir: arg(
        short_option="-d",
        help="Directory to save downloaded & processed stop data into",
    ) = None,
    overwrite: "Overwrite previously downloaded (cached) stop data?" = False,
):
    """Get all stops from TriMet API and save to disk.

    This writes raw stop data from the API to `raw_stops.json`. The raw
    stop data is then processed into `stops.json` and `routes.json`.

    If the raw stop data file is already present, it won't be
    re-downloaded from the TriMet API unless the `overwrite` flag is
    used.

    """
    settings = django_settings(env)
    api_key = settings.TRIMET_API_KEY
    out_dir = out_dir or settings.TRIMET_DATA_DIR
    api.get_stops(api_key, out_dir, overwrite)


@command
def load_stops(
    env,
    data_dir: "Directory to read data from" = None,
    file_name: "Data file name relative to data directory" = "stops.json",
    clear: "Clear existing stops from database?" = True,
):
    """Load stops from disk into database."""
    settings = django_settings(env)

    from mystops.loaders.stops import load

    data_dir = data_dir or settings.TRIMET_DATA_DIR
    path = Path(data_dir) / file_name
    load(path, clear)


@command
def load_routes(
    env,
    data_dir: "Directory to read data from" = None,
    file_name: "Data file name relative to data directory" = "routes.json",
    clear: "Clear existing routes from database?" = True,
):
    """Load routes from disk into database."""
    settings = django_settings(env)

    from mystops.loaders.routes import load

    data_dir = data_dir or settings.TRIMET_DATA_DIR
    path = Path(data_dir) / file_name
    load(path, clear)


@command
def load_stop_routes(
    env,
    data_dir: "Directory to read data from" = None,
    file_name: "Data file name relative to data directory" = "stops.json",
    clear: "Clear existing stop routes from database?" = True,
):
    """Load stop routes from disk into database."""
    settings = django_settings(env)

    from mystops.loaders.stop_routes import load

    data_dir = data_dir or settings.TRIMET_DATA_DIR
    path = Path(data_dir) / file_name
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


@command
def get_arrivals(env, *stop_ids, route_ids=()):
    settings = django_settings(env)
    api_key = settings.TRIMET_API_KEY

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


# Provisioning & Deployment --------------------------------------------


@command
def ansible(env, host, version=None, tags=(), skip_tags=(), extra_vars=()):
    """Run ansible playbook."""
    version = version or c.git_version()

    if isinstance(tags, str):
        tags = (tags,)

    if tags:
        tags = tuple(("--tag", tag) for tag in tags)
    if skip_tags:
        skip_tags = tuple(("--skip-tag", tag) for tag in skip_tags)
    if extra_vars:
        extra_vars = tuple(("--extra-var", f"{n}={v}") for (n, v) in extra_vars.items())

    args = (
        "ansible-playbook",
        "-i",
        f"ansible/{env}",
        "ansible/site.yaml",
        tags,
        skip_tags,
        extra_vars,
        ("--extra-var", f"env={env}"),
        ("--extra-var", f"hostname={host}"),
        ("--extra-var", f"version={version}"),
    )

    cwd = os.path.dirname(__file__)
    cmd = " ".join(flatten_args(args))
    cmd = cmd.replace(" -", "\n  -")
    printer.header(f"Running ansible playbook with CWD = {cwd}")
    printer.print(cmd, style="bold")

    c.local(args, cd=cwd)


@command
def provision(env, host):
    """Provision the deployment host."""
    printer.header(f"Provisioning {host} ({env})")
    ansible(env, host, tags="provision")


@command
def upgrade_remote(env, host):
    """Upgrade the deployment host."""
    printer.header(f"Upgrading {host} ({env})")
    ansible(env, host, tags="provision-update-packages")


def remove_build_dir():
    printer.warning("Removing build directory...", end="")
    c.local("rm -rf build")
    printer.success("Done")


@command
def prepare(
    env,
    host,
    version=None,
    provision_=False,
    clean_: arg(help="Remove build directory? [no]") = True,
):
    """Prepare build locally for deployment."""
    version = version or c.git_version()
    tags = []
    if provision_:
        tags.append("provision")
    tags.append("prepare")

    printer.header(f"Preparing {TITLE} website version {version} for {env}")

    if clean_:
        printer.print()
        remove_build_dir()

    printer.print()

    ansible(env, host, tags=tags, extra_vars={"version": version})


@command
def deploy(
    env: arg(help="Build/deployment environment"),
    host: arg(help="Host to deploy to"),
    version: arg(help="Name of version being deployed [short git hash]") = None,
    provision_: arg(help="Run provisioning steps? [no]") = False,
    prepare_: arg(
        short_option="-r",
        inverse_short_option="-R",
        help="Run local prep steps? [yes]",
    ) = True,
    clean_: arg(help="Remove build directory? [no]") = True,
    app: arg(help="Deploy app? [yes]") = True,
    static: arg(help="Deploy static files? [yes]") = True,
):
    """Deploy site."""
    version = version or c.git_version()
    bool_as_str = lambda b: "yes" if b else "no"

    tags = []
    skip_tags = []
    if provision_:
        tags.append("provision")
    if prepare_:
        tags.append("prepare")
    if not app:
        skip_tags.append("prepare-app")
        skip_tags.append("deploy-app")
    if not static:
        skip_tags.append("prepare-static")
        skip_tags.append("deploy-static")
    tags.append("deploy")

    printer.header(f"Deploying {TITLE} website version {version} to {env}")
    printer.print(f"env = {env}")
    printer.print(f"host = {host}")
    printer.print(f"version = {version}")
    printer.print(f"provision = {bool_as_str(provision_)}")
    printer.print(f"local prep = {bool_as_str(prepare_)}")
    printer.print(f"deploy app = {bool_as_str(app)}")
    printer.print(f"deploy static = {bool_as_str(static)}")

    if clean_ and prepare_:
        printer.print()
        remove_build_dir()

    printer.print()

    ansible(env, host, version, tags=tags, skip_tags=skip_tags)


def get_current_path(host):
    root = f"/sites/{host}"
    readlink_result = remote(
        "readlink current",
        run_as=SITE_USER,
        cd=root,
        stdout="capture",
    )
    current_path = readlink_result.stdout.strip()
    if not current_path:
        abort(404, f"Could not read current link in {root}")
    return current_path


@command
def clean_remote(host, run_as=SITE_USER, dry_run=False):
    """Clean up remote.

    Removes old deployments under the site root.

    """
    root = f"/sites/{host}"
    printer.header(f"Removing old versions from {root}")
    current_path = get_current_path(host)
    current_version = os.path.basename(current_path)
    printer.print(f"Current version: {current_version}\n")

    find_result = remote(
        f"find {root} -mindepth 1 -maxdepth 1 -type d -not -name '.*' -not -name 'pip'",
        run_as=run_as,
        stdout="capture",
    )

    paths = find_result.stdout_lines
    paths = [p for p in paths if re.fullmatch(r"[0-9a-f]{12}", os.path.basename(p))]

    if not paths:
        abort(404, f"No versions found in {root}")

    try:
        paths.remove(current_path)
    except ValueError:
        paths = "\n".join(paths)
        abort(404, f"Current version not found in paths:\n{paths}")

    if paths:
        num_paths = len(paths)
        ess = "" if num_paths == 1 else "s"
        printer.print(f"Found {num_paths} old version{ess}:")
        for path in paths:
            printer.print(path)
        printer.print()
        confirm(
            f"Permanently remove {num_paths} old version{ess}?",
            abort_on_unconfirmed=True,
        )
        printer.print()
    else:
        abort(0, "No versions other than current found; nothing to do", color="warning")

    for path in paths:
        version = os.path.basename(path)

        du_result = remote(
            f"du -sh {path} | awk '{{ print $1 }}'",
            run_as=run_as,
            stdout="capture",
        )
        size = du_result.stdout.strip()

        prefix = "[DRY RUN] " if dry_run else ""
        printer.warning(f"{prefix}Removing version: {version} ({size})... ", end="")

        if not dry_run:
            remote(f"rm -r {path}", run_as=run_as)

        printer.success("Done")


@command
def push_settings(env, host):
    """Push settings for env to current deployment and restart uWSGI.

    This provides a simple way to modify production settings without
    doing a full redeployment.

    """
    current_path = get_current_path(host)
    app_dir = posixpath.join(current_path, "app/")
    printer.header(f"Pushing {env} settings to {host}:{app_dir}")
    sync(f"settings.{env}.toml", app_dir, host, run_as=SITE_USER)
    printer.info("Restarting uWSGI (this can take a while)...", end="")
    remote("systemctl restart uwsgi.service", sudo=True)
    printer.success("Done")


# Utilities ------------------------------------------------------------


def django_settings(env):
    """Get Django settings for env."""
    from django.conf import settings

    os.environ.setdefault("ENV", env)
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "djangokit.core.settings")
    django.setup()
    return settings


def format_datetime(value):
    if not value:
        return "???"
    time_zone = get_localzone()
    value = value.replace(tzinfo=time_zone)
    day = value.day
    hour = (value.hour % 12) or 12
    return value.strftime(f"{day} %b %Y at {hour}:%M %p")
