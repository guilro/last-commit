'use strict';

const bodyParser = require('body-parser');
const express = require('express');
const morgan = require('morgan');
const path = require('path');
const wrap = require('co-express');

const config = require('./config');

var app = express();

app.enable('trust proxy');

// Global middlewares
if (app.get('env') === 'development') {
  app.use(morgan('dev'));
}

app.use(bodyParser.json());

var datastore = {};
app.use('/list/:id', wrap(function * (req, res, next) {
  if (typeof datastore[req.params.id] === 'undefined') {
    datastore[req.params.id] = [];
  }

  req.repositories = datastore[req.params.id];

  return next();
}), require('./routes/repositories'));

app.get(/^\/[a-zA-Z0-9_]{1,500}$/, wrap(function * (req, res) {
  return res.sendFile(path.join(__dirname, 'static/index.html'));
}));

app.use('/app', express.static('static'));

app.listen(process.env.PORT || 3000);
