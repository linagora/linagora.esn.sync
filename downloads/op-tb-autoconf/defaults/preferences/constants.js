const EXPORTED_SYMBOLS = ['preferences'];

const preferences = {
  'extensions.op.autoconf.rootUrl' : '<%= web.base_url %>',
  'extensions.op.autoconf.username': '<%= user.preferredEmail %>',
  'extensions.op.autoconf.interval': 3600000,
  'extensions.op.autoconf.log.level': 'DEBUG',
  'extensions.op.autoconf.log.file': 'op-tb-autoconf.log'
};
