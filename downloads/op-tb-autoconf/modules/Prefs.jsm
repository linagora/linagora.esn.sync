'use strict';

const EXPORTED_SYMBOLS = ['Prefs'];

/////

const Cu = Components.utils;

var { ExtensionParent } = ChromeUtils.import("resource://gre/modules/ExtensionParent.jsm");
var extension = ExtensionParent.GlobalManager.getExtension("op-tb-autoconf@linagora.com");
var { Preferences } = ChromeUtils.import('resource://gre/modules/Preferences.jsm');
var { getLogger } = ChromeUtils.import(extension.rootURI.resolve("modules/Log.jsm"));

/////

const logger = getLogger('Prefs');

const Prefs = {

  setupPreferences: function(prefs) {
    prefs.forEach(pref => {
      if (Preferences.isSet(pref.name)) {
        const currentValue = Preferences.get(pref.name);

        if (!pref.overwrite && currentValue !== pref.value) {
          return logger.debug(`Not overwriting pref ${pref.name} current value ${currentValue}`);
        }
      }

      Prefs.set(pref.name, pref.value);
    });
  },

  get: Preferences.get.bind(Preferences),

  set: function(key, value) {
    logger.info(`Setting pref ${key} to ${value}`);

    Preferences.set(key, value);
  }
};
