'use strict';

const EXPORTED_SYMBOLS = ['Passwords'];

/////

const Cu = Components.utils;
const Cc = Components.classes;
const Ci = Components.interfaces;
const CC = Components.Constructor;

var { ExtensionParent } = ChromeUtils.import("resource://gre/modules/ExtensionParent.jsm");
var extension = ExtensionParent.GlobalManager.getExtension("op-tb-autoconf@linagora.com");

var { Services } = ChromeUtils.import('resource://gre/modules/Services.jsm');
var { Preferences } = ChromeUtils.import('resource://gre/modules/Preferences.jsm');
var { getLogger } = ChromeUtils.import(extension.rootURI.resolve("modules/Log.jsm"));

/////

const logger = getLogger('Passwords'),
      manager = Cc['@mozilla.org/login-manager;1'].getService(Ci.nsILoginManager),
      LoginInfo = CC('@mozilla.org/login-manager/loginInfo;1', Ci.nsILoginInfo, 'init'),
      REALM = 'ESN',
      FORM_SUBMIT_URL = 'User login';

let strBundle;
try {
  strBundle = Services.strings.createBundle('chrome://locale/op-tb-autoconf.properties');
  strBundle.GetStringFromName('promptUsernameAndPassword.title');
} catch (err) {
  strBundle = Services.strings.createBundle(extension.rootURI.resolve('chrome/locale/en-US/op-tb-autoconf.properties'));
}
const Passwords = {

  getCredentialsForUsername: function(username) {
    const oldLogin = findLogin(username);

    if (oldLogin && oldLogin.length) {
      return oldLogin[0];
    } else {
      const login = { value: username },
          password = {};

      Services.prompt.promptUsernameAndPassword(
        null,
        strBundle.GetStringFromName('promptUsernameAndPassword.title'),
        strBundle.GetStringFromName('promptUsernameAndPassword.text'),
        login,
        password,
        null,
        {}
      );

      return {
        username: login.value,
        password: password.value
      };
    }
  },

  storeOverallPassword(username, password) {
    const url = Preferences.get('extensions.op.autoconf.rootUrl');
    Passwords.storePassword(url, username, password, null, REALM); // Lightning
    Passwords.storePassword(url, username, password, FORM_SUBMIT_URL, null); // CardBook
  },

  storePassword(url, username, password, form = null, realm = REALM) {
    if (!username || !password) {
      return logger.warn(`Cannot store null username or password for ${url}`);
    }

    const allRelatedLogins = findLogin(username),
        login = new LoginInfo(url, form, realm, username, password, '', '');
    const oldLogin = (allRelatedLogins || []).find(lgin => lgin && lgin.hostname === url && lgin.formSubmitURL === form && lgin.httpRealm === realm);
    if (oldLogin) {
      const newLogin = oldLogin.clone();
      newLogin.username = username;
      newLogin.password = password;
      manager.modifyLogin(oldLogin, newLogin);
    } else {
      manager.addLogin(login);
    }

    logger.info(`Successfully stored password for ${username} on ${url} using realm ${realm} and form ${form}`);
    return login;
  }
};

/////

function findLogin(username) {
  const logins = manager.getAllLogins();
  const queriedLogin = logins.filter(function(login) {
    return !username || (login.username === username);
  });
  if (queriedLogin) {
    logger.debug(`Returning found credentials for username ${username}`);
    return queriedLogin;
  }
  return null;
}
