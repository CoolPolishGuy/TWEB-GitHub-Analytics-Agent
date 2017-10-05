const request = require('superagent');

class Agent {
  constructor(credentials) {
    this.credentials = credentials;
  }

  fetchAndProcessAllRepos(owner, allRepoSAreAvailable) {
    const targerUrl = `https://api.github.com/users/${owner}/repos`;
    let repos = [];
    function fetchAndProcessPage(pageUrl, credentials) {
      request
        .get(pageUrl)
        .auth(credentials.username, credentials.token)
        .end((err, res) => {
          repos = repos.concat(res.body);
          if (res.links.next) {
            fetchAndProcessPage(res.links.next, credentials);
          } else {
            allRepoSAreAvailable(null, repos);
          }
        });
    }
    fetchAndProcessPage(targerUrl, this.credentials);
  }
}

module.exports = Agent;
