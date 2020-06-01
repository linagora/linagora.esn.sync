'use strict';

const EXPORTED_SYMBOLS = ['getLogger'];

/////
const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

var { ExtensionParent } = ChromeUtils.import("resource://gre/modules/ExtensionParent.jsm");
var extension = ExtensionParent.GlobalManager.getExtension("op-tb-autoconf@linagora.com");

var { Log } = ChromeUtils.import('resource://gre/modules/Log.jsm');
var { Preferences } = ChromeUtils.import('resource://gre/modules/Preferences.jsm');
/////

function getLogger(module) {
  const logger = Log.repository.getLogger('OpTbAutoconf.' + module);
  const profilDir = Cc['@mozilla.org/file/directory_service;1'].getService(Ci.nsIProperties).get('ProfD', Ci.nsIFile);
  const profilDirPath = profilDir.path;
  const logFilePath = `${profilDirPath}/${Preferences.get('extensions.op.autoconf.log.file')}`;
  Preferences.set('extensions.op.autoconf.log.path', logFilePath);

  logger.level = Log.Level.Numbers[Preferences.get('extensions.op.autoconf.log.level')];

  // FileAppender is missing from Thunderbird 68, We will wait for Mozzila team complete Log.jsm module
  // Check here: https://developer.mozilla.org/en-US/docs/Mozilla/JavaScript_code_modules/Log.jsm
  try {
    logger.addAppender(new Log.FileAppender(logFilePath, new Log.BasicFormatter()));
  } catch (error) {
    logger.error('Error when add appender to logger', error);
  }

  return logger;
}
