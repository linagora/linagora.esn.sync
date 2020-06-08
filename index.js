'use strict';

const path = require('path');
const AwesomeModule = require('awesome-module');
const glob = require('glob-all');
const Dependency = AwesomeModule.AwesomeModuleDependency;

const FRONTEND_JS_PATH = `${__dirname}/frontend/app/`;
const FRONTEND_JS_PATH_BUILD = __dirname + '/dist/';
const innerApps = ['esn'];

let angularAppModuleFiles, modulesOptions;

if (process.env.NODE_ENV !== 'production') {
  angularAppModuleFiles = glob.sync([
    FRONTEND_JS_PATH + 'app.js',
    FRONTEND_JS_PATH + '**/!(*spec).js'
  ]);

  modulesOptions = {
    localJsFiles: angularAppModuleFiles.map(file => path.resolve(FRONTEND_JS_PATH, file))
  };
} else {
  angularAppModuleFiles = glob.sync([
    FRONTEND_JS_PATH_BUILD + '*.js'
  ]);

  modulesOptions = {
    localJsFiles: angularAppModuleFiles.map(file => path.resolve(FRONTEND_JS_PATH_BUILD, file))
  };
}

const moduleData = {
  shortName: 'sync',
  fullName: 'linagora.esn.sync',
  lessFiles: [],
  angularAppModules: []
};

moduleData.lessFiles.push([moduleData.shortName, [path.resolve(FRONTEND_JS_PATH, 'styles.less')], innerApps]);
moduleData.angularAppModules.push([moduleData.shortName, angularAppModuleFiles, moduleData.fullName, innerApps, modulesOptions]);

module.exports = new AwesomeModule(moduleData.fullName, {
  dependencies: [
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.logger', 'logger'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.esn-config', 'esn-config'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.i18n', 'i18n'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.wrapper', 'webserver-wrapper'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.middleware.authorization', 'authorizationMW')
  ],
  data: moduleData,
  states: {
    lib: (dependencies, callback) => callback(),

    deploy: (dependencies, callback) => {
      const webserverWrapper = dependencies('webserver-wrapper'),
            app = require('./backend/webserver/application')(dependencies);

      moduleData.angularAppModules.forEach(mod => webserverWrapper.injectAngularAppModules.apply(webserverWrapper, mod));
      moduleData.lessFiles.forEach(lessSet => webserverWrapper.injectLess.apply(webserverWrapper, lessSet));
      webserverWrapper.addApp(moduleData.shortName, app);

      return callback();
    },

    start: (dependencies, callback) => callback()
  }
});
