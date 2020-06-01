'use strict';

const EXPORTED_SYMBOLS = ['Contacts'];

/////

const Cu = Components.utils;

let cardbookRepository;

var { ExtensionParent } = ChromeUtils.import('resource://gre/modules/ExtensionParent.jsm');
var extension = ExtensionParent.GlobalManager.getExtension('op-tb-autoconf@linagora.com');

var { getLogger } = ChromeUtils.import(extension.rootURI.resolve('modules/Log.jsm'));
var { Prefs } = ChromeUtils.import(extension.rootURI.resolve('modules/Prefs.jsm'));

/////

const logger = getLogger('Contacts'),
      CARDDAV = 'CARDDAV',
      VCARD = '3.0';

const Contacts = {

  setupAddressBooks: function(books) {
    const davUrl = Prefs.get('extensions.op.autoconf.davUrl'),
        interval = Prefs.get('extensions.op.autoconf.interval'),
        cardBookVersion = Prefs.get('extensions.op.autoconf.addon-CardBook.version');
    let cardbookPreferences;
    try {
      cardbookRepository = ChromeUtils.import('chrome://cardbook/content/cardbookRepository.js').cardbookRepository;
      cardbookPreferences = ChromeUtils.import('chrome://cardbook/content/preferences/cardbookPreferences.js').cardbookPreferences;
    } catch (e) {
      throw new Error('Something went wrong when trying to import CardBook');
    }

    books.forEach(book => {
      const id = book.id,
          name = book.name,
          uri = book.uri;
      const existedAccountURLs = (cardbookRepository.cardbookAccounts || []).map(existedAccount => cardbookPreferences && cardbookPreferences.getUrl(existedAccount && existedAccount[4])).filter(Boolean);
      const duplicateUrl = existedAccountURLs.find(url => url.indexOf(`${davUrl}${uri}`) >= 0);

      if (cardbookRepository.cardbookAccountsCategories[id] || duplicateUrl) {
        logger.info(`Address book ${name} (${id}) already exists in CardBook, skipping`);
        return;
      } else {
        logger.info(`About to create address book ${name} at ${uri} in CardBook`);
        if (Number(cardBookVersion) > 30) {
          cardbookRepository.addAccountToRepository(id, name, CARDDAV, davUrl + uri, book.username, book.color, /* enabled */ true, /* expanded */ true, VCARD, book.readOnly, /*Urnuuid*/ false, /*DBcache*/ false, /*AutoSync*/ true, interval, /* persist */ true);
        } else {
          cardbookRepository.addAccountToRepository(id, name, CARDDAV, davUrl + uri, book.username, book.color, /* enabled */ true, /* expanded */ true, VCARD, book.readOnly, /* persist */ true);
        }
      }
    });
  },

  isCardBookInstalled: function() {
    try {
      cardbookRepository = Cu.import('chrome://cardbook/content/cardbookRepository.js').cardbookRepository;
    } catch (e) {
      throw new Error('Something went wrong when trying to import CardBook');
    }
    const isInstalled = cardbookRepository !== undefined;

    logger.debug('CardBook is ' + (!isInstalled ? 'not ' : '') + 'installed !');
    return isInstalled;
  }

};
