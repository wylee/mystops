'use strict';

const axios = require('axios');
const api = require('./api');

module.exports = {
  getArrivals,
};

const FEET_TO_KILOMETERS = 0.0003048;

/**
 * Get arrivals corresponding to stop IDs.
 *
 * Arrivals are grouped by stop with the following structure:
 *
 *     count: number of arrivals
 *     updateTime: when the arrivals were requested
 *     stops: [{
 *         id: stop
 *         name: stop name
 *         coordinates: [x, y]
 *         routes: [{
 *             id: route ID
 *             name: sign text
 *             arrivals: upcoming arrival info
 *         }, ...]
 *     }, ...]
 *
 * Stops will be sorted by stop ID, routes will be sorted by name, and
 * arrivals will be sorted by time.
 *
 * @param stopIDs {Array} A list of stop IDs to get arrivals for.
 * @param routeIDs {Array?} If specified, only arrivals corresponding to
 *        these route IDs will be included.
 * @returns {Promise}
 */
function getArrivals(stopIDs, routeIDs) {
  const [url, options] = api.getRequestOptions(
    'arrivals',
    {
      locIDs: stopIDs.join(','),
    },
    2
  );

  return axios
    .get(url, options)
    .then(response => {
      const { data } = response;

      if (data.error) {
        throw new Error(data.error.content || 'Unknown error');
      }

      const root = data.resultSet;
      const arrivals = root.arrival || [];
      const locations = root.location || [];

      const result = {
        count: arrivals.length,
        updateTime: niceTime(root.queryTime, true),
        stops: locations.map(location => {
          return {
            id: location.id,
            name: location.desc,
            coordinates: [location.lng, location.lat],
            routes: [],
          };
        }),
      };

      for (let arrival of arrivals) {
        const routeID = arrival.route;

        if (routeIDs && !routeIDs.includes(routeID)) continue;

        const status = getStatusForResult(arrival);

        if (!status) continue;

        const stopID = arrival.locid;
        const stop = result.stops.find(stop => stop.id === stopID);
        const signText = arrival.fullSign.replace(/\s+/, ' ');
        const estimated = arrival.estimated
          ? new Date(arrival.estimated)
          : null;
        const scheduled = new Date(arrival.scheduled);
        const feetAway = arrival.feet;
        const milesAway = feetAway / 5280;
        const kilometersAway = feetAway * FEET_TO_KILOMETERS;
        const distanceAway = {
          miles: milesAway,
          kilometers: kilometersAway,
        };

        let route = stop.routes.find(route => route.id === routeID);

        if (typeof route === 'undefined') {
          route = { id: routeID, name: signText, arrivals: [] };
          stop.routes.push(route);
        }

        route.arrivals.push({ estimated, scheduled, status, distanceAway });
      }

      result.stops.sort((a, b) => a.id - b.id);

      for (let stop of result.stops) {
        stop.routes.sort((a, b) =>
          a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1
        );

        for (let route of stop.routes) {
          route.arrivals.sort((a, b) => {
            return (
              (a.estimated || a.scheduled || 0) -
              (b.estimated || b.scheduled || 0)
            );
          });
        }
      }

      return result;
    })
    .catch(err => {
      console.error(`Could not get arrivals: ${err.message}`);
      throw err;
    });
}

/* Utilities */

function getStatusForResult(result) {
  let { status, reason, estimated, scheduled, stopID, routeID } = result;

  // XXX: Is this necessary?
  if (!status) {
    console.warn(
      `Status not set for arrival at stop ${stopID} for route ${routeID}`
    );
    if (estimated) {
      status = 'estimated';
      console.warn('Guessed status: estimated');
    } else if (scheduled) {
      status = 'scheduled';
      console.warn('Guessed status: scheduled');
    } else {
      console.error('Could not guess status');
      return null;
    }
  }

  switch (status) {
    case 'estimated':
      let value = niceDelta(estimated);

      if (scheduled) {
        // XXX: This holds TriMet to a slightly higher standard than
        //      they hold themselves. They consider an arrival on time
        //      if it's within 3 minutes early and 5 minutes late (IIRC
        //      and they haven't changed that policy in the meantime).
        if (Math.abs(estimated - scheduled) > 60000) {
          if (estimated > scheduled) {
            // Estimated arrival time is after scheduled
            value = `${value} (late)`;
          } else if (estimated < scheduled) {
            // Estimated arrival time is before scheduled
            value = `${value} (early)`;
          }
        }
      }

      return value;
    case 'scheduled':
      return `Scheduled: ${niceTime(scheduled)}`;
    case 'delayed':
      return `Delayed: ${reason || '???'}`;
    case 'canceled':
      return `Canceled: ${reason || '???'}`;
    default:
      return 'N/A';
  }
}

function niceDelta(timestamp, withSeconds = false) {
  const now = new Date().getTime();
  const deltaSeconds = (timestamp - now) / 1000;

  if (deltaSeconds <= 30) {
    return 'Due';
  }

  if (deltaSeconds < 60) {
    return 'Less than a minute';
  }

  let days, hours, minutes, seconds, remainingSeconds;

  [days, remainingSeconds] = divMod(deltaSeconds, 86400);
  [hours, remainingSeconds] = divMod(remainingSeconds, 3600);
  [minutes, seconds] = divMod(remainingSeconds, 60);

  if (seconds > 45) {
    // XXX: The number of minutes is truncated by divMod(). We only want
    //      to round that up if the number of seconds remaining is close
    //      to a minute so that riders won't think they have more time
    //      than they actually do.
    minutes += 1;
  }

  let parts = [];
  if (days) parts.push(`${days} day${days === 1 ? '' : 's'}`);
  if (hours) parts.push(`${hours} hour${hours === 1 ? '' : 's'}`);
  if (minutes) parts.push(`${minutes} minute${minutes === 1 ? '' : 's'}`);

  if (withSeconds) {
    seconds = Math.round(seconds);
    if (seconds) parts.push(`${seconds} second${seconds === 1 ? '' : 's'}`);
  }

  return parts.join(', ');
}

function niceTime(timestamp, withSeconds = false) {
  timestamp = new Date(timestamp);
  let hours = timestamp.getHours();
  let amPm = hours < 12 ? 'a.m.' : 'p.m.';
  let minutes = timestamp.getMinutes();
  hours = hours % 12 || 12;
  if (minutes < 10) {
    minutes = `0${minutes}`;
  }
  if (withSeconds) {
    let seconds = timestamp.getSeconds();
    if (seconds < 10) {
      seconds = `0${seconds}`;
    }
    return `${hours}:${minutes}:${seconds} ${amPm}`;
  }
  return `${hours}:${minutes} ${amPm}`;
}

function divMod(m, n) {
  const quotient = Math.trunc(m / n);
  const remainder = m % n;
  return [quotient, remainder];
}
