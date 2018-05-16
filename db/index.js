'use strict';

const loaders = require('./loaders');
const migrations = require('./migrations');
const Client = require('./client');

const scripts = {
  ...loaders,
  ...migrations,
};

if (require.main === module) {
  const scriptName = process.argv[2];
  const script = scripts[scriptName];
  const args = process.argv.slice(3);

  (async function() {
    const client = await Client.fromPool();
    try {
      await script(client, ...args);
    } catch (error) {
      await client.release();
      console.error(error);
      process.exit(1);
    }
    await client.release();
    process.exit(0);
  })().catch(error => console.error(error.stack));
}
