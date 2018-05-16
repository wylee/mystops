'use strict';

const express = require('express');
const createError = require('http-errors');

const router = express.Router();

router.get('/', (req, res, next) => {
  const bbox = req.query.bbox || '0,0,0,0';

  if (bbox === undefined) {
    next(createError(400, 'bbox query parameter is required'));
  }

  const coordinates = bbox.split(',').map(coordinate => parseFloat(coordinate));

  if (coordinates.includes(NaN) || coordinates.length !== 4) {
    return next(createError(400, `Bad bounding box: ${req.query.bbox}`));
  }

  const envelope = `ST_MakeEnvelope(${coordinates.join(', ')}, 4326)`;

  let limit = parseInt(req.query.limit, 10);
  limit = isNaN(limit) ? '' : `LIMIT ${limit}`;

  let statement;

  if (req.query.format === 'geojson') {
    statement = `
      SELECT row_to_json(feature_collection) AS feature_collection FROM (
        SELECT
          'FeatureCollection' AS type,

          (SELECT items FROM (
            SELECT 'name' AS type,
            (SELECT p FROM (SELECT 'EPSG:4326' AS name) AS p) AS properties
          ) AS items) AS crs,

          array_agg(features) AS features FROM (
            SELECT
              'Feature' AS type,
              ST_AsGeoJSON(stop.location)::json AS geometry,
              'stop.' || stop.id::text as id,
              (SELECT p FROM (
                SELECT
                  stop.id,
                  stop.name,
                  stop.direction,
                  string_agg(route.short_name, ', ') AS routes
                ) AS p
              ) AS properties
            FROM stop
            INNER JOIN stop_route
              ON stop.id = stop_route.stop_id
            INNER JOIN route
              ON stop_route.route_id = route.id AND stop_route.direction = route.direction
            WHERE stop.location && ${envelope}
            GROUP BY stop.id
            ${limit}
          ) AS features
      ) AS feature_collection
    `;
  } else {
    statement = `
      SELECT id, name, direction, ST_X(location) AS x, ST_Y(location) AS y
      FROM stop
      WHERE location && ${envelope}
      ${limit}
    `;
  }

  req.db
    .query(statement)
    .then(result => {
      if (!result.rowCount) {
        return next(createError(404, 'No matching stops found'));
      }
      if (req.query.format === 'geojson') {
        res.send(result.rows[0].feature_collection);
      } else {
        res.send(result.rows);
      }
    })
    .catch(error => {
      return next(createError(500, error));
    });
});

router.get('/:id(\\d{1,10})', (req, res, next) => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    return next(createError(404, `Bad stop ID: ${req.params.id}`));
  }

  const columns = [
    'id',
    'name',
    'direction',
    { selector: 'ST_AsGeoJSON("location", 6)::json', as: 'location' },
  ];

  req.db
    .selectByPK('stop', id, columns)
    .then(row => {
      if (!row) {
        return next(createError(404, `No stop found with ID: ${id}`));
      }
      return res.json(row);
    })
    .catch(error => {
      return next(createError(500, error));
    });
});

module.exports = router;
