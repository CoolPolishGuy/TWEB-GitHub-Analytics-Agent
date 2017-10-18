const Storage = require('../src/storage');
const { token } = require('../github-credentials.json');
const should = require('chai').should();

describe('Storage', () => {
  it('should allow me to store a file on GitHub', (done) => {
    const repo = 'TWEB-GitHub-Analytics-Agent';
    const username = 'CoolPolishGuy';
    const storage = new Storage(username, token, repo);
    const content = {
      random: Math.random(),
    };
    /*storage.publish('test.json', JSON.stringify(content), 'new version of the file', (err, result) => {
      should.not.exist(err);
      should.exist(result);
      done();
    });*/
  });
});
