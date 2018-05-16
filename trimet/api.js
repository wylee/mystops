'use strict';

const config = require('../config');

module.exports = {
  getRequestOptions,
};

function getRequestOptions(service, params = {}, apiVersion = 1) {
  const url = `http://developer.trimet.org/ws/v${apiVersion}/${service}`;
  return [
    url,
    {
      params: {
        ...params,
        appID: config.trimet.apiKey,
        json: true,
      },
    },
  ];
}
