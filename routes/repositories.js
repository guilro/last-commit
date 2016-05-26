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

  var lastCommit = yield repo.get(repoUrl);

  if (lastCommit) {
    req.repositories.push(repoUrl);

    return res.status(201).send(lastCommit);
  }

  return res.status(204).send();
}));

app.get('/repositories', wrap(function * (req, res) {
  if (req.repositories.length === 0) {
    return res.json([]);
  }

  var responses = yield req.repositories.map(repoUrl => repo.get(repoUrl));

  res.json(responses);
}));

module.exports = app;
