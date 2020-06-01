'use strict';

const EXPORTED_SYMBOLS = ['Addons'];

/////

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;
var { ExtensionParent } = ChromeUtils.import("resource://gre/modules/ExtensionParent.jsm");
var extension = ExtensionParent.GlobalManager.getExtension("op-tb-autoconf@linagora.com");

var { Services } = ChromeUtils.import('resource://gre/modules/Services.jsm');
var { AddonManager } = ChromeUtils.import('resource://gre/modules/AddonManager.jsm');
var { getLogger } = ChromeUtils.import(extension.rootURI.resolve("modules/Log.jsm"));
var { Utils } = ChromeUtils.import(extension.rootURI.resolve("modules/Utils.jsm"));
var { Prefs } = ChromeUtils.import(extension.rootURI.resolve("modules/Prefs.jsm"));
var { Calendars } = ChromeUtils.import(extension.rootURI.resolve("modules/Calendars.jsm"));
var { Contacts } = ChromeUtils.import(extension.rootURI.resolve("modules/Contacts.jsm"));

/////

const logger = getLogger('Addons'),
      appVersion = Services.appinfo.version,
      utils = new Utils(logger),
      versionComparator = Cc['@mozilla.org/xpcom/version-comparator;1'].getService(Ci.nsIVersionComparator);

const Addons = {

  setupAddons: function(addonSpecs) {
    let installers = [];

    return Promise.all(addonSpecs.map(addonSpec => {
      let id = addonSpec.id,
          name = addonSpec.name || id;

      logger.debug('Setting up addon ${name} ${id}', { id, name });

      let versions = addonSpec.versions.filter(isVersionCompatible).sort(descendingVersionOrder);

      if (versions.length === 0) {
        return logger.warn('No compatible version found for addon ${name}', { name });
      }

      return AddonManager.getAddonByID(id)
        .then(addon => {
          const latestVersion = versions[0];

          // Either the addon is not installed yet or it can be upgraded
          if (!addon || versionComparator.compare(addon.version, latestVersion.version) < 0) {
            Prefs.set('extensions.op.autoconf.addon-' + name + '.version', latestVersion.version);

            return installAddon(installers, name, latestVersion);
          }

          logger.info('Addon ${name} ${id} is up-to-date (${version})', { name, id, version: addon.version });
          return true;
        });
    }));
  }

};

/////

function isVersionCompatible(version) {
  let v = version.version,
      min = version.minAppVersion || '0',
      max = version.maxAppVersion || '*'; // * is greater that anything

  logger.debug('Checking app version ${appVersion} against min ${min} and max ${max} for v${v}', { appVersion, min, max, v });

  return versionComparator.compare(min, appVersion) <= 0 && versionComparator.compare(max, appVersion) >= 0;
}

function isPlatformCompatible(platformSpec) {
  let os = Services.appinfo.OS,
      platform = platformSpec.platform,
      url = platformSpec.url;

  logger.debug('Checking platform ${platform} against ${os} for ${url}', { platform, os, url });

  return os.substring(0, platform.length) === platform;
}

function findCompletedInstallations(installer) {
  let state = installer.state;

  return state === AddonManager.STATE_INSTALLED || state === AddonManager.STATE_INSTALLED_FAILED || state === AddonManager.STATE_DOWNLOAD_FAILED;
}

function descendingVersionOrder(a, b) {
  return versionComparator.compare(b.version, a.version);
}

function findCompatiblePlatformUrl(version) {
  if (!version.platforms) {
    return version.url; // No platform-specific URLs, use a generic one
  }

  let platforms = version.platforms.filter(isPlatformCompatible);

  return platforms.length > 0 ? platforms[0].url : null;
}

function installAddon(installers, name, version) {
  let v = version.version,
      url = findCompatiblePlatformUrl(version);

  if (!url) {
    return logger.warn('No compatible installation URL found for addon ${name} v${v}', { name, v });
  }

  logger.info('About to install addon ${name} v${v} from ${url}', { name, url, v });

  return AddonManager.getInstallForURL(url).then(installer => startAddonInstallation(installers, name, installer));
}

function startAddonInstallation(installers, name, installer) {
  installers.push(installer);

  return new Promise((resolve, reject) => {
    installer.addListener({
      'onInstallEnded': () => {
        return resolve();
      },
      'onDownloadFailed': () => {
        return reject('Download failed');
      },
      'onInstallFailed': () => {
        return reject('Install failed');
      }
    })
    installer.install();
  })
}

function newInstallationListener(installers, name) {
  function log(fn, installation) {
    logger.debug('Install(${fn}) ${name} ${version} ${state} ${progress} ${error}', {
      fn,
      name: installation.name || name,
      version: installation.version,
      state: installation.state,
      progress: installation.progress,
      error: installation.error
    });
  }

  let listener = {};

  [
    'onNewInstall',
    'onDownloadStarted',
    'onDownloadProgress',
    'onDownloadEnded',
    'onInstallStarted',
  ].forEach(fn => listener[fn] = (install) => log(fn, install));

  [
    'onDownloadFailed',
    'onInstallEnded',
    'onInstallFailed'
  ].forEach(fn => listener[fn] = (install) => {
    log(fn, install);

    if (installers.filter(findCompletedInstallations).length === installers.length) {
      
    }
  });

  return listener;
}
