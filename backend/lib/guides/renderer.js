const showdown = require('showdown');
const ejs = require('ejs');
const path = require('path');
const fs = require('fs');
const { CATEGORIES, LOCALES } = require('../constants');

module.exports = dependencies => {
  const esnConfig = dependencies('esn-config');

  return {
    renderMarkdownForUser
  };

  function renderMarkdownForUser(category, locale, user) {
    return esnConfig('autoconf').inModule('core').forUser(user).get()
      .then(config => {
        if (!config) {
          return _readMarkdownFile(CATEGORIES.noconfig, locale)
            .then(markdown => ejs.render(markdown));
        }

        return _readMarkdownFile(category, locale)
          .then(markdown => ejs.render(markdown, { user, config }));
      })
      .then(renderedMarkdown => {
        const converter = new showdown.Converter();

        converter.setFlavor('github');

        return converter.makeHtml(renderedMarkdown);
      });
  }

  function _readMarkdownFile(category, locale) {
    if (!CATEGORIES[category]) {
      return Promise.reject(`No available guide for ${category}`);
    }

    // Fallback to english version if locale is not supported
    const filePath = path.normalize(path.join(__dirname, `../i18n/guides/${CATEGORIES[category]}/${LOCALES.indexOf(locale) !== -1 ? locale : LOCALES[0]}.md`));

    return new Promise((resolve, reject) => {
      fs.readFile(filePath, { encoding: 'utf-8' }, (err, data) => {
        if (err) {
          return reject(err);
        }

        return resolve(data);
      });
    });
  }
};
