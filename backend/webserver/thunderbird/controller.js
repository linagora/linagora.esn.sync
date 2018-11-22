const fs = require('fs');
const path = require('path');
const q = require('q');

module.exports = dependencies => {
  const logger = dependencies('logger');
  const { preProcess, toHTML } = require('../../lib/guides/renderer')(dependencies);

  return {
    renderGuide
  };

  function thunderbirdGuideFile(locale) {
    return path.normalize(path.join(__dirname, `../../lib/i18n/guides/thunderbird/${locale}.md`));
  }

  function readLocalizedTemplate(locale) {
    return q.nfcall(fs.readFile, thunderbirdGuideFile(locale), { encoding: 'utf-8' });
  }

  function fallbackToEnglishGuide(locale) {
    return err => {
      logger.warn(`Could not read Thunderbird guide from the filesystem using locale ${locale}. Falling back to english version`, err);

      return readLocalizedTemplate('en');
    };
  }

  function getTemplate(locale) {
    return readLocalizedTemplate(locale)
      .catch(fallbackToEnglishGuide(locale));
  }

  function renderGuide(req, res) {
    const locale = req.getLocale();

    getTemplate(locale)
      .then(preProcess(req.user))
      .then(toHTML)
      .then(
        html => res.status(200).send(html),
        err => res.status(500).json({ error: {
          code: 500,
          message: `Cannot render '${locale}' user guide`, details: err.message
        }})
      );
  }
};
