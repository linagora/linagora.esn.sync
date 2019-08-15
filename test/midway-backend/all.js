/* eslint-disable no-process-env */

const chai = require('chai');
const path = require('path');
const fs = require('fs-extra');
const mongoose = require('mongoose');
const testConfig = require('../config/servers-conf');
const basePath = path.resolve(__dirname + '/../../node_modules/linagora-rse');
const tmpPath = path.resolve(__dirname + '/../config/');
const backendPath = path.normalize(__dirname + '/../../backend');
let rse;

before(function(done) {
  require('events').EventEmitter.prototype._maxListeners = 100;

  mongoose.Promise = require('q').Promise;

  chai.use(require('chai-shallow-deep-equal'));
  chai.use(require('sinon-chai'));
  chai.use(require('chai-as-promised'));

  this.testEnv = {
    serversConfig: testConfig,
    basePath: basePath,
    tmp: tmpPath,
    backendPath: backendPath,
    fixtures: path.resolve(basePath, 'test/midway-backend/fixtures'),
    writeDBConfigFile() {
      fs.writeFileSync(tmpPath + '/db.json', JSON.stringify({connectionString: 'mongodb://mongo/tests', connectionOptions: {auto_reconnect: false}}));
    },
    removeDBConfigFile() {
      fs.unlinkSync(tmpPath + '/db.json');
    },
    initCore(callback) {
      mongoose.Promise = require('q').Promise;
      rse.core.init(() => { callback && process.nextTick(callback); });
    }
  };

  process.env.NODE_CONFIG = 'test/config';
  process.env.NODE_ENV = 'test';
  process.env.REDIS_HOST = 'redis';
  process.env.REDIS_PORT = 6379;
  process.env.AMQP_HOST = 'rabbitmq';
  process.env.ES_HOST = 'elasticsearch';

  fs.copySync(this.testEnv.fixtures + '/default.mongoAuth.json', this.testEnv.tmp + '/default.json');

  rse = require('linagora-rse');
  this.helpers = {};

  this.testEnv.moduleManager = rse.moduleManager;
  rse.test.helpers(this.helpers, this.testEnv);
  rse.test.moduleHelpers(this.helpers, this.testEnv);
  rse.test.apiHelpers(this.helpers, this.testEnv);

  const manager = this.testEnv.moduleManager.manager;
  const loader = manager.loaders.code(require('../../index.js'), true);

  manager.appendLoader(loader);
  loader.load('linagora.esn.sync', done);
});

after(function() {
  try {
    fs.unlinkSync(this.testEnv.tmp + '/default.json');
  } catch (e) {
    console.error(e);
  }

  delete process.env.NODE_CONFIG;
  delete process.env.NODE_ENV;
});

beforeEach(function() {
  this.testEnv.writeDBConfigFile();
});

afterEach(function() {
  try {
    mongoose.disconnect();
    this.testEnv.removeDBConfigFile();
  } catch (e) {
    console.error(e);
  }
});
