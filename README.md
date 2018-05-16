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

NOTE: You'll need a TriMet API key for use in development. You can get
one from the API registration page.

### Installation

`npm install` and then `npm start` should do the trick.

### Stack

* Linux (Ubuntu 16.04)
* PostgreSQL
* PostGIS
* TypeScript
* Node.js
* Express
* React with Redux (thinking of switching to MobX)
* OpenLayers
