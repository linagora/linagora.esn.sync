'use strict';

var { Services } = ChromeUtils.import('resource://gre/modules/Services.jsm');
var { ExtensionParent } = ChromeUtils.import('resource://gre/modules/ExtensionParent.jsm');
var { ExtensionCommon } = ChromeUtils.import('resource://gre/modules/ExtensionCommon.jsm');
var extension = ExtensionParent.GlobalManager.getExtension('op-tb-autoconf@linagora.com');
var { setInterval, setTimeout, clearInterval } = ChromeUtils.import('resource://gre/modules/Timer.jsm');
var { Preferences } = ChromeUtils.import('resource://gre/modules/Preferences.jsm');
var { httpRequest } = ChromeUtils.import('resource://gre/modules/Http.jsm');

// Breaking changes: https://developer.thunderbird.net/add-ons/tb68/changes

var { Accounts } = ChromeUtils.import(extension.rootURI.resolve('modules/Accounts.jsm'));
var { Addons } = ChromeUtils.import(extension.rootURI.resolve('modules/Addons.jsm'));
var { Passwords } = ChromeUtils.import(extension.rootURI.resolve('modules/Passwords.jsm'));

var { Calendars } = ChromeUtils.import(extension.rootURI.resolve('modules/Calendars.jsm'));
var { Contacts } = ChromeUtils.import(extension.rootURI.resolve('modules/Contacts.jsm'));
var { getLogger } = ChromeUtils.import(extension.rootURI.resolve('modules/Log.jsm'));
var { Prefs } = ChromeUtils.import(extension.rootURI.resolve('modules/Prefs.jsm'));
var { preferences } = ChromeUtils.import(extension.rootURI.resolve('defaults/preferences/constants.js'));

// Manually set default preferences
for (const key in preferences) {
  Prefs.set(key, preferences[key]);
}

const logger = getLogger('Overlay'),
  interval = Preferences.get('extensions.op.autoconf.interval'),
  rootUrl = Preferences.get('extensions.op.autoconf.rootUrl');

logger.info(`Running under Thunderbird v${Services.appinfo.version}`);
logger.info(`Scheduling autoconfiguration every ${interval}ms using ${rootUrl}`);

/////

var OpenPaasAutoconf = class extends ExtensionCommon.ExtensionAPI {
  getAPI(context) {
    context.callOnClose(this);
    return {
      OpenPaasAutoconf: {
        scheduling: function() {
          updateAutoconfiguration();
          setInterval(() => updateAutoconfiguration(), Prefs.get('extensions.op.autoconf.interval') || 3600000);
        }
      }
    };
  }

  /**
   * This function is called if the extension is disabled or removed, or Thunderbird closes
   * We registered it with callOnClose, above.
   * Its main purpose is to unload the JSM we imported above
   */
  close() {
    Cu.unload(extension.rootURI.resolve('modules/Accounts.jsm'));
    Cu.unload(extension.rootURI.resolve('modules/Addons.jsm'));
    Cu.unload(extension.rootURI.resolve('modules/Passwords.jsm'));

    Cu.unload(extension.rootURI.resolve('modules/Calendars.jsm'));
    Cu.unload(extension.rootURI.resolve('modules/Contacts.jsm'));
    Cu.unload(extension.rootURI.resolve('modules/Log.jsm'));
    Cu.unload(extension.rootURI.resolve('modules/Prefs.jsm'));
  }
};

function updateAutoconfiguration() {
  const url = (rootUrl || 'http://localhost:8080') + '/api/user/autoconf',
    credentials = Passwords.getCredentialsForUsername(Prefs.get('extensions.op.autoconf.username'));
  if (credentials.password === null) return;
  logger.info(`About to request autoconfiguration file at ${url}`);

  const xhr = httpRequest(url, {
    onError: function(statusText) {
      if (statusText.message === '401 - Unauthorized') {
        Services.prompt.alert(null, 'Authentication failed', 'Cannot get autoconfiguration file from OpenPaaS server');
        updateAutoconfiguration();
      }
      logger.error(`Could not get autoconfiguration file from ${url}. ${statusText}`);
    },
    onLoad: function(data) {
      Passwords.storeOverallPassword(credentials.username, credentials.password);
      autoconfigure(JSON.parse(data));
    },
    headers: [['Authorization', 'Basic ' + Services.wm.getMostRecentWindow('mail:3pane').btoa(credentials.username + ':' + credentials.password)]]
  });
  xhr.overrideMimeType('application/javascript');
}

function autoconfigure(config) {
  logger.debug(`Starting autoconfiguration with ${config}`);

  Prefs.setupPreferences(config.preferences);
  Prefs.set('extensions.op.autoconf.davUrl', config.davUrl.replace(/\/$/, ''));
  Accounts.setupAccounts(config.accounts);
  Addons.setupAddons(config.addons).then(() => {
    let retryTime = 0;
    // Delay a little time to make sure addons are initialized
    const setUpCalendarAndBook = setInterval(() => {
      let finishSettingUpCalendar = false,
          finishSettingUpContact = false;
      if (Calendars.isLightningInstalled()) {
        Calendars.setupCalendars(config.calendars);
        finishSettingUpCalendar = true;
      }
      if (Contacts.isCardBookInstalled()) {
        Contacts.setupAddressBooks(config.addressbooks);
        finishSettingUpContact = true;
      }
      if (finishSettingUpCalendar && finishSettingUpContact) {
        clearInterval(setUpCalendarAndBook);
      } else {
        retryTime++;
      }
      if (retryTime >= 10) {
        clearInterval(setUpCalendarAndBook);
      }
    }, 2000);
  });
}
