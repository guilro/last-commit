'use strict';

const bodyParser = require('body-parser');
const express = require('express');
const morgan = require('morgan');
const url = require('url');
const wrap = require('co-express');

const repo = require('./lib/repository');

var app = express();

const config = require('./config');

app.enable('trust proxy');

// Global middlewares
if (app.get('env') === 'development') {
  app.use(morgan('dev'));
}

app.use(bodyParser.json());

app.use('/', express.static('static'));

app.delete('/api/repository/:key', wrap(function * (req, res) {
  if (config.repositories[req.params.key]) {
    config.repositories.splice(req.params.key, 1);

    return res.status(202).json({});
  }

  return res.status(404).send();
}));

app.post('/api/repository', wrap(function * (req, res) {
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
    config.repositories.push(repoUrl);

    return res.status(202).send({
      url: {
        host: url.parse(repoUrl).host,
        path: url.parse(repoUrl).pathname
      },
      lastCommit
    });
  }

  return res.status(204).send();
}));

app.get('/api/repositories', wrap(function * (req, res) {
  if (config.repositories.length === 0) {
    return res.send('no repository');
  }

  var responses = yield (config.repositories
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
      host: url.parse(config.repositories[index]).host,
      path: url.parse(config.repositories[index]).pathname
    },
    lastCommit: response
  }));

  res.json(lastCommits);
}));

app.listen(process.env.PORT || 3000);
