"use strict";

var _chai = require("chai");

var _nock = _interopRequireDefault(require("nock"));

var _stream = _interopRequireDefault(require("stream"));

var Minio = _interopRequireWildcard(require("../../../dist/main/minio"));

var _helpers = require("../../../dist/main/helpers");

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*
 * MinIO Javascript Library for Amazon S3 Compatible Cloud Storage, (C) 2016 MinIO, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
require('source-map-support').install();

var Package = require('../../../package.json');

describe('Helpers', function () {
  it('should validate for s3 endpoint', function () {
    _chai.assert.equal((0, _helpers.isValidEndpoint)('s3.amazonaws.com'), true);
  });
  it('should validate for s3 china', function () {
    _chai.assert.equal((0, _helpers.isValidEndpoint)('s3.cn-north-1.amazonaws.com.cn'), true);
  });
  it('should validate for us-west-2', function () {
    _chai.assert.equal((0, _helpers.isValidEndpoint)('s3-us-west-2.amazonaws.com'), true);
  });
  it('should fail for invalid endpoint characters', function () {
    _chai.assert.equal((0, _helpers.isValidEndpoint)('111.#2.11'), false);
  });
  it('should validate for valid ip', function () {
    _chai.assert.equal((0, _helpers.isValidIP)('1.1.1.1'), true);
  });
  it('should fail for invalid ip', function () {
    _chai.assert.equal((0, _helpers.isValidIP)('1.1.1'), false);
  });
  it('should make date short', function () {
    var date = new Date('2012-12-03T17:25:36.331Z');

    _chai.assert.equal((0, _helpers.makeDateShort)(date), '20121203');
  });
  it('should make date long', function () {
    var date = new Date('2017-08-11T17:26:34.935Z');

    _chai.assert.equal((0, _helpers.makeDateLong)(date), '20170811T172634Z');
  });
});
describe('CopyConditions', function () {
  var date = 'Fri, 11 Aug 2017 19:34:18 GMT';
  var cc = new Minio.CopyConditions();
  describe('#setModified', function () {
    it('should take a date argument', function () {
      cc.setModified(new Date(date));

      _chai.assert.equal(cc.modified, date);
    });
    it('should throw without date', function () {
      _chai.assert.throws(function () {
        cc.setModified();
      }, /date must be of type Date/);

      _chai.assert.throws(function () {
        cc.setModified({
          hi: 'there'
        });
      }, /date must be of type Date/);
    });
  });
  describe('#setUnmodified', function () {
    it('should take a date argument', function () {
      cc.setUnmodified(new Date(date));

      _chai.assert.equal(cc.unmodified, date);
    });
    it('should throw without date', function () {
      _chai.assert.throws(function () {
        cc.setUnmodified();
      }, /date must be of type Date/);

      _chai.assert.throws(function () {
        cc.setUnmodified({
          hi: 'there'
        });
      }, /date must be of type Date/);
    });
  });
});
describe('Client', function () {
  var nockRequests = [];
  this.timeout(5000);
  beforeEach(function () {
    _nock.default.cleanAll();

    nockRequests = [];
  });
  afterEach(function () {
    nockRequests.forEach(function (element) {
      if (!element.request.isDone()) {
        element.request.done();
      }
    });
  });
  var client = new Minio.Client({
    endPoint: 'localhost',
    port: 9000,
    accessKey: 'accesskey',
    secretKey: 'secretkey',
    useSSL: false
  });
  describe('new client', function () {
    it('should work with https', function () {
      var client = new Minio.Client({
        endPoint: 'localhost',
        accessKey: 'accesskey',
        secretKey: 'secretkey'
      });

      _chai.assert.equal(client.port, 443);
    });
    it('should override port with http', function () {
      var client = new Minio.Client({
        endPoint: 'localhost',
        port: 9000,
        accessKey: 'accesskey',
        secretKey: 'secretkey',
        useSSL: false
      });

      _chai.assert.equal(client.port, 9000);
    });
    it('should work with http', function () {
      var client = new Minio.Client({
        endPoint: 'localhost',
        accessKey: 'accesskey',
        secretKey: 'secretkey',
        useSSL: false
      });

      _chai.assert.equal(client.port, 80);
    });
    it('should override port with https', function () {
      var client = new Minio.Client({
        endPoint: 'localhost',
        port: 9000,
        accessKey: 'accesskey',
        secretKey: 'secretkey'
      });

      _chai.assert.equal(client.port, 9000);
    });
    it('should fail with url', function (done) {
      try {
        new Minio.Client({
          endPoint: 'http://localhost:9000',
          accessKey: 'accesskey',
          secretKey: 'secretkey'
        });
      } catch (e) {
        done();
      }
    });
    it('should fail with alphanumeric', function (done) {
      try {
        new Minio.Client({
          endPoint: 'localhost##$@3',
          accessKey: 'accesskey',
          secretKey: 'secretkey'
        });
      } catch (e) {
        done();
      }
    });
    it('should fail with no url', function (done) {
      try {
        new Minio.Client({
          accessKey: 'accesskey',
          secretKey: 'secretkey'
        });
      } catch (e) {
        done();
      }
    });
    it('should fail with bad port', function (done) {
      try {
        new Minio.Client({
          endPoint: 'localhost',
          port: -1,
          accessKey: 'accesskey',
          secretKey: 'secretkey'
        });
      } catch (e) {
        done();
      }
    });
    it('should fail when secure param is passed', function (done) {
      try {
        new Minio.Client({
          endPoint: 'localhost',
          secure: false,
          port: 9000,
          accessKey: 'accesskey',
          secretKey: 'secretkey'
        });
      } catch (e) {
        done();
      }
    });
    it('should fail when secure param is passed', function (done) {
      try {
        new Minio.Client({
          endPoint: 'localhost',
          secure: true,
          port: 9000,
          accessKey: 'accesskey',
          secretKey: 'secretkey'
        });
      } catch (e) {
        done();
      }
    });
  });
  describe('Presigned URL', function () {
    describe('presigned-get', function () {
      it('should not generate presigned url with no access key', function (done) {
        try {
          var client = new Minio.Client({
            endPoint: 'localhost',
            port: 9000,
            useSSL: false
          });
          client.presignedGetObject('bucket', 'object', 1000, function () {});
        } catch (e) {
          done();
        }
      });
      it('should not generate presigned url with wrong expires param', function (done) {
        try {
          client.presignedGetObject('bucket', 'object', '0', function () {});
        } catch (e) {
          done();
        }
      });
    });
    describe('presigned-put', function () {
      it('should not generate presigned url with no access key', function (done) {
        try {
          var client = new Minio.Client({
            endPoint: 'localhost',
            port: 9000,
            useSSL: false
          });
          client.presignedPutObject('bucket', 'object', 1000, function () {});
        } catch (e) {
          done();
        }
      });
      it('should not generate presigned url with wrong expires param', function (done) {
        try {
          client.presignedPutObject('bucket', 'object', '0', function () {});
        } catch (e) {
          done();
        }
      });
    });
  });
  describe('User Agent', function () {
    it('should have a default user agent', function () {
      var client = new Minio.Client({
        endPoint: 'localhost',
        accessKey: 'accesskey',
        secretKey: 'secretkey'
      });

      _chai.assert.equal(`MinIO (${process.platform}; ${process.arch}) minio-js/${Package.version}`, client.userAgent);
    });
    it('should set user agent', function () {
      var client = new Minio.Client({
        endPoint: 'localhost',
        accessKey: 'accesskey',
        secretKey: 'secretkey'
      });
      client.setAppInfo('test', '3.2.1');

      _chai.assert.equal(`MinIO (${process.platform}; ${process.arch}) minio-js/${Package.version} test/3.2.1`, client.userAgent);
    });
    it('should set user agent without comments', function () {
      var client = new Minio.Client({
        endPoint: 'localhost',
        accessKey: 'accesskey',
        secretKey: 'secretkey'
      });
      client.setAppInfo('test', '3.2.1');

      _chai.assert.equal(`MinIO (${process.platform}; ${process.arch}) minio-js/${Package.version} test/3.2.1`, client.userAgent);
    });
    it('should not set user agent without name', function (done) {
      try {
        var client = new Minio.Client({
          endPoint: 'localhost',
          accessKey: 'accesskey',
          secretKey: 'secretkey'
        });
        client.setAppInfo(null, '3.2.1');
      } catch (e) {
        done();
      }
    });
    it('should not set user agent with empty name', function (done) {
      try {
        var client = new Minio.Client({
          endPoint: 'localhost',
          accessKey: 'accesskey',
          secretKey: 'secretkey'
        });
        client.setAppInfo('', '3.2.1');
      } catch (e) {
        done();
      }
    });
    it('should not set user agent without version', function (done) {
      try {
        var client = new Minio.Client({
          endPoint: 'localhost',
          accessKey: 'accesskey',
          secretKey: 'secretkey'
        });
        client.setAppInfo('test', null);
      } catch (e) {
        done();
      }
    });
    it('should not set user agent with empty version', function (done) {
      try {
        var client = new Minio.Client({
          endPoint: 'localhost',
          accessKey: 'accesskey',
          secretKey: 'secretkey'
        });
        client.setAppInfo('test', '');
      } catch (e) {
        done();
      }
    });
  });
  describe('object level', function () {
    describe('#getObject(bucket, object, callback)', function () {
      it('should fail on null bucket', function (done) {
        try {
          client.getObject(null, 'hello', function () {});
        } catch (e) {
          done();
        }
      });
      it('should fail on empty bucket', function (done) {
        try {
          client.getObject('', 'hello', function () {});
        } catch (e) {
          done();
        }
      });
      it('should fail on empty bucket', function (done) {
        try {
          client.getObject('  \n  \t  ', 'hello', function () {});
        } catch (e) {
          done();
        }
      });
      it('should fail on null object', function (done) {
        try {
          client.getObject('hello', null, function () {});
        } catch (e) {
          done();
        }
      });
      it('should fail on empty object', function (done) {
        try {
          client.getObject('hello', '', function () {});
        } catch (e) {
          done();
        }
      });
    });
    describe('#putObject(bucket, object, source, size, contentType, callback)', function () {
      describe('with small objects using single put', function () {
        it('should fail when data is smaller than specified', function (done) {
          var s = new _stream.default.Readable();

          s._read = function () {};

          s.push('hello world');
          s.push(null);
          client.putObject('bucket', 'object', s, 12, '', function (e) {
            if (e) {
              done();
            }
          });
        });
        it('should fail when data is larger than specified', function (done) {
          var s = new _stream.default.Readable();

          s._read = function () {};

          s.push('hello world');
          s.push(null);
          client.putObject('bucket', 'object', s, 10, '', function (e) {
            if (e) {
              done();
            }
          });
        });
        it('should fail with invalid bucket name', function () {
          _chai.assert.throws(function () {
            client.putObject('ab', 'object', function () {});
          }, /Invalid bucket name/);
        });
        it('should fail with invalid object name', function () {
          _chai.assert.throws(function () {
            client.putObject('bucket', '', function () {});
          }, /Invalid object name/);
        });
        it('should error with size > maxObjectSize', function () {
          _chai.assert.throws(function () {
            client.putObject('bucket', 'object', new _stream.default.Readable(), client.maxObjectSize + 1, function () {});
          }, /size should not be more than/);
        });
        it('should fail on null bucket', function (done) {
          try {
            client.putObject(null, 'hello', null, 1, '', function () {});
          } catch (e) {
            done();
          }
        });
        it('should fail on empty bucket', function (done) {
          try {
            client.putObject(' \n \t ', 'hello', null, 1, '', function () {});
          } catch (e) {
            done();
          }
        });
        it('should fail on empty bucket', function (done) {
          try {
            client.putObject('', 'hello', null, 1, '', function () {});
          } catch (e) {
            done();
          }
        });
        it('should fail on null object', function (done) {
          try {
            client.putObject('hello', null, null, 1, '', function () {});
          } catch (e) {
            done();
          }
        });
        it('should fail on empty object', function (done) {
          try {
            client.putObject('hello', '', null, 1, '', function () {});
          } catch (e) {
            done();
          }
        });
      });
    });
    describe('#removeAllBucketNotification()', function () {
      it('should error on invalid arguments', function () {
        _chai.assert.throws(function () {
          client.removeAllBucketNotification('ab', function () {}, function () {});
        }, /Invalid bucket name/);
      });
    });
    describe('#setBucketNotification()', function () {
      it('should error on invalid arguments', function () {
        _chai.assert.throws(function () {
          client.setBucketNotification('ab', function () {});
        }, /Invalid bucket name/);

        _chai.assert.throws(function () {
          client.setBucketNotification('bucket', 49, function () {});
        }, /notification config should be of type "Object"/);
      });
    });
    describe('#getBucketNotification()', function () {
      it('should error on invalid arguments', function () {
        _chai.assert.throws(function () {
          client.getBucketNotification('ab', function () {});
        }, /Invalid bucket name/);
      });
    });
    describe('#listenBucketNotification', function () {
      it('should error on invalid arguments', function () {
        _chai.assert.throws(function () {
          client.listenBucketNotification('ab', 'prefix', 'suffix', ['events']);
        }, /Invalid bucket name/);

        _chai.assert.throws(function () {
          client.listenBucketNotification('bucket', {}, 'suffix', ['events']);
        }, /prefix must be of type string/);

        _chai.assert.throws(function () {
          client.listenBucketNotification('bucket', '', {}, ['events']);
        }, /suffix must be of type string/);

        _chai.assert.throws(function () {
          client.listenBucketNotification('bucket', '', '', {});
        }, /events must be of type Array/);
      });
    });
    describe('#statObject(bucket, object, callback)', function () {
      it('should fail on null bucket', function (done) {
        try {
          client.statObject(null, 'hello', function () {});
        } catch (e) {
          done();
        }
      });
      it('should fail on empty bucket', function (done) {
        try {
          client.statObject('', 'hello', function () {});
        } catch (e) {
          done();
        }
      });
      it('should fail on empty bucket', function (done) {
        try {
          client.statObject('  \n  \t  ', 'hello', function () {});
        } catch (e) {
          done();
        }
      });
      it('should fail on null object', function (done) {
        try {
          client.statObject('hello', null, function () {});
        } catch (e) {
          done();
        }
      });
      it('should fail on empty object', function (done) {
        try {
          client.statObject('hello', '', function () {});
        } catch (e) {
          done();
        }
      });
      it('should fail on incompatible argument type (number) for statOpts object', function (done) {
        try {
          client.statObject('hello', 'testStatOpts', 1, function () {});
        } catch (e) {
          done();
        }
      });
      it('should fail on incompatible argument type (null) for statOpts object', function (done) {
        try {
          client.statObject('hello', 'testStatOpts', null, function () {});
        } catch (e) {
          done();
        }
      });
      it('should fail on incompatible argument type (sting) for statOpts object', function (done) {
        try {
          client.statObject('hello', 'testStatOpts', '  ', function () {});
        } catch (e) {
          done();
        }
      });
    });
    describe('#removeObject(bucket, object, callback)', function () {
      it('should fail on null bucket', function (done) {
        try {
          client.removeObject(null, 'hello', function () {});
        } catch (e) {
          done();
        }
      });
      it('should fail on empty bucket', function (done) {
        try {
          client.removeObject('', 'hello', function () {});
        } catch (e) {
          done();
        }
      });
      it('should fail on empty bucket', function (done) {
        try {
          client.removeObject('  \n  \t  ', 'hello', function () {});
        } catch (e) {
          done();
        }
      });
      it('should fail on null object', function (done) {
        try {
          client.removeObject('hello', null, function () {});
        } catch (e) {
          done();
        }
      });
      it('should fail on empty object', function (done) {
        try {
          client.removeObject('hello', '', function () {});
        } catch (e) {
          done();
        }
      }); //Versioning related options as removeOpts

      it('should fail on empty (null) removeOpts object', function (done) {
        try {
          client.removeObject('hello', 'testRemoveOpts', null, function () {});
        } catch (e) {
          done();
        }
      });
      it('should fail on empty (string) removeOpts', function (done) {
        try {
          client.removeObject('hello', 'testRemoveOpts', '', function () {});
        } catch (e) {
          done();
        }
      });
    });
    describe('#removeIncompleteUpload(bucket, object, callback)', function () {
      it('should fail on null bucket', function (done) {
        try {
          client.removeIncompleteUpload(null, 'hello', function () {});
        } catch (e) {
          done();
        }
      });
      it('should fail on empty bucket', function (done) {
        try {
          client.removeIncompleteUpload('', 'hello', function () {});
        } catch (e) {
          done();
        }
      });
      it('should fail on empty bucket', function (done) {
        try {
          client.removeIncompleteUpload('  \n  \t  ', 'hello', function () {});
        } catch (e) {
          done();
        }
      });
      it('should fail on null object', function (done) {
        try {
          client.removeIncompleteUpload('hello', null, function () {});
        } catch (e) {
          done();
        }
      });
      it('should fail on empty object', function (done) {
        try {
          client.removeIncompleteUpload('hello', '', function () {});
        } catch (e) {
          done();
        }
      });
    });
  });
  describe('Bucket Versioning APIs', function () {
    describe('getBucketVersioning(bucket, callback)', function () {
      it('should fail on null bucket', function (done) {
        try {
          client.getBucketVersioning(null, function () {});
        } catch (e) {
          done();
        }
      });
      it('should fail on empty bucket', function (done) {
        try {
          client.getBucketVersioning('', function () {});
        } catch (e) {
          done();
        }
      });
    });
    describe('setBucketVersioning(bucket, versionConfig, callback)', function () {
      it('should fail on null bucket', function (done) {
        try {
          client.setBucketVersioning(null, {}, function () {});
        } catch (e) {
          done();
        }
      });
      it('should fail on empty bucket', function (done) {
        try {
          client.setBucketVersioning('', {}, function () {});
        } catch (e) {
          done();
        }
      });
      it('should fail on empty versionConfig', function (done) {
        try {
          client.setBucketVersioning('', null, function () {});
        } catch (e) {
          done();
        }
      });
    });
  });
  describe('Bucket and Object Tags APIs', function () {
    describe('Set Bucket Tags ', function () {
      it('should fail on null bucket', function (done) {
        try {
          client.setBucketTagging(null, {}, function () {});
        } catch (e) {
          done();
        }
      });
      it('should fail on empty bucket', function (done) {
        try {
          client.setBucketTagging('', {}, function () {});
        } catch (e) {
          done();
        }
      });
      it('should fail if tags are more than 50', function (done) {
        var _50_plus_key_tags = {};

        for (var i = 0; i < 51; i += 1) {
          _50_plus_key_tags[i] = i;
        }

        try {
          client.setBucketTagging('', _50_plus_key_tags, function () {});
        } catch (e) {
          done();
        }
      });
    });
    describe('Get Bucket Tags', function () {
      it('should fail on invalid bucket', function (done) {
        try {
          client.getBucketTagging('nv', null, function () {});
        } catch (e) {
          done();
        }
      });
      it('should fail on null bucket', function (done) {
        try {
          client.getBucketTagging(null, function () {});
        } catch (e) {
          done();
        }
      });
      it('should fail on empty bucket', function (done) {
        try {
          client.getBucketTagging('', function () {});
        } catch (e) {
          done();
        }
      });
    });
    describe('Remove Bucket Tags', function () {
      it('should fail on null object', function (done) {
        try {
          client.removeBucketTagging(null, function () {});
        } catch (e) {
          done();
        }
      });
      it('should fail on empty bucket', function (done) {
        try {
          client.removeBucketTagging('', function () {});
        } catch (e) {
          done();
        }
      });
      it('should fail on invalid bucket name', function (done) {
        try {
          client.removeBucketTagging('198.51.100.24', function () {});
        } catch (e) {
          done();
        }
      });
      it('should fail on invalid bucket name', function (done) {
        try {
          client.removeBucketTagging('xy', function () {});
        } catch (e) {
          done();
        }
      });
    });
    describe('Put Object Tags', function () {
      it('should fail on null object', function (done) {
        try {
          client.putObjectTagging('my-bucket-name', null, {}, function () {});
        } catch (e) {
          done();
        }
      });
      it('should fail on empty object', function (done) {
        try {
          client.putObjectTagging('my-bucket-name', null, {}, function () {});
        } catch (e) {
          done();
        }
      });
      it('should fail on non object tags', function (done) {
        try {
          client.putObjectTagging('my-bucket-name', null, 'non-obj-tag', function () {});
        } catch (e) {
          done();
        }
      });
      it('should fail if tags are more than 50 on an object', function (done) {
        var _50_plus_key_tags = {};

        for (var i = 0; i < 51; i += 1) {
          _50_plus_key_tags[i] = i;
        }

        try {
          client.putObjectTagging('my-bucket-name', null, _50_plus_key_tags, function () {});
        } catch (e) {
          done();
        }
      });
    });
    describe('Get Object Tags', function () {
      it('should fail on invalid bucket', function (done) {
        try {
          client.getObjectTagging('nv', null, function () {});
        } catch (e) {
          done();
        }
      });
      it('should fail on null object', function (done) {
        try {
          client.getObjectTagging('my-bucket-name', null, function () {});
        } catch (e) {
          done();
        }
      });
      it('should fail on empty object', function (done) {
        try {
          client.getObjectTagging('my-bucket-name', null, function () {});
        } catch (e) {
          done();
        }
      });
    });
    describe('Remove Object Tags', function () {
      it('should fail on null object', function (done) {
        try {
          client.removeObjectTagging('my-bucket', null, function () {});
        } catch (e) {
          done();
        }
      });
      it('should fail on empty bucket', function (done) {
        try {
          client.removeObjectTagging('my-bucket', '', function () {});
        } catch (e) {
          done();
        }
      });
      it('should fail on invalid bucket name', function (done) {
        try {
          client.removeObjectTagging('198.51.100.24', function () {});
        } catch (e) {
          done();
        }
      });
      it('should fail on invalid bucket name', function (done) {
        try {
          client.removeObjectTagging('xy', function () {});
        } catch (e) {
          done();
        }
      });
    });
  });
  describe('setBucketLifecycle(bucket, lifecycleConfig, callback)', function () {
    it('should fail on null bucket', function (done) {
      try {
        client.setBucketLifecycle(null, null, function () {});
      } catch (e) {
        done();
      }
    });
    it('should fail on empty bucket', function (done) {
      try {
        client.setBucketLifecycle('', null, function () {});
      } catch (e) {
        done();
      }
    });
  });
  describe('getBucketLifecycle(bucket, callback)', function () {
    it('should fail on null bucket', function (done) {
      try {
        client.getBucketLifecycle(null, function () {});
      } catch (e) {
        done();
      }
    });
    it('should fail on empty bucket', function (done) {
      try {
        client.getBucketLifecycle('', function () {});
      } catch (e) {
        done();
      }
    });
  });
  describe('removeBucketLifecycle(bucket, callback)', function () {
    it('should fail on null bucket', function (done) {
      try {
        client.removeBucketLifecycle(null, null, function () {});
      } catch (e) {
        done();
      }
    });
    it('should fail on empty bucket', function (done) {
      try {
        client.removeBucketLifecycle('', null, function () {});
      } catch (e) {
        done();
      }
    });
  });
  describe('Object Locking APIs', function () {
    describe('getObjectLockConfig(bucket, callback)', function () {
      it('should fail on null bucket', function (done) {
        try {
          client.getObjectLockConfig(null, function () {});
        } catch (e) {
          done();
        }
      });
      it('should fail on empty bucket', function (done) {
        try {
          client.getObjectLockConfig('', function () {});
        } catch (e) {
          done();
        }
      });
    });
    describe('setObjectLockConfig(bucket, lockConfig, callback)', function () {
      it('should fail on null bucket', function (done) {
        try {
          client.setObjectLockConfig(null, function () {});
        } catch (e) {
          done();
        }
      });
      it('should fail on empty bucket', function (done) {
        try {
          client.setObjectLockConfig('', function () {});
        } catch (e) {
          done();
        }
      });
      it('should fail on passing invalid mode ', function (done) {
        try {
          client.setObjectLockConfig('my-bucket', {
            mode: "invalid_mode"
          }, function () {});
        } catch (e) {
          done();
        }
      });
      it('should fail on passing invalid unit ', function (done) {
        try {
          client.setObjectLockConfig('my-bucket', {
            mode: "COMPLIANCE",
            unit: "invalid_unit"
          }, function () {});
        } catch (e) {
          done();
        }
      });
      it('should fail on passing invalid validity ', function (done) {
        try {
          client.setObjectLockConfig('my-bucket', {
            mode: "COMPLIANCE",
            unit: "invalid_unit",
            validity: ''
          }, function () {});
        } catch (e) {
          done();
        }
      });
      it('should fail on passing  invalid config ', function (done) {
        try {
          client.setObjectLockConfig('my-bucket', {
            mode: "COMPLIANCE",
            randomProp: true,
            nonExisting: false
          }, function () {});
        } catch (e) {
          done();
        }
      });
    });
  });
  describe('Object retention APIs', function () {
    describe('getObjectRetention(bucket, objectName, getRetentionOpts,callback)', function () {
      it('should fail on null bucket', function (done) {
        try {
          client.getObjectRetention(null, '', '', function () {});
        } catch (e) {
          done();
        }
      });
      it('should fail on empty bucket', function (done) {
        try {
          client.getObjectRetention('', '', '', function () {});
        } catch (e) {
          done();
        }
      });
      it('should fail on invalid  object name', function (done) {
        try {
          client.getObjectRetention('my-bucket', null, '', function () {});
        } catch (e) {
          done();
        }
      });
      it('should fail on invalid  versionId', function (done) {
        try {
          client.getObjectRetention('my-bucket', 'objectname', {
            versionId: 123
          }, function () {});
        } catch (e) {
          done();
        }
      });
    });
    describe('putObjectRetention(bucket, objectName, retentionConfig, callback)', function () {
      it('should fail on null bucket', function (done) {
        try {
          client.putObjectRetention(null, '', {}, function () {});
        } catch (e) {
          done();
        }
      });
      it('should fail on empty bucket', function (done) {
        try {
          client.putObjectRetention('', '', {}, function () {});
        } catch (e) {
          done();
        }
      });
      it('should fail on null object', function (done) {
        try {
          client.putObjectRetention('my-bucket', null, {}, function () {});
        } catch (e) {
          done();
        }
      });
      it('should fail on empty object', function (done) {
        try {
          client.putObjectRetention('my-bucket', '', {}, function () {});
        } catch (e) {
          done();
        }
      });
      it('should fail on passing invalid mode ', function (done) {
        try {
          client.putObjectRetention('my-bucket', 'my-object', {
            mode: "invalid_mode"
          }, function () {});
        } catch (e) {
          done();
        }
      });
      it('should fail on passing invalid governanceBypass ', function (done) {
        try {
          client.putObjectRetention('my-bucket', 'my-object', {
            governanceBypass: "nonbool"
          }, function () {});
        } catch (e) {
          done();
        }
      });
      it('should fail on passing invalid (null) retainUntilDate ', function (done) {
        try {
          client.putObjectRetention('my-bucket', 'my-object', {
            retainUntilDate: 12345
          }, function () {});
        } catch (e) {
          done();
        }
      });
      it('should fail on passing invalid versionId ', function (done) {
        try {
          client.putObjectRetention('my-bucket', {
            versionId: "COMPLIANCE"
          }, function () {});
        } catch (e) {
          done();
        }
      });
    });
  });
  describe('Bucket Encryption APIs', function () {
    describe('setBucketEncryption(bucket, encryptionConfig, callback)', function () {
      it('should fail on null bucket', function (done) {
        try {
          client.setBucketEncryption(null, function () {});
        } catch (e) {
          done();
        }
      });
      it('should fail on empty bucket', function (done) {
        try {
          client.setBucketEncryption('', function () {});
        } catch (e) {
          done();
        }
      });
      it('should fail on multiple rules', function (done) {
        try {
          client.setBucketEncryption('my-bucket', {
            //Default Rule
            Rule: [{
              ApplyServerSideEncryptionByDefault: {
                SSEAlgorithm: "AES256"
              }
            }, {
              ApplyServerSideEncryptionByDefault: {
                SSEAlgorithm: "AES256"
              }
            }]
          }, function () {});
        } catch (e) {
          done();
        }
      });
    });
    describe('getBucketEncryption(bucket, callback)', function () {
      it('should fail on null bucket', function (done) {
        try {
          client.getBucketEncryption(null, function () {});
        } catch (e) {
          done();
        }
      });
      it('should fail on empty bucket', function (done) {
        try {
          client.getBucketEncryption('', function () {});
        } catch (e) {
          done();
        }
      });
    });
    describe('removeBucketEncryption(bucket, callback)', function () {
      it('should fail on null bucket', function (done) {
        try {
          client.removeBucketEncryption(null, function () {});
        } catch (e) {
          done();
        }
      });
      it('should fail on empty bucket', function (done) {
        try {
          client.removeBucketEncryption('', function () {});
        } catch (e) {
          done();
        }
      });
    });
  });
  describe('Bucket Replication APIs', function () {
    describe('setBucketReplication(bucketName, replicationConfig, callback)', function () {
      it('should fail on null bucket', function (done) {
        try {
          client.setBucketReplication(null, {}, function () {});
        } catch (e) {
          done();
        }
      });
      it('should fail on empty bucket', function (done) {
        try {
          client.setBucketReplication('', {}, function () {});
        } catch (e) {
          done();
        }
      });
      it('should fail on empty replicationConfig', function (done) {
        try {
          client.setBucketReplication('my-bucket', {}, function () {});
        } catch (e) {
          done();
        }
      });
      it('should fail on empty replicationConfig role', function (done) {
        try {
          client.setBucketReplication('my-bucket', {
            role: ''
          }, function () {});
        } catch (e) {
          done();
        }
      });
      it('should fail on  invalid value for replicationConfig role', function (done) {
        try {
          client.setBucketReplication('my-bucket', {
            role: 12
          }, function () {});
        } catch (e) {
          done();
        }
      });
      it('should fail on  empty value for replicationConfig rules', function (done) {
        try {
          client.setBucketReplication('my-bucket', {
            role: "arn:",
            rules: []
          }, function () {});
        } catch (e) {
          done();
        }
      });
      it('should fail on  null value for replicationConfig rules', function (done) {
        try {
          client.setBucketReplication('my-bucket', {
            role: "arn:",
            rules: null
          }, function () {});
        } catch (e) {
          done();
        }
      });
    });
    describe('getBucketReplication(bucketName, callback)', function () {
      it('should fail on null bucket', function (done) {
        try {
          client.getBucketReplication(null, {}, function () {});
        } catch (e) {
          done();
        }
      });
      it('should fail on empty bucket', function (done) {
        try {
          client.getBucketReplication('', {}, function () {});
        } catch (e) {
          done();
        }
      });
    });
    describe('removeBucketReplication(bucketName, callback)', function () {
      it('should fail on null bucket', function (done) {
        try {
          client.removeBucketReplication(null, {}, function () {});
        } catch (e) {
          done();
        }
      });
      it('should fail on empty bucket', function (done) {
        try {
          client.removeBucketReplication('', {}, function () {});
        } catch (e) {
          done();
        }
      });
    });
  });
  describe('Object Legal Hold APIs', function () {
    describe('getObjectLegalHold(bucketName, objectName, getOpts={}, cb)', function () {
      it('should fail on null bucket', function (done) {
        try {
          client.getObjectLegalHold(null, function () {});
        } catch (e) {
          done();
        }
      });
      it('should fail on empty bucket', function (done) {
        try {
          client.getObjectLegalHold('', function () {});
        } catch (e) {
          done();
        }
      });
      it('should fail on null objectName', function (done) {
        try {
          client.getObjectLegalHold('my-bucket', null, function () {});
        } catch (e) {
          done();
        }
      });
      it('should fail on null getOpts', function (done) {
        try {
          client.getObjectLegalHold('my-bucker', 'my-object', null, function () {});
        } catch (e) {
          done();
        }
      });
    });
    describe('setObjectLegalHold(bucketName, objectName, setOpts={}, cb)', function () {
      it('should fail on null bucket', function (done) {
        try {
          client.setObjectLegalHold(null, function () {});
        } catch (e) {
          done();
        }
      });
      it('should fail on empty bucket', function (done) {
        try {
          client.setObjectLegalHold('', function () {});
        } catch (e) {
          done();
        }
      });
      it('should fail on null objectName', function (done) {
        try {
          client.setObjectLegalHold('my-bucket', null, function () {});
        } catch (e) {
          done();
        }
      });
      it('should fail on null setOpts', function (done) {
        try {
          client.setObjectLegalHold('my-bucker', 'my-object', null, function () {});
        } catch (e) {
          done();
        }
      });
      it('should fail on empty versionId', function (done) {
        try {
          client.setObjectLegalHold('my-bucker', 'my-object', {}, function () {});
        } catch (e) {
          done();
        }
      });
    });
  });
});
//# sourceMappingURL=test.js.map
