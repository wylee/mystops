'use strict';

const routes = require('./routes');
const stops = require('./stops');
const stopRoute = require('./stopRoute');

module.exports = {
  loadData,
  unloadData,
};

async function loadData(client) {
  await stops.load(client);
  await routes.load(client);
  await stopRoute.load(client);
}

async function unloadData(client) {
  await stopRoute.unload(client);
  await routes.unload(client);
  await stops.unload(client);
}
