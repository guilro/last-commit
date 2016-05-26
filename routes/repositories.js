'use strict';

const express = require('express');
const wrap = require('co-express');

const repo = require('../lib/repository');

var app = express.Router();

app.get('/repositories', wrap(function * (req, res) {
  if (req.list.repositories.length === 0) {
    return res.json([]);
  }

  var responses = yield req.list.repositories.map(repoUrl => repo.get(repoUrl));

  res.json(responses);
}));

// Below are methods which should not be accessed if request is readonly
app.use('/', wrap(function * (req, res, next) {
  if (req.readOnly) {
    var e = new Error('Not authorized.');
    e.status = 403;
    throw e;
  }

  return next();
}));

app.delete('/repository/:key', wrap(function * (req, res) {
  if (req.list.repositories[req.params.key]) {
    req.list.repositories.splice(req.params.key, 1);

    yield req.saveList();
    return res.status(204).json({});
  }

  return res.status(404).send();
}));

app.post('/repository', wrap(function * (req, res) {
  if (!req.body.url) {
    return res.status(400).send();
  }

  var repoUrl = req.body.url;

  var lastCommit = yield repo.get(repoUrl);

  if (lastCommit) {
    req.list.repositories.push(repoUrl);

    yield req.saveList();
    return res.status(201).send(lastCommit);
  }

  return res.status(204).send();
}));

module.exports = app;
