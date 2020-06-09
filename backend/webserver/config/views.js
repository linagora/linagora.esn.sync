'use strict';

const express = require('express');
const { FRONTEND_PATH, FRONTEND_PATH_BUILD } = require('../constants');

module.exports = (dependencies, application) => {
  application.use(express.static(process.env.NODE_ENV !== 'production' ? FRONTEND_PATH : FRONTEND_PATH_BUILD));
  application.set('views', FRONTEND_PATH + '/app');
  application.get('/app/*', (req, res) => res.render(req.params[0].replace(/\.html$/, '')));
};
