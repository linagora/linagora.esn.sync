'use strict';

const EXPORTED_SYMBOLS = ['Accounts'];

/////

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

var { ExtensionParent } = ChromeUtils.import('resource://gre/modules/ExtensionParent.jsm');
var extension = ExtensionParent.GlobalManager.getExtension('op-tb-autoconf@linagora.com');

var { getLogger } = ChromeUtils.import(extension.rootURI.resolve('modules/Log.jsm'));
var { Utils } = ChromeUtils.import(extension.rootURI.resolve('modules/Utils.jsm'));
var { Passwords } = ChromeUtils.import(extension.rootURI.resolve('modules/Passwords.jsm'));
var { Prefs } = ChromeUtils.import(extension.rootURI.resolve('modules/Prefs.jsm'));

/////

const logger = getLogger('Accounts'),
      utils = new Utils(logger),
      manager = Cc['@mozilla.org/messenger/account-manager;1'].getService(Ci.nsIMsgAccountManager),
      smtpService = Cc['@mozilla.org/messengercompose/smtp;1'].getService(Ci.nsISmtpService);

const Accounts = {

  setupAccounts: function(accountSpecs) {
    accountSpecs.forEach(accountSpec => {
      const smtpServer = createOrUpdateSmtpServer(accountSpec.smtp),
          imapServer = createOrUpdateImapServer(accountSpec.imap),
          account = createOrUpdateAccount(imapServer);
      if (accountSpec.imap) {
        createOrUpdateImapAccount({
          url: `${accountSpec.imap.hostName}:${accountSpec.imap.port}`,
          username: accountSpec.imap.username
        });
      }

      accountSpec.identities.forEach(identitySpec => {
        let identity = utils.find(account.identities, Ci.nsIMsgIdentity, { identityName: `${identitySpec.fullName} <${identitySpec.email}>` });

        if (!identity) {
          logger.info('About to create a new identity for IMAP server ' + imapServer.key);

          identity = manager.createIdentity();
          identity.smtpServerKey = smtpServer.key;

          identity = utils.copyProperties(identitySpec, identity, imapServer);
          account.addIdentity(identity);
        }

      });
    });
    createOrUpdateDavAccount();
  },
  storePassword: function(url, username) {
    return storeServerPassword({
      serverURI: url,
      username
    });
  }

};

/////

function storeServerPassword(server) {
  const uri = server.serverURI,
      username = server.username,
      password = Passwords.getCredentialsForUsername(username).password;

  server.password = password;
  Passwords.storePassword(uri, username, password);

  return server;
}

function createOrUpdateSmtpServer(smtp) {
  let server = utils.find(smtpService.servers, Ci.nsISmtpServer, { hostname: smtp.hostname });

  if (!server) {
    logger.info('About to create a new SMTP server');

    server = smtpService.createServer();
  }

  return storeServerPassword(utils.copyProperties(smtp, server));
}

function createOrUpdateImapServer(imap) {
  let server = utils.find(manager.allServers, Ci.nsIMsgIncomingServer, { realHostName: imap.hostName, username: imap.username });

  if (!server) {
    logger.info('About to create a new IMAP server');

    server = manager.createIncomingServer(imap.username, imap.hostName, 'imap');
  }

  return storeServerPassword(utils.copyProperties(imap, server));
}

function createOrUpdateDavAccount() {
  const davUrl = Prefs.get('extensions.op.autoconf.davUrl');
  const username = Prefs.get('extensions.op.autoconf.username');
  return storeServerPassword({
    serverURI: davUrl,
    username
  });
}

function createOrUpdateImapAccount(url, username) {
  return storeServerPassword({
    serverURI: url,
    username
  });
}

function createOrUpdateAccount(imapServer) {
  let account = manager.FindAccountForServer(imapServer);

  if (!account) {
    logger.info('About to create a new account for IMAP server ' + imapServer.key);

    account = manager.createAccount();
    account.incomingServer = imapServer;
  }

  return account;
}
