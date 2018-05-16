'use strict';

const fs = require('fs');

const table = 'stop_route';

module.exports = {
  load,
  unload,
};

async function load(client, batchSize = 100) {
  const data = fs.readFileSync(`trimet/data/stops.json`);
  const parsed = JSON.parse(data);
  const stops = parsed.data;
  const columns = ['stop_id', 'route_id', 'direction'];

  let values = [];

  for (let stop of stops) {
    for (let route of stop.routes) {
      values.push([stop.id, route.id, route.direction]);
    }

    if (values.length >= batchSize) {
      await client.bulkInsert(table, columns, values);
      values = [];
    }
  }

  if (values.length) {
    await client.bulkInsert(table, columns, values);
  }

  const count = await client.count(table);
  console.info(`${count} stop/route associations in database`);
}

async function unload(client) {
  console.info(`Deleting stop/route associations...`);
  await client.query(`DELETE FROM ${table}`);
  const count = await client.count(table);
  console.info(`${count} ${table} in database`);
}
