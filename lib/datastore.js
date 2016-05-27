'use strict';

const co = require('co');

var datastore = {};
var publicIdReverse = {};

/*
 * The datastore never finds nothing. If the id does not exist, it creates
 * the list and fill it with empty values.
 */

const get = co.wrap(function * (id) {
  var response = datastore[id] ||
    (publicIdReverse[id] && datastore[publicIdReverse[id]]) || {
      repositories: [],
      publicId: undefined
    };

  return response;
});

const put = co.wrap(function * (id, data) {
  if (publicIdReverse[id]) {
    var e = new Error('Not authorized.');
    e.status = 403;
    throw e;
  }

  datastore[id] = data;
});

const setPublicId = co.wrap(function * (id, publicId) {
  var e;
  if (publicIdReverse[id]) {
    e = new Error('Not authorized.');
    e.status = 403;
    throw e;
  }

  if (datastore[publicId] || publicIdReverse[publicId] &&
    publicIdReverse[publicId] !== id) {
    e = new Error('ID not available');
    e.status = 403;
    throw e;
  }

  if (typeof datastore[id] === 'undefined') {
    datastore[id] = {
      repositories: [],
      publicId: undefined
    };
  }

  datastore[id].publicId = publicId;
  publicIdReverse[publicId] = id;

  return datastore[id];
});

module.exports = {
  get,
  put,
  setPublicId
};
