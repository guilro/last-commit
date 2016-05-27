'use strict';

const bluebird = require('bluebird');
const co = require('co');
const redis = require('redis');

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

var client = redis.createClient({prefix: require('../config').redisPrefix});

/*
 * The datastore never finds nothing. If the id does not exist, it creates
 * the list and fill it with empty values.
 */

const get = co.wrap(function * (id) {
  var res = {};
  [res.repositories, res.publicId] = yield client.mgetAsync([
    `${id}:repositories`,
    `${id}:publicId`
  ]);

  res.repositories = res.repositories ? JSON.parse(res.repositories) : [];

  if (res.publicId && res.publicId.slice(0, 4) === 'for:') { // this is a public ID for another
    res = yield get(res.publicId.slice(4));
  }

  res.publicId = res.publicId || '';
  res.publicId = res.publicId === ':none' ? '' : res.publicId;

  return res;
});

const put = co.wrap(function * (id, data) {
  if (data.publicId) {
    yield module.exports.setPublicId(id, data.publicId);
    return client.setAsync(`${id}:repositories`,
      JSON.stringify(data.repositories));
  }

  client.msetAsync([
    `${id}:repositories`, JSON.stringify(data.repositories),
    `${id}:publicId`, ':none'
  ]);
});

const setPublicId = co.wrap(function * (id, publicId) {
  var old = yield client.getsetAsync(`${id}:publicId`, publicId);

  if (old !== publicId) {
    var ok = yield client.setnxAsync(`${publicId}:publicId`, `for:${id}`);

    if (!ok) {
      yield client.setAsync(`${id}:publicId`, old);
      var e = new Error('ID not available');
      e.status = 403;
      throw e;
    }

    if (old) {
      yield client.delAsync(`${old}:publicId`);
    }
  }
});

module.exports = {
  get,
  put,
  setPublicId
};
