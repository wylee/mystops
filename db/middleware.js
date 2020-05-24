const config = require('../config');
const Client = require('./client');

function transactionMiddleware(req, res, next) {
  Client.fromPool(config.debug).then(client => {
    req.db = client;

    client.begin().then(() => {
      function commit() {
        client.commit().then(() => {
          client.release();
          delete req.db;
        });
      }

      function rollback() {
        client.rollback().then(() => {
          client.release();
          delete req.db;
        });
      }

      res.on('close', (...args) => {
        if (!res.finished) {
          rollback();
        }
      });

      res.on('finish', () => {
        res.statusCode < 400 ? commit() : rollback();
      });

      next();
    });
  });
}

module.exports = {
  transactionMiddleware,
};
