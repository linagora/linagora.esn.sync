module.exports = dependencies => {
  const logger = dependencies('logger');
  const { renderMarkdownForUser } = require('../../lib/guides/renderer')(dependencies);
  const { CATEGORIES } = require('../../lib/constants');

  return {
    renderIosGuide
  };

  function renderIosGuide(req, res) {
    const locale = req.getLocale();

    renderMarkdownForUser(CATEGORIES.ios, locale, req.user)
      .then(html => res.status(200).send(html))
      .catch(err => {
        logger.error('Error while render html guide', err);

        res.status(500).json({ error: {
          code: 500,
          message: 'Server Error',
          details: 'Error while render html guide'
        }});
      });
  }
};
