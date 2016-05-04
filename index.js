'use strict';

const express = require('express');
const moment = require('moment');
const morgan = require('morgan');
const path = require('path');
const request = require('request-promise');
const url = require('url');
const wrap = require('co-express');

var app = express();

const config = require('./config');

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

app.set('views', path.join(__dirname, '/views'));
app.set('view engine', 'pug');
app.enable('trust proxy');

// Global middlewares
if (app.get('env') === 'development') {
  app.use(morgan('dev'));
}

app.locals.moment = moment;

app.get('/', wrap(function * (req, res) {
  if (config.repositories.length === 0) {
    return res.send('no repository');
  }

  var fiveMinutesAgo = new Date();
  fiveMinutesAgo.setMinutes((new Date()).getMinutes() - 5);
  var lastCommits = getInCache('lastCommits', fiveMinutesAgo);

  if (lastCommits) {
    return res.render('index', {lastCommits});
  }

  var responses = yield (config.repositories
    .map(repoUrl => url.parse(repoUrl))
    .map(repoUrl => ({
      id: encodeURIComponent(repoUrl.pathname.slice(1)),
      host: `${repoUrl.protocol}//${repoUrl.host}`,
      token: config.tokens[repoUrl.host]
    }))
    .map(({id, host, token}) => ({
      url: `${host}/api/v3/projects/${id}/repository/commits`,
      token
    }))
    .map(({url, token}) => request({
      url,
      headers: {
        'Accept': 'application/json',
        'Private-token': token
      }
    })));

  lastCommits = responses.map((body, index) => ({
    url: {
      host: url.parse(config.repositories[index]).host,
      path: url.parse(config.repositories[index]).pathname
    },
    lastCommit: JSON.parse(body)[0]
  }));
  putInCache('lastCommits', lastCommits);

  res.render('index', {lastCommits});
}));

app.listen(process.env.PORT || 3000);
