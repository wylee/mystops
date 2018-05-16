const pool = require('./pool');

const PID = process.pid;
let SEQUENCE = 0;

/**
 * Wrapper for lower-level clients from the global pool.
 *
 */
class Client {
  /**
   * Wrap an existing client from the global pool.
   *
   * @param client
   * @param debug
   * @returns {Client}
   */
  constructor(client, debug = false) {
    this.client = client;
    this.debug = debug;
  }

  /**
   * Wrap a new client from the global pool.
   *
   * @param debug
   * @returns {Promise<*|Client>}
   */
  static async fromPool(debug = false) {
    const client = await pool.connect();
    return new Client(client, debug);
  }

  release() {
    return this.client.release();
  }

  query(...args) {
    const id = ++SEQUENCE;
    const startTime = Date.now();
    const preamble = `[DATABASE QUERY PID=${PID} ID=${id} START=${startTime}]`;

    if (this.debug) {
      console.debug(preamble, ...args.filter(arg => arg !== undefined));
    }

    return this.client.query(...args).then(result => {
      if (this.debug) {
        const count = result.rowCount;
        const countString =
          count === null
            ? ''
            : `; returned ${count} row${count === 1 ? '' : 's'}`;
        const elapsedTime = Date.now() - startTime;
        const elapsedTimeString = (elapsedTime / 1000).toFixed(3);
        console.debug(preamble, `Took ${elapsedTimeString}s${countString}`);
      }

      return result;
    });
  }

  /* Transactions */

  begin() {
    return this.query('BEGIN');
  }

  commit() {
    return this.query('COMMIT');
  }

  rollback() {
    return this.query('ROLLBACK');
  }

  /* INSERT */

  insert(table, columns, values) {
    columns = this.prepareColumns(columns);
    const placeholders = this.preparePlaceholders(values);
    const statement = `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`;
    return this.query(statement, values);
  }

  /**
   *
   * @param table
   * @param columns
   * @param values {Array<Array<Any>>}
   * @returns {*}
   */
  bulkInsert(table, columns, values) {
    const preparePlaceholders = this.preparePlaceholders;
    let params = [];
    let placeholders = [];
    let start = 1;

    for (let v of values) {
      params.push(...v);
      placeholders.push(`(${preparePlaceholders(v, start)})`);
      start += v.length;
    }

    columns = this.prepareColumns(columns);
    placeholders = placeholders.join(', ');
    return this.query(
      `INSERT INTO ${table} (${columns}) VALUES ${placeholders}`,
      params
    );
  }

  /* SELECT */

  /**
   *
   * @param table
   * @param columns
   * @param options Can include where, orderBy, and/or limit
   * @returns {*}
   */
  select(table, columns = ['*'], options = {}) {
    columns = this.prepareColumns(columns);

    let statement = [`SELECT ${columns} FROM ${table}`];
    let params;

    if (options.where) {
      const [whereClause, whereParams] = this.prepareWhere(options.where);
      statement.push(whereClause);
      params = whereParams;
    }

    if (options.orderBy) {
      const orderBy = this.prepareColumns(options.orderBy);
      statement.push('ORDER BY', orderBy);
    }

    if (options.limit) {
      statement.push('LIMIT', options.limit);
    }

    statement = statement.join(' ');
    return this.query(statement, params);
  }

  selectByPK(table, pk, columns = ['*'], name = 'id') {
    const where = {};

    if (typeof name === 'string') {
      where[name] = pk;
    } else if (name.constructor === Array) {
      name.forEach((n, i) => (where[n] = pk[i]));
    } else {
      throw new Error('Expected primary key to be a string or an Array');
    }

    return this.select(table, columns, { where }).then(result => {
      const count = result.rowCount;
      if (count === 0) {
        return null;
      }
      if (count > 1) {
        throw new Error(
          `Found multiple rows in table ${table} matching PK: ${pk}`
        );
      }
      return result.rows[0];
    });
  }

  count(table, options = {}) {
    return this.select(
      table,
      [{ selector: 'COUNT(*)', as: 'count' }],
      options
    ).then(result => {
      return result.rows[0].count;
    });
  }

  /* DELETE */

  delete(table, options = {}) {
    let statement = [`DELETE FROM ${table}`];
    let params;

    if (options.where) {
      const [whereClause, whereParams] = this.prepareWhere(options.where);
      statement.push(whereClause);
      params = whereParams;
    }

    statement = statement.join(' ');
    return this.query(statement, params);
  }

  deleteByPK(table, pk, name = 'id') {
    const where = {};

    if (typeof name === 'string') {
      where[name] = pk;
    } else if (name.constructor === Array) {
      name.forEach((n, i) => (where[n] = pk[i]));
    } else {
      throw new Error('Expected primary key to be a string or an Array');
    }

    return this.delete(table, { where }).then(result => {
      const count = result.rowCount;
      if (count === 0) {
        return null;
      }
      if (count > 1) {
        throw new Error(
          `Found multiple rows in table ${table} matching PK: ${pk}`
        );
      }
      return result.rows[0];
    });
  }

  /* UTILITIES */

  prepareColumns(columns) {
    // Returns '"column_1", "column_2", ..., "column_N"' for N columns
    columns = columns.map(c => {
      if (typeof c === 'string') {
        c = {
          name: c,
        };
      }

      if (c.as) {
        c.as = `"${c.as}"`;
      }

      if (c.name) {
        c.name = c.name === '*' ? '*' : `"${c.name}"`;
        return c.as ? `${c.name} AS ${c.as}` : c.name;
      }

      if (c.selector) {
        return c.as ? `${c.selector} AS ${c.as}` : c.selector;
      }

      throw new Error('Column specified without name or selector');
    });
    columns = columns.join(', ');
    return columns;
  }

  preparePlaceholders(values, start = 1) {
    // Returns '$1, $2, ..., $N' for N values
    let placeholders = values.map((_, i) => `$${start + i}`);
    placeholders = placeholders.join(', ');
    return placeholders;
  }

  prepareWhere(where) {
    // Returns '"column_1" = $1 AND "column_2" = $2 ... AND "column_N" = $N
    // TODO: Handle OR, etc?
    let whereClause = [];
    let params = [];

    Object.keys(where).forEach((column, i) => {
      const value = where[column];
      const placeholder = `$${i + 1}`;
      whereClause.push(`"${column}" = ${placeholder}`);
      params.push(value);
    });

    whereClause = ['WHERE', whereClause.join(' AND ')].join(' ');
    return [whereClause, params];
  }
}

module.exports = Client;
