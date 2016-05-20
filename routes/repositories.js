'use strict';

const express = require('express');
const url = require('url');
const wrap = require('co-express');

const repo = require('../lib/repository');

var app = express.Router();

app.delete('/repository/:key', wrap(function * (req, res) {
  if (req.repositories[req.params.key]) {
    req.repositories.splice(req.params.key, 1);

    return res.status(204).json({});
  }

  return res.status(404).send();
}));

app.post('/repository', wrap(function * (req, res) {
  if (!req.body.url) {
    return res.status(400).send();
  }

  var repoUrl = req.body.url;

  var lastCommit;
  switch (url.parse(repoUrl).host) {
    case 'github.com':
    case 'www.github.com':
      lastCommit = yield repo.github(repoUrl);
      break;
    default:
      lastCommit = yield repo.gitlab(repoUrl);
  }

  if (lastCommit) {
    req.repositories.push(repoUrl);

    return res.status(201).send({
      url: {
        complete: repoUrl,
        host: url.parse(repoUrl).host,
        path: url.parse(repoUrl).pathname
      },
      lastCommit
    });
  }

  return res.status(204).send();
}));

app.get('/repositories', wrap(function * (req, res) {
  if (req.repositories.length === 0) {
    return res.json([]);
  }

  var responses = yield (req.repositories
    .map(repoUrl => {
      switch (url.parse(repoUrl).host) {
        case 'github.com':
        case 'www.github.com':
          return repo.github(repoUrl);
        default:
          return repo.gitlab(repoUrl);
      }
    }));

  var lastCommits = responses.map((response, index) => ({
    url: {
      complete: req.repositories[index],
      host: url.parse(req.repositories[index]).host,
      path: url.parse(req.repositories[index]).pathname
    },
    lastCommit: response
  }));

  res.json(lastCommits);
}));

module.exports = app;
