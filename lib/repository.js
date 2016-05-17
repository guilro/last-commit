'use strict';

const co = require('co');
const request = require('request-promise');
const urlParser = require('url');

const config = require('../config.json');

// https://gist.github.com/guilro/f3adf0685e85cffddc1ed53df58878ec
var cache = {};

var getInCache = (name, date) => {
  var noDate = (typeof date === 'undefined');

  if (cache[name] && (noDate || cache[name].date.getTime() > date.getTime())) {
    return cache[name].data;
  }
};

var putInCache = (name, data) => {
  cache[name] = {
    data: data,
    date: new Date()
  };
};

const gitlab = co.wrap(function * (repoUrl) {
  var fiveMinutesAgo = new Date();
  fiveMinutesAgo.setMinutes((new Date()).getMinutes() - 5);
  var lastCommit = getInCache(repoUrl, fiveMinutesAgo);

  if (lastCommit) {
    return lastCommit;
  }

  repoUrl = urlParser.parse(repoUrl);
  var {id, host, token} = {
    id: encodeURIComponent(repoUrl.pathname.slice(1)),
    host: `${repoUrl.protocol}//${repoUrl.host}`,
    token: config.tokens[repoUrl.host]
  };
  var url = `${host}/api/v3/projects/${id}/repository/commits`;

  try {
    var response = JSON.parse(yield request({
      url,
      headers: {
        'Accept': 'application/json',
        'Private-token': token
      }
    }))[0];

    lastCommit = {
      message: response.message,
      createdAt: response.created_at,
      authorName: response.author_name,
      authorEmail: response.author_email
    };
    putInCache(repoUrl, lastCommit);

    return lastCommit;
  } catch (err) {
    console.error(err);

    var e = new Error('URL not found or not a git repository');
    e.status = 404;

    throw e;
  }
});

const github = co.wrap(function * (repoUrl) {
  var fiveMinutesAgo = new Date();
  fiveMinutesAgo.setMinutes((new Date()).getMinutes() - 5);
  var lastCommit = getInCache(repoUrl, fiveMinutesAgo);

  if (lastCommit) {
    return lastCommit;
  }

  var repoId = urlParser.parse(repoUrl).pathname;

  try {
    var response = JSON.parse(yield request({
      url: `https://api.github.com/repos${repoId}/commits`,
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'guilro'
      }
    }))[0];

    lastCommit = {
      message: response.commit.message,
      createdAt: response.commit.author.date,
      authorName: response.commit.author.name,
      authorEmail: response.commit.author.email
    };
    putInCache(repoUrl, lastCommit);

    return lastCommit;
  } catch (err) {
    console.error(err);

    var e = new Error('URL not found or not a git repository');
    e.status = 404;

    throw e;
  }
});

module.exports = {
  gitlab,
  github
};
