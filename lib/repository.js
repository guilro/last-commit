'use strict';

const co = require('co');
const request = require('request-promise');
const urlParser = require('url');

const config = require('../config.json');

const gitlab = co.wrap(function * (repoUrl) {
  repoUrl = urlParser.parse(repoUrl);
  var {id, host, token} = {
    id: encodeURIComponent(repoUrl.pathname.slice(1)),
    host: `${repoUrl.protocol}//${repoUrl.host}`,
    token: config.tokens[repoUrl.host]
  };
  var url = `${host}/api/v3/projects/${id}/repository/commits`;

  try {
    return JSON.parse(yield request({
      url,
      headers: {
        'Accept': 'application/json',
        'Private-token': token
      }
    }))[0];
  } catch (err) {
    return [{message: 'not found'}];
  }
});

const github = co.wrap(function * (repoUrl) {
  var repoId = urlParser.parse(repoUrl).pathname;

  try {
    var response = JSON.parse(yield request({
      url: `https://api.github.com/repos${repoId}/commits`,
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'guilro'
      }
    }))[0];

    return {
      message: response.commit.message,
      created_at: response.commit.author.date,
      author_name: response.commit.author.name,
      author_email: response.commit.author.email,
    };
  } catch (err) {
    return [{message: 'not found'}];
  }
});

module.exports = {
  gitlab,
  github
};
