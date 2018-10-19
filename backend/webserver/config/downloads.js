const { DOWNLOAD_PATH } = require('../constants');

module.exports = (dependencies, application) => {
  application.use('/downloads', require('express').static(DOWNLOAD_PATH));
};
