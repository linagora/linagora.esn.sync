const { expect } = require('chai');
const request = require('supertest');

describe('GET /downloads/thunderbird/op-tb-autoconf.xpi', function() {
  const password = 'secret';
  let helpers, user, app;

  beforeEach(function(done) {
    helpers = this.helpers;
    app = helpers.modules.current.app;

    helpers.api.applyDomainDeployment('linagora_IT', helpers.callbacks.noErrorAnd(models => {
      user = models.users[0].preferredEmail;

      done();
    }));
  });

  it('should return 401 if not logged in', function(done) {
    helpers.api.requireLogin(app, 'get', '/downloads/thunderbird/op-tb-autoconf.xpi', done);
  });

  it('should return 200 with a ZIP archive', function(done) {
    request(app)
      .get('/downloads/thunderbird/op-tb-autoconf.xpi')
      .auth(user, password)
      .expect(200)
      .then(res => {
        expect(res.text.length).to.be.above(4);
        expect(res.text.substring(0, 4)).to.equal('PK\u0003\u0004'); // https://users.cs.jmu.edu/buchhofp/forensics/formats/pkzip.html

        done();
      }, done);
  });
});
