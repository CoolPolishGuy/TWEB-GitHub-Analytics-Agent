const GitHubPublisher = require('github-publish');

class Storage {
  constructor(username, token, repo) {
    this.username = username;
    this.token = token;
    this.repo = repo;
    this.publisher = new GitHubPublisher(token, username, repo);
  }

  publish(path, content, commitMessage, done) {
    const options = {
      force: true,
      message: commitMessage,
    };
    this.publisher.publish(path, content, options)
      .then((result) => {
        done(undefined, result);
      })
      .catch((err) => {
        done(err);
      });
  }
}

module.exports = Storage;
