const express = require('express');
const createError = require('http-errors');
const { getArrivals } = require('../../trimet');

const router = express.Router();

const STOP_ID_REGEX = /^\d{1,10}$/;

router.get('/', (req, res, next) => {
  const query = req.query.q;

  if (query === undefined) {
    return next(createError(400, 'q query parameter is required'));
  }

  const stopIDs = query.split(',').map(s => s.trim());

  for (let stopID of stopIDs) {
    if (!STOP_ID_REGEX.test(stopID)) {
      return next(createError(400, `Bad stop ID: ${stopID}`));
    }
  }

  getArrivals(stopIDs).then(arrivals => {
    if (!arrivals.count) {
      res.status(404);
    }
    res.json(arrivals);
  });
});

module.exports = router;
