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
          Array.prototype.forEach.call(reposInPage, (repo) => {
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
        /* to correct a bug from the API if we contact the url for the first time we
        will have a {} has response */
        if (res.text === '{}') {
          this.fetchStatsCommitActivity(owner, repo, statsAreAvailable);
        } else {
          const statsInPage = res.body;
          let count = 1;
          let index = 0;
          Array.prototype.forEach.call(statsInPage, (week) => {
            // eslint-disable-next-line
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
        }
      });
  }
}

const owners = ['SoftEng-HEIGVD', 'offensive-security', 'nationalsecurityagency', 'youtube'];
const agent = new Agent(credentialsGitHub);
let ready = true;

owners.forEach((owner) => {
  agent.fetchAndProcessAllRepos(owner, (err, repos) => {
    let reposInfo = [];
    const info = {};
    repos.forEach((repo) => {
      const repoInfo = {};
      repoInfo.name = repo.name;
      repoInfo.commits = repo.commits.length;
      reposInfo.push(repoInfo);
    });
    reposInfo = reposInfo.sort((a, b) => b.commits - a.commits);
    reposInfo = reposInfo.slice(0, 5);
    info.repoCommits = reposInfo;
    agent.fetchStatsCommitActivity(owner, info.repoCommits[0].name, (err2, res) => {
      info.stats = res;
      const agentOwner = 'CoolPolishGuy';
      const agentRepo = 'TWEB-GitHub-Analytics-Agent';
      const publisher = new Storage(agentOwner, credentialsGitHub.token, agentRepo);
      console.log(info);
      let timer = 0;
      if (ready === false) {
        timer = 5000;
      } else {
        timer = 0;
      }
      ready = false;
      setTimeout(() => {
        publisher.publish(`data/data_${owner}.json`, JSON.stringify(info), `new version of ${owner} available`, (error, result) => {
          if (result) {
            console.log(`Data ${owner} pushed`);
          } else {
            console.log(`Sth bad happens with ${owner}: ${error.body}`);
          }
          ready = true;
        });
      }, timer);
    });
  });
});
module.exports = Agent;
