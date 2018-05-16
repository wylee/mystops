const cookieParser = require('cookie-parser');
const createError = require('http-errors');
const express = require('express');
const logger = require('morgan');

const { transactionMiddleware } = require('../db/middleware');
const indexRouter = require('./resources/index');
const stopsRouter = require('./resources/stops');
const arrivalsRouter = require('./resources/arrivals');

const app = express();

app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/', indexRouter);
app.use('/api/stops', transactionMiddleware, stopsRouter);
app.use('/api/arrivals', arrivalsRouter);

app.use((req, res, next) => {
  next(createError(404, `Resource not found: ${req.path}`));
});

app.use((err, req, res, next) => {
  const status = err.status || 500;

  if (status >= 500) {
    console.error(err);
  }

  res.status(status).json({ error: { status, ...err } });
});

module.exports = app;
