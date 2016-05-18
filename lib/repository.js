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
  var lastCommit;
  var etag;
  var cached = getInCache(repoUrl);

  if (cached) {
    lastCommit = cached.lastCommit;
    etag = cached.etag;
  }

  var repoId = urlParser.parse(repoUrl).pathname;

  try {
    var response = yield request({
      url: `https://api.github.com/repos${repoId}/commits?client_id=${config.github.clientId}&client_secret=${config.github.clientSecret}`,
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': config.github.userAgent,
        'If-None-Match': etag
      },
      resolveWithFullResponse: true,
      simple: false
    });

    if (response.statusCode === 304) {
      return lastCommit;
    }

    if (response.statusCode === 200) {
      var body = JSON.parse(response.body);
      lastCommit = {
        message: body[0].commit.message,
        createdAt: body[0].commit.author.date,
        authorName: body[0].commit.author.name,
        authorEmail: body[0].commit.author.email
      };
      putInCache(repoUrl, {
        etag: response.headers.etag,
        lastCommit
      });

      return lastCommit;
    }

    throw new Error('Status code from GitHub API different from 200 or 304.');
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
