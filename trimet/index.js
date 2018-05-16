'use strict';

const arrivals = require('./arrivals');
const stops = require('./stops');

module.exports = {
  ...arrivals,
  ...stops,
};
