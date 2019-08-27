const fs = require('fs');
const path = require('path');
const { expect } = require('chai');
const request = require('supertest');

describe('GET /android/guide', function() {
  const password = 'secret';
  let app, helpers, user;

  beforeEach(function(done) {
    helpers = this.helpers;
    app = helpers.modules.current.app;

    helpers.api.applyDomainDeployment('linagora_IT', helpers.callbacks.noErrorAnd(models => {
      user = models.users[0].preferredEmail;

      done();
    }));
  });

  function loadJSONFixture(basePath, filename) {
    return JSON.parse(fs.readFileSync(path.resolve(basePath, 'modules/linagora.esn.autoconf/test/fixtures/autoconf', filename), 'utf-8'));
  }

  it('should return 401 if not logged in', function(done) {
    helpers.api.requireLogin(app, 'get', '/android/guide', done);
  });

  it('should return no config guide when there is no autoconf document in database', function(done) {
    request(app)
      .get('/android/guide')
      .auth(user, password)
      .expect(200)
      .then(res => {
        expect(res.text).to.contain('OpenPaaS is not set up correctly to synchronize with external applications');

        done();
      })
      .catch(done);
  });

  it('should return 200 with the english HTML document if no specific locale is requested', function(done) {
    this.helpers.requireBackend('core/esn-config')('autoconf')
      .inModule('core')
      .store(loadJSONFixture(this.testEnv.basePath, 'autoconf.json'), this.helpers.callbacks.noErrorAnd(() => {
        request(app)
          .get('/android/guide')
          .auth(user, password)
          .expect(200)
          .then(res => {
            expect(res.text.substring(0, 31)).to.equal('<h2 id="email-synchronization">');

            done();
          });
      }));
  });

  it('should return 200 with a localized HTML document, if the translation exists', function(done) {
    this.helpers.requireBackend('core/esn-config')('autoconf')
      .inModule('core')
      .store(loadJSONFixture(this.testEnv.basePath, 'autoconf.json'), this.helpers.callbacks.noErrorAnd(() => {
        request(app)
          .get('/android/guide')
          .set('Accept-Language', 'fr-FR')
          .auth(user, password)
          .expect(200)
          .then(res => {
            expect(res.text.substring(0, 38)).to.equal('<h2 id="synchronisation-des-courriels"');

            done();
          });
      }));
  });

  it('should return 200 with the english HTML document, if the translation does not exist', function(done) {
    this.helpers.requireBackend('core/esn-config')('autoconf')
      .inModule('core')
      .store(loadJSONFixture(this.testEnv.basePath, 'autoconf.json'), this.helpers.callbacks.noErrorAnd(() => {
        request(app)
          .get('/android/guide')
          .set('Accept-Language', 'zz')
          .auth(user, password)
          .expect(200)
          .then(res => {
            expect(res.text.substring(0, 31)).to.equal('<h2 id="email-synchronization">');

            done();
          });
      }));
  });

  it('should return 200 with a HTML document with user and config variables replaced', function(done) {
    this.helpers.requireBackend('core/esn-config')('autoconf')
      .inModule('core')
      .store(loadJSONFixture(this.testEnv.basePath, 'autoconf.json'), this.helpers.callbacks.noErrorAnd(() => {
        request(app)
          .get('/android/guide')
          .auth(user, password)
          .expect(200)
          .then(res => {
            expect(res.text).to.contain('openpaas.linagora.com'); // IMAP
            expect(res.text).to.contain('smtp.linagora.com'); // SMTP
            expect(res.text).to.contain(user); // User's email address

            done();
          });
      }));
  });
});
