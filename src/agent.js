const request = require('superagent');
const credentialsGitHub = require('../github-credentials.json');
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


  fetchStatsCommitActivity(owner, repo, statsAreAvailable) {
    const statsDaysOfWeek = [0, 0, 0, 0, 0, 0, 0];
    const statsTrimester = [0, 0, 0, 0];

    const statsUrl = `https://api.github.com/repos/${owner}/${repo}/stats/commit_activity`;

    request
      .get(statsUrl)
      .auth(this.credentials.username, this.credentials.token)
      .end((err, res) => {
        const StatsInPage = res.body;
        let count = 1;
        let index = 0;
        StatsInPage.forEach((week) => {
          const days = week.days;
          for (let iter = 0; iter < 7; iter += 1) {
            statsDaysOfWeek[iter] += days[iter];
          }
          statsTrimester[index] += week.total;
          if (count % 13 === 0) {
            index += 1;
          }
          count += 1;
        });
        const result = {};
        result.daysOfWeek = statsDaysOfWeek;
        result.trimester = statsTrimester;
        statsAreAvailable(null, result);
      });
  }
}


const owner = 'youtube';
const agent = new Agent(credentialsGitHub);


agent.fetchAndProcessAllRepos(owner, (err, repos) => {
  let beautifyJSON = [];
  const info = {};
  repos.forEach((repo) => {
    const infoA = {};
    infoA.name = repo.name;
    infoA.commits = repo.commits.length;
    beautifyJSON.push(infoA);
  });
  beautifyJSON = beautifyJSON.sort((a, b) => b.commits - a.commits);
  beautifyJSON = beautifyJSON.slice(0, 5);
  info.repoCommits = beautifyJSON;
  agent.fetchStatsCommitActivity(owner, info.repoCommits[0].name, (err, res) => {
    info.stats = res;
    const agentOwner = 'CoolPolishGuy';
    const agentRepo = 'TWEB-GitHub-Analytics-Agent';
    const publisher = new Storage(agentOwner, credentialsGitHub.token, agentRepo);
    publisher.publish('data/data.json', JSON.stringify(info), 'new version available', (error, result) => {
      if (result) {
        console.log('Data pushed');
      } else {
        console.log(`Sth bad happens : ${error.body}`);
      }
    });
  });
  module.exports = Agent;
});
