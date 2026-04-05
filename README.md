# MyStops

This application shows bus & train arrivals from TriMet's
TransitTracker™ service. It will allow users to save stops of interest
and view upcoming arrivals on a map or in a list.

## Disclaimer

This application is currently in the initial stages of development and
_should not_ be considered a reliable source for TriMet arrival times or
any other information. Arrival times and other information _should_ be
verified via TriMet's official TransitTracker™ or by other means.

## Planned Features

* Stop lookup by stop ID
* Stop lookup by current location
* Stop lookup by address search (maybe?)
* Saving of looked-up stops
* Grouping of saved stops; e.g., stops near home and work
* Filtering by route per stop; e.g., for the stop near home, only show
  me the MAX Green Line
* Map view of saved stops showing upcoming arrivals using visual cues;
  i.e., highlight stops with arrivals in the next few minutes in green,
  stops with arrivals in ~10 minutes in yellow, etc

## Technical Details

### TriMet API

* Developer site: http://developer.trimet.org/
* API registration: http://developer.trimet.org/appid/registration/
* Arrivals: http://developer.trimet.org/ws_docs/arrivals2_ws.shtml
* Stops: http://developer.trimet.org/ws_docs/stop_location_ws.shtml

You'll need a TriMet API key for use in development. Get one from the
API registration page and it to `settings.development.toml` along with
the output directory for data retrieved from the TriMet API:

```toml
[django]
TRIMET_API_KEY = "1234567890ABCDEFGHIJKLMNO"
TRIMET_DATA_DIR = "./data/trimet"
```

### Installation

```shell
uv sync

# uv sync && npm install
uv run dk install
```

### Development Database Setup (macOS / Homebrew)

```shell
brew install postgresql@17
brew install postgis
```

NOTE: Homebrew's `postgis` package doesn't work with its `postgresql@16`
package so we use version 17 instead.

### Setup

```shell
# NOTE: This can be skipped if you have a global Postgres service running.
uv run run db

uv run run db-setup
uv run dk migrate
uv run run load
```

### Running

```shell
# Start the dev database
uv run run db

# Start dev server and watch for changes
uv run dk start

# Build front end and watch for changes
rolldown --config --watch
```

### Stack

* Linux
* PostgreSQL 16
* PostGIS 3
* Python 3.14
* Django 6
* DjangoKit
* TypeScript
* Lit
* OpenLayers
