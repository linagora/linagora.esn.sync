'use strict';

const EXPORTED_SYMBOLS = ['Utils'];

/////

const Cu = Components.utils;

var { ExtensionParent } = ChromeUtils.import("resource://gre/modules/ExtensionParent.jsm");
var extension = ExtensionParent.GlobalManager.getExtension("op-tb-autoconf@linagora.com");

var { Preferences } = ChromeUtils.import('resource://gre/modules/Preferences.jsm');
var { Log } = ChromeUtils.import(extension.rootURI.resolve("modules/Log.jsm"));

/////

class Utils {
  constructor(logger) {
    this.logger = logger;
  }

  find(arrayOrEnumerator, iid, match, primaryKey) {
    const enumerator = arrayOrEnumerator.enumerate ? arrayOrEnumerator.enumerate() : arrayOrEnumerator;

    enumeration: while (enumerator.hasMoreElements()) {
      const server = enumerator.getNext().QueryInterface(iid),
          key = primaryKey ? server[primaryKey] : server.key;

      this.logger.info(`Matching ${iid} ${key} against ${match}`);

      for (const k in match) {
        if (match.hasOwnProperty(k)) {
          if (match[k] !== server[k]) {
            this.logger.debug(`Property ${k} value ${server[k]} does not match ${match[k]}`);

            continue enumeration;
          }
        }
      }

      this.logger.info('Returning matching ' + iid + ': ${key}', { key });

      return server;
    }

    return null;
  }

  copyProperties(source, destination, context) {
    Object.keys(source).forEach(key => {
      let value = source[key];

      // Perform variable substitution against the context, if any
      if (context && typeof value === 'string') {
        value = value.replace(/%(.*)%/, (match, property) => context[property] || match);
      }

      this.logger.debug(`Setting property ${key} to ${value}`);

      try {
        destination[key] = value;
      } catch (e) {
        this.logger.error(`Could not set property ${key}: ${e}`);
      }
    });

    return destination;
  }

  newURI(uri) {
    return Services.io.newURI(uri, 'utf-8', null);
  }

  omit(object, properties) {
    if (!properties) {
      return object;
    }

    const copy = {...object},
        props = Array.isArray(properties) ? properties : [properties];

    props.forEach(prop => delete copy[prop]);

    return copy;
  }

  restartWithPrompt() {
    const strBundle = Services.strings.createBundle('chrome://op-tb-autoconf/locale/op-tb-autoconf.properties');

    if (Services.prompt.confirm(null, strBundle.GetStringFromName('restart.title'), strBundle.GetStringFromName('restart.text'))) {
      this.logger.info('About to restart Thunderbird');

      Services.startup.quit(Services.startup.eForceQuit || Services.startup.eRestart);
    }
  }
}
