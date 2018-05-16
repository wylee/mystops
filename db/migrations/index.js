const fs = require('fs');
const path = require('path');

const config = require('./migrations.json');
const os = require('os');

module.exports = {
  migrate,
};

async function migrate(client, arg) {
  const migrations = config.migrations.map(name => {
    const fileName = path.join(__dirname, `${name}.sql`);
    const migration = { name, forward: [], reverse: [] };
    const sql = fs.readFileSync(fileName, { encoding: 'utf-8' });
    const sqlLines = sql.split(/\r?\n/);
    let section = migration.forward;

    for (let line of sqlLines) {
      if (/^--/.test(line)) {
        if (/^--\s*REVERSE$/.test(line)) {
          section = migration.reverse;
        }
        continue;
      }
      section.push(line);
    }

    if (migration.forward.length) {
      migration.forward = migration.forward.join(os.EOL);
    } else {
      throw new Error(`No forward migration found for migration: ${name}`);
    }

    if (migration.reverse.length) {
      migration.reverse = migration.reverse.join(os.EOL);
    } else {
      migration.reverse = undefined;
    }

    return migration;
  });

  let result;
  try {
    result = await client.select('migration', ['name', 'applied'], {
      orderBy: ['applied'],
    });
  } catch (error) {
    if (error.message !== 'relation "migration" does not exist') {
      throw error;
    }
    result = { rows: [] };
  }

  const rows = result.rows;
  const alreadyApplied = rows.map(row => row.name);

  for (let migration of migrations) {
    const index = alreadyApplied.indexOf(migration.name);
    if (index > -1) {
      migration.applied = rows[index].applied;
    }
  }

  if (arg === 'revert') {
    if (alreadyApplied.length) {
      const name = alreadyApplied[alreadyApplied.length - 1];
      const migrationToRevert = migrations.find(
        migration => migration.name === name
      );
      return revert(client, migrationToRevert);
    }
    console.info('No applied migrations found to revert');
    return null;
  }

  if (arg === 'revert-all') {
    if (alreadyApplied.length) {
      return revertAll(client, migrations, alreadyApplied);
    }
    console.info('No applied migrations found to revert');
    return null;
  } else if (arg) {
    throw new Error(`Unknown arg passed to migrate: ${arg}`);
  }

  return applyMigrations(client, migrations, alreadyApplied);
}

async function applyMigrations(client, migrations) {
  const startTime = Date.now();
  const migrationsApplied = [];

  for (let migration of migrations) {
    const { name, applied } = migration;

    if (applied) {
      const date = applied.toLocaleDateString();
      const time = applied.toLocaleTimeString();
      console.info(`Skipping migration ${name} applied on ${date} at ${time}`);
      continue;
    }

    console.info(`Running migration ${name}...`);

    try {
      await client.begin();
      await client.query(migration.forward);
      await client.insert('migration', ['name'], [name]);
      await client.commit();
    } catch (error) {
      await client.rollback();
      throw error;
    }

    migrationsApplied.push(migration);
  }

  const elapsedTime = ((Date.now() - startTime) / 1000.0).toFixed(2);

  if (migrationsApplied.length) {
    const ess = migrationsApplied.length === 1 ? '' : 's';
    console.info(
      `Ran ${migrationsApplied.length} migration${ess} in ${elapsedTime}s`
    );
  } else {
    console.info('No unapplied migrations found');
  }

  return migrationsApplied;
}

async function revert(client, migration) {
  const { name, reverse } = migration;
  console.log(`Reverting migration ${name}...`);
  try {
    await client.begin();
    await client.deleteByPK('migration', name, 'name');
    if (reverse) {
      await client.query(reverse);
    }
    await client.commit();
  } catch (error) {
    await client.rollback();
    throw error;
  }
  return migration;
}

async function revertAll(client, migrations, appliedMigrations) {
  const revertedMigrations = [];
  let i = appliedMigrations.length;
  while (i--) {
    const name = appliedMigrations[i];
    const migration = migrations.find(m => m.name === name);
    const { reverse } = migration;
    console.log(`Reverting migration ${name}...`);
    try {
      await client.begin();
      await client.deleteByPK('migration', name, 'name');
      if (reverse) {
        await client.query(reverse);
      }
      await client.commit();
    } catch (error) {
      await client.rollback();
      throw error;
    }
    revertedMigrations.push(migration);
  }
  return revertedMigrations;
}
