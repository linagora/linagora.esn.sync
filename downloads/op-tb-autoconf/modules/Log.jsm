'use strict';

const EXPORTED_SYMBOLS = ['getLogger'];

/////

const Cu = Components.utils;

Cu.import('resource://gre/modules/Log.jsm');
Cu.import('resource://gre/modules/Preferences.jsm');
/////

function getLogger(module) {
  let logger = Log.repository.getLogger('OpTbAutoconf.' + module);
  let profilDir = Cc["@mozilla.org/file/directory_service;1"].
              getService(Ci.nsIProperties).
              get("ProfD", Ci.nsIFile);
  let profilDirPath = profilDir.path;
  let logFilePath = `${profilDirPath}/${Preferences.get('extensions.op.autoconf.log.file')}`;
  Preferences.set('extensions.op.autoconf.log.path', logFilePath);

  logger.level = Log.Level.Numbers[Preferences.get('extensions.op.autoconf.log.level')];

  // FileAppender is missing from Thunderbird 68, We will wait for Mozzila team complete Log.jsm module
  // Check here: https://developer.mozilla.org/en-US/docs/Mozilla/JavaScript_code_modules/Log.jsm
  try {
    logger.addAppender(new Log.FileAppender(logFilePath, new Log.BasicFormatter()));
  } catch(error) {
    logger.error('Error when add appender to logger', error)
  }

  return logger;
}
