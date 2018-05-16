const ENV = process.env.NODE_ENV || 'development';

const merge = require('lodash/merge');
const baseConfig = require('./base.json');
const envConfig = requireOptional(`./${ENV}.json`);
const dbConfig = require('./db.json');
const localConfig = requireOptional('./local.json');

const config = merge(
  { env: ENV },
  baseConfig,
  envConfig,
  { db: dbConfig[ENV] },
  localConfig
);

function requireOptional(path, defaultValue = {}) {
  try {
    return require(path);
  } catch (error) {
    if (error.code !== 'MODULE_NOT_FOUND') {
      throw error;
    }
    return defaultValue;
  }
}

module.exports = config;
