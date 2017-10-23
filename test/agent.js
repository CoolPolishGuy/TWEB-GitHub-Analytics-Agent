const chai = require('chai');
const Agent = require('../src/agent.js');
const credentials = require('../github-credentials.json');

const should = chai.should();

describe('agent', () => {
  it('should fetch a list of repo', (done) => {
    const owner = 'Grem25';
    const repo = 'Teaching-HEIGVD-RES-2017-Labo-00';
    const agent = new Agent(credentials);
    agent.fetchAndProcessAllRepos(owner, (err, repos) => {
      should.not.exist(err);
      should.exist(repos);
      done();
    });

    agent.fetchStatsCommitActivity(owner, repo, (err, repos) => {
      should.not.exist(err);
      should.exist(repos);
      done();
    });
  });
});
