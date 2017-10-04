const chai = require('chai');
const request = require('superagent');
const { username, token } = require('../github-credentials.json');

const should = chai.should();

describe('the GitHub API', () => {
  it('allows me to get a list of repo', (done) => {
    const owner = 'Grem25';
    const url = `https://api.github.com/users/${owner}/repos`;
    request
      .get(url)
      .auth(username, token)
      .set('Accept', 'application/vnd.github.v3+json')
      .end((err, res) => {
        should.not.exist(err);
        should.exist(res);
        done();
      });
  });
});
