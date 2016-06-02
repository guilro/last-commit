'use strict';

const bodyParser = require('body-parser');
const express = require('express');
const morgan = require('morgan');
const path = require('path');
const request = require('request-promise');
const wrap = require('co-express');

const config = require('./config');
const datastore = require('./lib/datastore');

var app = express();

app.enable('trust proxy');

// Global middlewares
if (app.get('env') === 'development') {
  app.use(morgan('dev'));
}

app.use(bodyParser.json());

// Serving JS and CSS
app.use('/', express.static('static'));

app.use('/', wrap(function * (req, res, next) {
  res.set('cache-control', 'no-cache, no-store, must-revalidate');
  res.set('pragma', 'no-cache');
  res.set('expires', '0');

  next();
}));

// Serving the static HTML only page
app.get(/^\/[a-zA-Z0-9_]{1,500}$/, wrap(function * (req, res) {
  return res.sendFile(path.join(__dirname, 'static/app.html'));
}));

app.get('/status', wrap(function * (req, res) {
  return res.send({
    github: JSON.parse(yield request({
      url: `https://api.github.com/rate_limit?client_id=${config.github.clientId}&client_secret=${config.github.clientSecret}`,
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': config.github.userAgent
      }
    }))
  });
}));

app.param('id', wrap(function * (req, res, next, id) {
  if (!(/^[a-zA-Z0-9_]{1,500}$/).test(id)) {
    res.status(404).send({
      status: 404,
      message: 'Not Found'
    });
  }

  return next();
}));

app.patch('/list/:id', wrap(function * (req, res) {
  if (typeof req.body.publicId === 'undefined') {
    return res.status(400).send();
  }

  yield datastore.setPublicId(req.params.id, req.body.publicId);

  return res.status(200).send({status: 200, message: 'OK'});
}));

app.get('/list/:id', wrap(function * (req, res) {
  var list = yield datastore.get(req.params.id);

  if (req.params.id === list.publicId) {
    req.readOnly = true;
    res.set('x-readonly', 'true');
  }

  return res.json(yield datastore.get(req.params.id));
}));

// Base for all the /repositor(ies|y) routes
app.use('/list/:id', wrap(function * (req, res, next) {
  var list = yield datastore.get(req.params.id);

  if (req.params.id === list.publicId) {
    req.readOnly = true;
    res.set('x-readonly', 'true');
  }

  if (typeof list.publicId !== 'undefined') {
    res.set('x-public-id', list.publicId);
  }

  req.list = list;
  var id = req.params.id;

  req.saveList = function() {
    return datastore.put(id, list);
  };

  return next();
}), require('./routes/repositories'));

// Error handler
app.use(function(err, req, res, next) {
  console.error(err.stack);

  if (err.status === 500 || !err.status) {
    return res.status(500).send({
      status: 500,
      message: 'Something broke!'
    });
  }

  return res.status(err.status).send({
    status: err.status,
    message: err.message
  });
});

app.listen(process.env.PORT || 3000);
