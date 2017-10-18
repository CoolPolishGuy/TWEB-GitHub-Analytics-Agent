const request = require('superagent');
const credentials = require('../github-credentials.json');
const Storage = require('./storage.js');

class Agent {
  constructor(credentials) {
    this.credentials = credentials;
  }

  fetchAndProcessAllCommits(owner, repo, allCommitsAreAvailable) {
    let commits = [];

    function fetchAndProcessPage(urlCommits, credentials) {
      request
        .get(urlCommits)
        .auth(credentials.username, credentials.token)
        .end((err3, res3) => {
          commits = commits.concat(res3.body);
          if (res3.links.next) {
            fetchAndProcessPage.bind(this)(res3.links.next, credentials);
          } else {
            allCommitsAreAvailable(null, commits);
          }
        });
    }
    const targetUrlCommits = `https://api.github.com/repos/${owner}/${repo}/commits`;
    fetchAndProcessPage.bind(this)(targetUrlCommits, this.credentials);
  }

  fetchAndProcessAllRepos(owner, allReposAreAvailable) {
    const targetUrl = `https://api.github.com/users/${owner}/repos`;
    let repos = [];

    function fetchAndProcessPage(pageUrl, credentials) {
      request
        .get(pageUrl)
        .auth(credentials.username, credentials.token)
        .end((err, res) => {
          const reposInPage = res.body;
          repos = repos.concat(reposInPage);

          let numberOfReposForWhichWeNeedToGetCommits = repos.length;
          reposInPage.forEach((repo) => {
            const repoName = repo.name;

            this.fetchAndProcessAllCommits(owner, repoName, (err2, commits) => {
              const repoToAugment = repo;
              repoToAugment.commits = commits;
              numberOfReposForWhichWeNeedToGetCommits -= 1;
              if (numberOfReposForWhichWeNeedToGetCommits === 0) {
                allReposAreAvailable(null, repos);
              }
            });
          });

          if (res.links.next) {
            fetchAndProcessPage.bind(this)(res.links.next, credentials);
          }
        });
    }
    fetchAndProcessPage.bind(this)(targetUrl, this.credentials);
  }
}

const owner = 'Grem25';
const agent = new Agent(credentials);
const agentOwner = 'CoolPolishGuy';
const agentRepo = 'TWEB-GitHub-Analytics-Agent';
const publisher = new Storage(agentOwner, credentials.token, agentRepo);

agent.fetchAndProcessAllRepos(owner, (err, repos) => {
  let beautifyJSON = [];
  repos.forEach((repo) => {
    const info = {};
    info.name = repo.name;
    info.commits = repo.commits.length;
    beautifyJSON.push(info);
  });
  beautifyJSON = beautifyJSON.sort((a, b) => b.commits - a.commits);
  console.log(beautifyJSON);
  publisher.publish('data/data.json', JSON.stringify(beautifyJSON), 'new version available', (error, result) => {
    if (result) {
      console.log('Data pushed');
    } else {
      console.log(`Sth bad happens : ${error.body}`);
    }
  }); 
  module.exports = Agent;
});
