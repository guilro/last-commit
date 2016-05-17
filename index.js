'use strict';

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

app.use('/', express.static('static'));

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
