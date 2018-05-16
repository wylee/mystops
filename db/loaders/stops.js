'use strict';

const fs = require('fs');

const table = 'stop';

module.exports = {
  load,
  unload,
};

async function load(client, batchSize = 100) {
  const data = fs.readFileSync(`trimet/data/stops.json`);
  const parsed = JSON.parse(data);
  const stops = parsed.data;
  const columns = ['id', 'name', 'direction', 'location'];

  let values = [];

  console.info(`Loading ${stops.length} ${table}s...`);

  for (let stop of stops) {
    const [x, y] = stop.location;
    stop.location = `SRID=4326;POINT(${x} ${y})`;
    values.push(columns.map(column => stop[column]));
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
  console.info(`Deleting stops...`);
  await client.query(`DELETE FROM ${table}`);
  const count = await client.count(table);
  console.info(`${count} ${table}s in database`);
}
