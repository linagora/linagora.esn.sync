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
  logger.addAppender(new Log.FileAppender((logFilePath), new Log.BasicFormatter()));

  return logger;
}
