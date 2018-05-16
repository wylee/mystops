const { Pool } = require('pg');
const config = require('../config');

const pool = new Pool(config.db.use_env ? undefined : config.db);

module.exports = pool;
