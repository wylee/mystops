'use strict';

const fs = require('fs');

const table = 'route';

module.exports = {
  load,
  unload,
};

async function load(client, batchSize = 100) {
  const data = fs.readFileSync(`trimet/data/routes.json`);
  const parsed = JSON.parse(data);
  const routes = parsed.data;
  const columns = [
    'id',
    'direction',
    'type',
    'name',
    'short_name',
    'description',
  ];

  let values = [];

  console.info(`Loading ${routes.length} ${table}s...`);

  for (let route of routes) {
    values.push(columns.map(column => route[column]));
    if (values.length === batchSize) {
      await client.bulkInsert(table, columns, values);
      values = [];
    }
  }

  if (values.length) {
    await client.bulkInsert(table, columns, values);
  }

  const count = await client.count(table);
  console.info(`${count} ${table}s in database`);
}

async function unload(client) {
  console.info(`Deleting routes...`);
  await client.query(`DELETE FROM ${table}`);
  const count = await client.count(table);
  console.info(`${count} ${table}s in database`);
}
