#!/usr/bin/env node
'use strict';

const { migrate } = require('..');

if (require.main === module) {
  migrate();
}
