#!/usr/bin/env node
const program = require('commander');
const { getArrivals } = require('../trimet');

const stops = [];

program
  .arguments('<stops>')
  .action(value => stops.push(...arrayOf(int)(value)))
  .option('-d, --debug', 'Show additional info to aid debugging')
  .option(
    '-r, --routes <routes>',
    'Include only the specified routes',
    arrayOf(int)
  )
  .option('-U, --no-update', 'Do NOT update periodically')
  .option(
    '-t, --timeout <timeout>',
    'Time between updates (in seconds)',
    range(5),
    30
  )
  .parse(process.argv);

if (!stops.length) {
  console.error('One or more stops must be specified');
  console.error(program.help());
  process.exit(-1);
}

run();

async function run() {
  await get();

  if (program.update) {
    function showMessage() {
      console.log(`\nNext update in ${program.timeout} seconds...\n`);
    }

    showMessage();

    setInterval(async () => {
      await get();
      showMessage();
    }, program.timeout * 1000);
  }
}

function get() {
  return getArrivals(stops, program.routes).then(arrivals => {
    const { count, stops, updateTime } = arrivals;

    if (!count) {
      console.error('No matching arrivals found');
      process.exit(1);
    }

    console.log(updateTime);

    for (let stop of stops) {
      const { id, name, routes } = stop;

      console.log(`\nStop ${id} - ${name}`);

      if (!routes.length) {
        console.log('    No matching routes found at this stop');
      }

      for (let route of routes) {
        const { id, name, arrivals } = route;
        console.log(`    ${name} (${id})`);

        for (let arrival of arrivals) {
          const {
            status,
            distanceAway: { miles },
          } = arrival;
          const distance = miles ? ` - ${miles.toFixed(2)} miles away` : '';
          console.log(`        ${status}${distance}`);

          if (program.debug) {
            console.debug(`        Estimated: ${arrival.estimated}`);
            console.debug(`        Scheduled: ${arrival.scheduled}`);
          }
        }
      }
    }
  });
}

function int(value) {
  if (!/[1-9]\d*/.test(value)) {
    console.error(`Expected an integer; got ${value}`);
    process.exit(-1);
  }
  return parseInt(value, 10);
}

function range(min, max, type) {
  return value => {
    value = (type || int)(value);

    if (min !== undefined && value < min) {
      console.error(
        `Expected a value greater than or equal to ${min}; got ${value}`
      );
      process.exit(-1);
    }

    if (max !== undefined && value >= max) {
      console.error(`Expected a value less than ${max}; got ${value}`);
      process.exit(-1);
    }

    return value;
  };
}

function arrayOf(type) {
  return value => {
    return value
      .split(',')
      .map(item => item.trim())
      .map(item => type(item));
  };
}
