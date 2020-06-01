const archiver = require('archiver');
const ejs = require('ejs');
const q = require('q');
const path = require('path');

const PREFS = 'defaults/preferences/constants.js';
const EXTENSION_BASE_PATH = path.normalize(path.join(__dirname, '../../../downloads/op-tb-autoconf/'));

module.exports = dependencies => {
  const esnConfig = dependencies('esn-config'),
        logger = dependencies('logger');

  function downloadTBExtension(req, res) {
    const archive = archiver('zip'),
          user = req.user;

    archive.pipe(res);

    // Add everything but the preferences file...
    archive.glob('**/!(constants.js)', { cwd: EXTENSION_BASE_PATH });

    // ...because we render it through ejs so that it contains proper default values
    esnConfig('web').inModule('core').forUser(user).get()
      .then(web => q.ninvoke(ejs, 'renderFile', EXTENSION_BASE_PATH + PREFS, { user, web }))
      .then(preferences => archive.append(preferences, { name: PREFS }))
      .catch(err => logger.error(`Could not complete autoconfiguration archive. ${err}`))
      .finally(() => archive.finalize());
  }

  return {
    downloadTBExtension
  };
};
