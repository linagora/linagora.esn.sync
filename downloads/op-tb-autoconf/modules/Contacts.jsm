'use strict';

const EXPORTED_SYMBOLS = ['Contacts'];

/////

const Cu = Components.utils;

try {
  Cu.import('chrome://cardbook/content/cardbookRepository.js');
} catch(e) {}

Cu.import('resource://op-tb-autoconf/modules/Log.jsm');
Cu.import('resource://op-tb-autoconf/modules/Prefs.jsm');

/////

const logger = getLogger('Contacts'),
      CARDDAV = 'CARDDAV',
      VCARD = '3.0';

const Contacts = {

  setupAddressBooks: function(books) {
    let davUrl = Prefs.get('extensions.op.autoconf.davUrl');
    let interval = Prefs.get('extensions.op.autoconf.interval')

    books.forEach(book => {
      let id = book.id,
          name = book.name,
          uri = book.uri;

      if (cardbookRepository.cardbookAccountsCategories[id]) {
        return logger.info('Address book ${name} (${id}) already exists in CardBook, skipping', { id, name });
      }

      logger.info('About to create address book ${name} at ${uri} in CardBook', { name, uri });

      cardbookRepository.addAccountToRepository(id, name, CARDDAV, davUrl + uri, book.username, book.color, /* enabled */ true, /* expanded */ true, VCARD, book.readOnly, /*Urnuuid*/ false, /*DBcache*/ false, /*AutoSync*/ true, interval, /* persist */ true);
    });
  },

  isCardBookInstalled: function() {
    let isInstalled = false;

    try {
      isInstalled = cardbookRepository !== undefined;
    } catch(e) {}

    logger.debug('CardBook is ' + (!isInstalled ? 'not ' : '') + 'installed !');

    return isInstalled;
  }

};
