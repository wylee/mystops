'use strict';

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const api = require('./api');

module.exports = {
  getStops,
};

const DATA_DIR = path.join(__dirname, 'data');

/**
 * Fetch stops and routes from TriMet API and save as JSON.
 *
 * This fetches all stops and their associated routes. Stops and routes
 * are saved to separate JSON files in the specified directory.
 *
 * @param directory {String} Directory to save stops & routes data into
 * @param quiet {Boolean} Squelch info messages
 * @returns {Promise}
 */
function getStops(directory = DATA_DIR, quiet = false) {
  const [url, options] = api.getRequestOptions('stops', {
    ll: '-122.667369,45.522698',
    feet: 5280 * 100,
    showRoutes: true,
    showRouteDirs: true,
  });
  const stopsFile = path.join(directory, 'stops.json');
  const rawStopsFile = path.join(directory, 'rawStops.json');
  const routesFile = path.join(directory, 'routes.json');

  function info(...args) {
    if (!quiet) {
      console.info(...args);
    }
  }

  function process(data) {
    const root = data.resultSet;
    const results = root.location;
    const queryTime = root.queryTime;
    const stops = [];
    const routes = [];
    const seenRoutes = new Set();

    function stringify(items) {
      items.sort((a, b) => a.id - b.id);
      return JSON.stringify(
        { retrieved: queryTime, data: items },
        undefined,
        2
      );
    }

    info(`Processing ${results.length} stops...`);

    for (let result of results) {
      const stopID = result.locid;
      const seenStopRoutes = new Set();
      const stopRoutes = [];
      const stop = {
        id: stopID,
        name: result.desc,
        direction: result.dir || 'unknown',
        location: [result.lng, result.lat],
        routes: stopRoutes,
      };

      stops.push(stop);

      for (let routeResult of result.route || []) {
        const routeID = routeResult.route;

        for (let dir of routeResult.dir) {
          const direction = dir.dir === 0 ? 'outbound' : 'inbound';
          const description = dir.desc;
          const routeKey = `${routeID}:${direction}`;
          const stopRouteKey = `${stopID}:${routeID}:${direction}`;

          if (!seenRoutes.has(routeKey)) {
            const type = routeResult.type;
            const name = routeResult.desc;
            const route = { id: routeID, direction, type, name, description };
            route.type = getType(route);
            route.short_name = getShortName(route);
            seenRoutes.add(routeKey);
            routes.push(route);
          }

          if (!seenStopRoutes.has(stopRouteKey)) {
            seenStopRoutes.add(stopRouteKey);
            stopRoutes.push({ id: routeID, direction });
          }
        }
      }
    }

    info(`Writing stops...`);
    fs.writeFileSync(stopsFile, stringify(stops));
    info(`Stops saved to ${stopsFile}`);

    info(`Writing routes...`);
    fs.writeFileSync(routesFile, stringify(routes));
    info(`Routes saved to ${routesFile}`);

    return [stops, routes];
  }

  let data;
  try {
    data = fs.readFileSync(rawStopsFile);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      // If the file doesn't exist, that's okay, but any other error
      // should be re-thrown.
      throw error;
    }
  }

  if (data) {
    info(`Got stops from local file ${rawStopsFile}`);
    data = JSON.parse(data);
    data = process(data);
    return Promise.resolve(data);
  }

  return axios
    .get(url, options)
    .then(response => {
      let { data } = response;
      if (data.error) {
        throw new Error(data.error.content || 'Unknown error');
      }
      info(`Got stops from TriMet API; saving raw data to ${rawStopsFile}`);
      fs.writeFileSync(rawStopsFile, JSON.stringify(data, undefined, 2));
      return process(data);
    })
    .catch(err => {
      console.error(`Could not get stops: ${err.message}`);
      throw err;
    });
}

function getType(route) {
  const { id, type, name } = route;
  if (type === 'B') {
    return name.endsWith('Shuttle') ? 'shuttle' : 'bus';
  } else if (type === 'R') {
    if (name.startsWith('MAX')) {
      return 'light-rail';
    } else if (name.startsWith('Portland Streetcar')) {
      return 'streetcar';
    } else if (name.startsWith('Aerial Tram')) {
      return 'aerial-tram';
    } else if (name.startsWith('WES')) {
      return 'commuter-rail';
    }
    throw new Error(`Could not determine fixed route type for ${id}: ${type}`);
  }
  throw new Error(`Unexpected route type for ${id}: ${type}`);
}

function getShortName(route) {
  const { id, name, type } = route;
  switch (type) {
    case 'bus':
      return id.toString();
    case 'shuttle':
      return name.split(' - ')[1] || name;
    case 'light-rail':
      return name.replace(/^MAX\s+/, '').replace(/\s+Line$/, '');
    case 'streetcar':
      return name.split(' - ')[1];
    case 'aerial-tram':
      return 'Aerial Tram';
    case 'commuter-rail':
      return 'WES';
    default:
      throw new Error(`Could not determine short name for ${id}: ${type}`);
  }
}
