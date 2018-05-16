#!/usr/bin/env node
'use strict';

const { getStops } = require('../trimet');

if (require.main === module) {
  getStops();
}
