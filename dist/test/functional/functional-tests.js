"use strict";

var _helpers = require("../../../dist/main/helpers");

/*
 * MinIO Javascript Library for Amazon S3 Compatible Cloud Storage, (C) 2015 MinIO, Inc.
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
var os = require('os');

var stream = require('stream');

var crypto = require('crypto');

var async = require('async');

var _ = require('lodash');

var fs = require('fs');

var http = require('http');

var https = require('https');

var url = require('url');

var chai = require('chai');

var assert = chai.assert;

var superagent = require('superagent');

var uuid = require("uuid");

var step = require("mocha-steps").step;

var minio;

try {
  minio = require('../../../dist/main/minio');
} catch (err) {
  minio = require('minio');
}

require('source-map-support').install();

describe('functional tests', function () {
  this.timeout(30 * 60 * 1000);
  var playConfig = {}; // If credentials aren't given, default to play.min.io.

  if (process.env['SERVER_ENDPOINT']) {
    var res = process.env['SERVER_ENDPOINT'].split(":");
    playConfig.endPoint = res[0];
    playConfig.port = parseInt(res[1]);
  } else {
    playConfig.endPoint = 'play.min.io';
    playConfig.port = 9000;
  }

  playConfig.accessKey = process.env['ACCESS_KEY'] || 'Q3AM3UQ867SPQQA43P2F';
  playConfig.secretKey = process.env['SECRET_KEY'] || 'zuf+tfteSlswRu7BJ86wekitnifILbZam1KYY3TG'; // If the user provides ENABLE_HTTPS, 1 = secure, anything else = unsecure.
  // Otherwise default useSSL as true.

  if (process.env['ENABLE_HTTPS'] !== undefined) {
    playConfig.useSSL = process.env['ENABLE_HTTPS'] == '1';
  } else {
    playConfig.useSSL = true;
  } // dataDir is falsy if we need to generate data on the fly. Otherwise, it will be
  // a directory with files to read from, i.e. /mint/data.


  var dataDir = process.env['MINT_DATA_DIR']; // set the partSize to ensure multipart upload chunk size.
  // if not set, putObject with stream data and undefined length will use about 500Mb chunkSize (5Tb/10000).

  playConfig.partSize = 64 * 1024 * 1024;
  var client = new minio.Client(playConfig);
  var usEastConfig = playConfig;
  usEastConfig.region = 'us-east-1';
  var clientUsEastRegion = new minio.Client(usEastConfig);
  var bucketName = "minio-js-test-" + uuid.v4();
  var objectName = uuid.v4();
  var _1byteObjectName = 'datafile-1-b';

  var _1byte = dataDir ? fs.readFileSync(dataDir + '/' + _1byteObjectName) : Buffer.alloc(1, 0);

  var _100kbObjectName = 'datafile-100-kB';

  var _100kb = dataDir ? fs.readFileSync(dataDir + '/' + _100kbObjectName) : Buffer.alloc(100 * 1024, 0);

  var _100kbObjectNameCopy = _100kbObjectName + '-copy';

  var _100kbObjectBufferName = `${_100kbObjectName}.buffer`;
  var _MultiPath100kbObjectBufferName = `path/to/${_100kbObjectName}.buffer`;

  var _100kbmd5 = crypto.createHash('md5').update(_100kb).digest('hex');

  var _100kb1kboffsetmd5 = crypto.createHash('md5').update(_100kb.slice(1024)).digest('hex');

  var _65mbObjectName = 'datafile-65-MB';

  var _65mb = dataDir ? fs.readFileSync(dataDir + '/' + _65mbObjectName) : Buffer.alloc(65 * 1024 * 1024, 0);

  var _65mbmd5 = crypto.createHash('md5').update(_65mb).digest('hex');

  var _65mbObjectNameCopy = _65mbObjectName + '-copy';

  var _5mbObjectName = 'datafile-5-MB';

  var _5mb = dataDir ? fs.readFileSync(dataDir + '/' + _5mbObjectName) : Buffer.alloc(5 * 1024 * 1024, 0);

  var _5mbmd5 = crypto.createHash('md5').update(_5mb).digest('hex'); // create new http agent to check requests release sockets


  var httpAgent = (playConfig.useSSL ? https : http).Agent({
    keepAlive: true
  });
  client.setRequestOptions({
    agent: httpAgent
  });
  var metaData = {
    'Content-Type': 'text/html',
    'Content-Language': 'en',
    'X-Amz-Meta-Testing': 1234,
    'randomstuff': 5678
  };
  var tmpDir = os.tmpdir();

  function readableStream(data) {
    var s = new stream.Readable();

    s._read = function () {};

    s.push(data);
    s.push(null);
    return s;
  }

  var traceStream; // FUNCTIONAL_TEST_TRACE env variable contains the path to which trace
  // will be logged. Set it to /dev/stdout log to the stdout.

  if (process.env['FUNCTIONAL_TEST_TRACE']) {
    var filePath = process.env['FUNCTIONAL_TEST_TRACE']; // This is necessary for windows.

    if (filePath === 'process.stdout') {
      traceStream = process.stdout;
    } else {
      traceStream = fs.createWriteStream(filePath, {
        flags: 'a'
      });
    }

    traceStream.write('====================================\n');
    client.traceOn(traceStream);
  }

  before(function (done) {
    return client.makeBucket(bucketName, '', done);
  });
  after(function (done) {
    return client.removeBucket(bucketName, done);
  });

  if (traceStream) {
    after(function () {
      client.traceOff();

      if (filePath !== 'process.stdout') {
        traceStream.end();
      }
    });
  }

  describe('makeBucket with period and region', function () {
    if (playConfig.endPoint === 's3.amazonaws.com') {
      step('makeBucket(bucketName, region, cb)_region:eu-central-1_', function (done) {
        return client.makeBucket(`${bucketName}.sec.period`, 'eu-central-1', done);
      });
      step('removeBucket(bucketName, cb)__', function (done) {
        return client.removeBucket(`${bucketName}.sec.period`, done);
      });
    }
  });
  describe('listBuckets', function () {
    step('listBuckets(cb)__', function (done) {
      client.listBuckets(function (e, buckets) {
        if (e) return done(e);
        if (_.find(buckets, {
          name: bucketName
        })) return done();
        done(new Error('bucket not found'));
      });
    });
    step('listBuckets()__', function (done) {
      client.listBuckets().then(function (buckets) {
        if (!_.find(buckets, {
          name: bucketName
        })) return done(new Error('bucket not found'));
      }).then(function () {
        return done();
      }).catch(done);
    });
  });
  describe('makeBucket with region', function () {
    step(`makeBucket(bucketName, region, cb)_bucketName:${bucketName}-region, region:us-east-2_`, function (done) {
      try {
        clientUsEastRegion.makeBucket(`${bucketName}-region`, 'us-east-2', assert.fail);
      } catch (e) {
        done();
      }
    });
    step(`makeBucket(bucketName, region, cb)_bucketName:${bucketName}-region, region:us-east-1_`, function (done) {
      clientUsEastRegion.makeBucket(`${bucketName}-region`, 'us-east-1', done);
    });
    step(`removeBucket(bucketName, cb)_bucketName:${bucketName}-region_`, function (done) {
      clientUsEastRegion.removeBucket(`${bucketName}-region`, done);
    });
    step(`makeBucket(bucketName, region)_bucketName:${bucketName}-region, region:us-east-1_`, function (done) {
      clientUsEastRegion.makeBucket(`${bucketName}-region`, 'us-east-1', function (e) {
        if (e) {
          // Some object storage servers like Azure, might not delete a bucket rightaway
          // Add a sleep of 40 seconds and retry
          setTimeout(function () {
            clientUsEastRegion.makeBucket(`${bucketName}-region`, 'us-east-1', done);
          }, 40 * 1000);
        } else done();
      });
    });
    step(`removeBucket(bucketName)_bucketName:${bucketName}-region_`, function (done) {
      clientUsEastRegion.removeBucket(`${bucketName}-region`).then(function () {
        return done();
      }).catch(done);
    });
  });
  describe('bucketExists', function () {
    step(`bucketExists(bucketName, cb)_bucketName:${bucketName}_`, function (done) {
      return client.bucketExists(bucketName, done);
    });
    step(`bucketExists(bucketName, cb)_bucketName:${bucketName}random_`, function (done) {
      client.bucketExists(bucketName + 'random', function (e, exists) {
        if (e === null && !exists) return done();
        done(new Error());
      });
    });
    step(`bucketExists(bucketName)_bucketName:${bucketName}_`, function (done) {
      client.bucketExists(bucketName).then(function () {
        return done();
      }).catch(done);
    });
  });
  describe('removeBucket', function () {
    step(`removeBucket(bucketName, cb)_bucketName:${bucketName}random_`, function (done) {
      client.removeBucket(bucketName + 'random', function (e) {
        if (e.code === 'NoSuchBucket') return done();
        done(new Error());
      });
    });
    step(`makeBucket(bucketName, region)_bucketName:${bucketName}-region-1, region:us-east-1_`, function (done) {
      client.makeBucket(`${bucketName}-region-1`, 'us-east-1').then(function () {
        return client.removeBucket(`${bucketName}-region-1`);
      }).then(function () {
        return done();
      }).catch(done);
    });
  });
  describe('tests for putObject getObject removeObject with multipath', function () {
    step(`putObject(bucketName, objectName, stream)_bucketName:${bucketName}, objectName:${_MultiPath100kbObjectBufferName}, stream:100Kib_`, function (done) {
      client.putObject(bucketName, _MultiPath100kbObjectBufferName, _100kb).then(function () {
        return done();
      }).catch(done);
    });
    step(`getObject(bucketName, objectName, callback)_bucketName:${bucketName}, objectName:${_MultiPath100kbObjectBufferName}_`, function (done) {
      var hash = crypto.createHash('md5');
      client.getObject(bucketName, _MultiPath100kbObjectBufferName, function (e, stream) {
        if (e) return done(e);
        stream.on('data', function (data) {
          return hash.update(data);
        });
        stream.on('error', done);
        stream.on('end', function () {
          if (hash.digest('hex') === _100kbmd5) return done();
          done(new Error('content mismatch'));
        });
      });
    });
    step(`removeObject(bucketName, objectName)_bucketName:${bucketName}, objectName:${_MultiPath100kbObjectBufferName}_`, function (done) {
      client.removeObject(bucketName, _MultiPath100kbObjectBufferName).then(function () {
        return done();
      }).catch(done);
    });
  });
  describe('tests for putObject copyObject getObject getPartialObject statObject removeObject', function () {
    var tmpFileUpload = `${tmpDir}/${_100kbObjectName}`;
    step(`fPutObject(bucketName, objectName, filePath, metaData, callback)_bucketName:${bucketName}, objectName:${_100kbObjectName}, filePath: ${tmpFileUpload}_`, function (done) {
      fs.writeFileSync(tmpFileUpload, _100kb);
      client.fPutObject(bucketName, _100kbObjectName, tmpFileUpload, done);
    });
    step(`statObject(bucketName, objectName, cb)_bucketName:${bucketName}, objectName:${_100kbObjectName}_`, function (done) {
      client.statObject(bucketName, _100kbObjectName, function (e, stat) {
        if (e) return done(e); // As metadata is not provided and there is no file extension,
        // we default to 'application/octet-stream' as per `probeContentType` function

        if (stat.metaData && stat.metaData['content-type'] !== 'application/octet-stream') {
          return done(new Error('content-type mismatch'));
        }

        done();
      });
    });
    var tmpFileUploadWithExt = `${tmpDir}/${_100kbObjectName}.txt`;
    step(`fPutObject(bucketName, objectName, filePath, metaData, callback)_bucketName:${bucketName}, objectName:${_100kbObjectName}, filePath: ${tmpFileUploadWithExt}, metaData:${metaData}_`, function (done) {
      fs.writeFileSync(tmpFileUploadWithExt, _100kb);
      client.fPutObject(bucketName, _100kbObjectName, tmpFileUploadWithExt, metaData, done);
    });
    step(`statObject(bucketName, objectName, cb)_bucketName:${bucketName}, objectName:${_100kbObjectName}_`, function (done) {
      client.statObject(bucketName, _100kbObjectName, function (e, stat) {
        if (e) return done(e); // As metadata is provided, even though we have an extension,
        // the `content-type` should be equal what was declared on the metadata

        if (stat.metaData && stat.metaData['content-type'] !== 'text/html') {
          return done(new Error('content-type mismatch'));
        } else if (!stat.metaData) {
          return done(new Error('no metadata present'));
        }

        done();
      });
    });
    step(`fPutObject(bucketName, objectName, filePath, metaData, callback)_bucketName:${bucketName}, objectName:${_100kbObjectName}, filePath: ${tmpFileUploadWithExt}_`, function (done) {
      fs.writeFileSync(tmpFileUploadWithExt, _100kb);
      client.fPutObject(bucketName, _100kbObjectName, tmpFileUploadWithExt, done);
    });
    step(`statObject(bucketName, objectName, cb)_bucketName:${bucketName}, objectName:${_100kbObjectName}_`, function (done) {
      client.statObject(bucketName, _100kbObjectName, function (e, stat) {
        if (e) return done(e); // As metadata is not provided but we have a file extension,
        // we need to infer `content-type` from the file extension

        if (stat.metaData && stat.metaData['content-type'] !== 'text/plain') return done(new Error('content-type mismatch'));
        done();
      });
    });
    step(`putObject(bucketName, objectName, stream, size, metaData, callback)_bucketName:${bucketName}, objectName:${_100kbObjectName}, stream:100kb, size:${_100kb.length}, metaData:${metaData}_`, function (done) {
      var stream = readableStream(_100kb);
      client.putObject(bucketName, _100kbObjectName, stream, _100kb.length, metaData, done);
    });
    step(`putObject(bucketName, objectName, stream, size, metaData, callback)_bucketName:${bucketName}, objectName:${_100kbObjectName}, stream:100kb, size:${_100kb.length}_`, function (done) {
      var stream = readableStream(_100kb);
      client.putObject(bucketName, _100kbObjectName, stream, _100kb.length, done);
    });
    step(`getObject(bucketName, objectName, callback)_bucketName:${bucketName}, objectName:${_100kbObjectName}_`, function (done) {
      var hash = crypto.createHash('md5');
      client.getObject(bucketName, _100kbObjectName, function (e, stream) {
        if (e) return done(e);
        stream.on('data', function (data) {
          return hash.update(data);
        });
        stream.on('error', done);
        stream.on('end', function () {
          if (hash.digest('hex') === _100kbmd5) return done();
          done(new Error('content mismatch'));
        });
      });
    });
    step(`putObject(bucketName, objectName, stream, callback)_bucketName:${bucketName}, objectName:${_100kbObjectBufferName}, stream:100kb_`, function (done) {
      client.putObject(bucketName, _100kbObjectBufferName, _100kb, '', done);
    });
    step(`getObject(bucketName, objectName, callback)_bucketName:${bucketName}, objectName:${_100kbObjectBufferName}_`, function (done) {
      var hash = crypto.createHash('md5');
      client.getObject(bucketName, _100kbObjectBufferName, function (e, stream) {
        if (e) return done(e);
        stream.on('data', function (data) {
          return hash.update(data);
        });
        stream.on('error', done);
        stream.on('end', function () {
          if (hash.digest('hex') === _100kbmd5) return done();
          done(new Error('content mismatch'));
        });
      });
    });
    step(`putObject(bucketName, objectName, stream, metaData)_bucketName:${bucketName}, objectName:${_100kbObjectBufferName}, stream:100kb_, metaData:{}`, function (done) {
      client.putObject(bucketName, _100kbObjectBufferName, _100kb, {}).then(function () {
        return done();
      }).catch(done);
    });
    step(`getPartialObject(bucketName, objectName, offset, length, cb)_bucketName:${bucketName}, objectName:${_100kbObjectBufferName}, offset:0, length=1024_`, function (done) {
      client.getPartialObject(bucketName, _100kbObjectBufferName, 0, 1024).then(function (stream) {
        stream.on('data', function () {});
        stream.on('end', done);
      }).catch(done);
    });
    step(`getPartialObject(bucketName, objectName, offset, length, cb)_bucketName:${bucketName}, objectName:${_100kbObjectBufferName}, offset:1024, length=1024_`, function (done) {
      var expectedHash = crypto.createHash('md5').update(_100kb.slice(1024, 2048)).digest('hex');
      var hash = crypto.createHash('md5');
      client.getPartialObject(bucketName, _100kbObjectBufferName, 1024, 1024).then(function (stream) {
        stream.on('data', function (data) {
          return hash.update(data);
        });
        stream.on('end', function () {
          if (hash.digest('hex') === expectedHash) return done();
          done(new Error('content mismatch'));
        });
      }).catch(done);
    });
    step(`getPartialObject(bucketName, objectName, offset, length, cb)_bucketName:${bucketName}, objectName:${_100kbObjectBufferName}, offset:1024`, function (done) {
      var hash = crypto.createHash('md5');
      client.getPartialObject(bucketName, _100kbObjectBufferName, 1024).then(function (stream) {
        stream.on('data', function (data) {
          return hash.update(data);
        });
        stream.on('end', function () {
          if (hash.digest('hex') === _100kb1kboffsetmd5) return done();
          done(new Error('content mismatch'));
        });
      }).catch(done);
    });
    step(`getObject(bucketName, objectName)_bucketName:${bucketName}, objectName:${_100kbObjectBufferName}_`, function (done) {
      client.getObject(bucketName, _100kbObjectBufferName).then(function (stream) {
        stream.on('data', function () {});
        stream.on('end', done);
      }).catch(done);
    });
    step(`putObject(bucketName, objectName, stream, cb)_bucketName:${bucketName}, objectName:${_65mbObjectName}_`, function (done) {
      var stream = readableStream(_65mb);
      client.putObject(bucketName, _65mbObjectName, stream, function () {
        setTimeout(function () {
          if (Object.values(httpAgent.sockets).length === 0) return done();
          done(new Error('http request did not release network socket'));
        }, 0);
      });
    });
    step(`getObject(bucketName, objectName, cb)_bucketName:${bucketName}, objectName:${_65mbObjectName}_`, function (done) {
      var hash = crypto.createHash('md5');
      client.getObject(bucketName, _65mbObjectName, function (e, stream) {
        if (e) return done(e);
        stream.on('data', function (data) {
          return hash.update(data);
        });
        stream.on('error', done);
        stream.on('end', function () {
          if (hash.digest('hex') === _65mbmd5) return done();
          done(new Error('content mismatch'));
        });
      });
    });
    step(`getObject(bucketName, objectName, cb)_bucketName:${bucketName} non-existent object`, function (done) {
      client.getObject(bucketName, 'an-object-that-does-not-exist', function (e, stream) {
        if (stream) return done(new Error("on errors the stream object should not exist"));
        if (!e) return done(new Error("expected an error object"));
        if (e.code !== 'NoSuchKey') return done(new Error("expected NoSuchKey error"));
        done();
      });
    });
    step(`getPartialObject(bucketName, objectName, offset, length, cb)_bucketName:${bucketName}, objectName:${_65mbObjectName}, offset:0, length:100*1024_`, function (done) {
      var hash = crypto.createHash('md5');
      var expectedHash = crypto.createHash('md5').update(_65mb.slice(0, 100 * 1024)).digest('hex');
      client.getPartialObject(bucketName, _65mbObjectName, 0, 100 * 1024, function (e, stream) {
        if (e) return done(e);
        stream.on('data', function (data) {
          return hash.update(data);
        });
        stream.on('error', done);
        stream.on('end', function () {
          if (hash.digest('hex') === expectedHash) return done();
          done(new Error('content mismatch'));
        });
      });
    });
    step(`copyObject(bucketName, objectName, srcObject, cb)_bucketName:${bucketName}, objectName:${_65mbObjectNameCopy}, srcObject:/${bucketName}/${_65mbObjectName}_`, function (done) {
      client.copyObject(bucketName, _65mbObjectNameCopy, "/" + bucketName + "/" + _65mbObjectName, function (e) {
        if (e) return done(e);
        done();
      });
    });
    step(`copyObject(bucketName, objectName, srcObject)_bucketName:${bucketName}, objectName:${_65mbObjectNameCopy}, srcObject:/${bucketName}/${_65mbObjectName}_`, function (done) {
      client.copyObject(bucketName, _65mbObjectNameCopy, "/" + bucketName + "/" + _65mbObjectName).then(function () {
        return done();
      }).catch(done);
    });
    step(`statObject(bucketName, objectName, cb)_bucketName:${bucketName}, objectName:${_65mbObjectName}_`, function (done) {
      client.statObject(bucketName, _65mbObjectName, function (e, stat) {
        if (e) return done(e);
        if (stat.size !== _65mb.length) return done(new Error('size mismatch'));
        done();
      });
    });
    step(`statObject(bucketName, objectName)_bucketName:${bucketName}, objectName:${_65mbObjectName}_`, function (done) {
      client.statObject(bucketName, _65mbObjectName).then(function (stat) {
        if (stat.size !== _65mb.length) return done(new Error('size mismatch'));
      }).then(function () {
        return done();
      }).catch(done);
    });
    step(`removeObject(bucketName, objectName)_bucketName:${bucketName}, objectName:${_100kbObjectName}_`, function (done) {
      client.removeObject(bucketName, _100kbObjectName).then(function () {
        async.map([_100kbObjectBufferName, _65mbObjectName, _65mbObjectNameCopy], function (objectName, cb) {
          return client.removeObject(bucketName, objectName, cb);
        }, done);
      }).catch(done);
    });
  });
  describe('tests for copyObject statObject', function () {
    var etag;
    var modifiedDate;
    step(`putObject(bucketName, objectName, stream, metaData, cb)_bucketName:${bucketName}, objectName:${_100kbObjectName}, stream: 100kb, metaData:${metaData}_`, function (done) {
      client.putObject(bucketName, _100kbObjectName, _100kb, metaData, done);
    });
    step(`copyObject(bucketName, objectName, srcObject, cb)_bucketName:${bucketName}, objectName:${_100kbObjectNameCopy}, srcObject:/${bucketName}/${_100kbObjectName}_`, function (done) {
      client.copyObject(bucketName, _100kbObjectNameCopy, "/" + bucketName + "/" + _100kbObjectName, function (e) {
        if (e) return done(e);
        done();
      });
    });
    step(`statObject(bucketName, objectName, cb)_bucketName:${bucketName}, objectName:${_100kbObjectName}_`, function (done) {
      client.statObject(bucketName, _100kbObjectName, function (e, stat) {
        if (e) return done(e);
        if (stat.size !== _100kb.length) return done(new Error('size mismatch'));
        assert.equal(stat.metaData['content-type'], metaData['Content-Type']);
        assert.equal(stat.metaData['Testing'], metaData['Testing']);
        assert.equal(stat.metaData['randomstuff'], metaData['randomstuff']);
        etag = stat.etag;
        modifiedDate = stat.modifiedDate;
        done();
      });
    });
    step(`copyObject(bucketName, objectName, srcObject, conditions, cb)_bucketName:${bucketName}, objectName:${_100kbObjectNameCopy}, srcObject:/${bucketName}/${_100kbObjectName}, conditions:ExceptIncorrectEtag_`, function (done) {
      var conds = new minio.CopyConditions();
      conds.setMatchETagExcept('TestEtag');
      client.copyObject(bucketName, _100kbObjectNameCopy, "/" + bucketName + "/" + _100kbObjectName, conds, function (e) {
        if (e) return done(e);
        done();
      });
    });
    step(`copyObject(bucketName, objectName, srcObject, conditions, cb)_bucketName:${bucketName}, objectName:${_100kbObjectNameCopy}, srcObject:/${bucketName}/${_100kbObjectName}, conditions:ExceptCorrectEtag_`, function (done) {
      var conds = new minio.CopyConditions();
      conds.setMatchETagExcept(etag);
      client.copyObject(bucketName, _100kbObjectNameCopy, "/" + bucketName + "/" + _100kbObjectName, conds).then(function () {
        done(new Error("CopyObject should have failed."));
      }).catch(function () {
        return done();
      });
    });
    step(`copyObject(bucketName, objectName, srcObject, conditions, cb)_bucketName:${bucketName}, objectName:${_100kbObjectNameCopy}, srcObject:/${bucketName}/${_100kbObjectName}, conditions:MatchCorrectEtag_`, function (done) {
      var conds = new minio.CopyConditions();
      conds.setMatchETag(etag);
      client.copyObject(bucketName, _100kbObjectNameCopy, "/" + bucketName + "/" + _100kbObjectName, conds, function (e) {
        if (e) return done(e);
        done();
      });
    });
    step(`copyObject(bucketName, objectName, srcObject, conditions, cb)_bucketName:${bucketName}, objectName:${_100kbObjectNameCopy}, srcObject:/${bucketName}/${_100kbObjectName}, conditions:MatchIncorrectEtag_`, function (done) {
      var conds = new minio.CopyConditions();
      conds.setMatchETag('TestETag');
      client.copyObject(bucketName, _100kbObjectNameCopy, "/" + bucketName + "/" + _100kbObjectName, conds).then(function () {
        done(new Error("CopyObject should have failed."));
      }).catch(function () {
        return done();
      });
    });
    step(`copyObject(bucketName, objectName, srcObject, conditions, cb)_bucketName:${bucketName}, objectName:${_100kbObjectNameCopy}, srcObject:/${bucketName}/${_100kbObjectName}, conditions:Unmodified since ${modifiedDate}`, function (done) {
      var conds = new minio.CopyConditions();
      conds.setUnmodified(new Date(modifiedDate));
      client.copyObject(bucketName, _100kbObjectNameCopy, "/" + bucketName + "/" + _100kbObjectName, conds, function (e) {
        if (e) return done(e);
        done();
      });
    });
    step(`copyObject(bucketName, objectName, srcObject, conditions, cb)_bucketName:${bucketName}, objectName:${_100kbObjectNameCopy}, srcObject:/${bucketName}/${_100kbObjectName}, conditions:Unmodified since 2010-03-26T12:00:00Z_`, function (done) {
      var conds = new minio.CopyConditions();
      conds.setUnmodified(new Date("2010-03-26T12:00:00Z"));
      client.copyObject(bucketName, _100kbObjectNameCopy, "/" + bucketName + "/" + _100kbObjectName, conds).then(function () {
        done(new Error("CopyObject should have failed."));
      }).catch(function () {
        return done();
      });
    });
    step(`statObject(bucketName, objectName, cb)_bucketName:${bucketName}, objectName:${_100kbObjectNameCopy}_`, function (done) {
      client.statObject(bucketName, _100kbObjectNameCopy, function (e, stat) {
        if (e) return done(e);
        if (stat.size !== _100kb.length) return done(new Error('size mismatch'));
        done();
      });
    });
    step(`removeObject(bucketName, objectName, cb)_bucketName:${bucketName}, objectName:${_100kbObjectNameCopy}_`, function (done) {
      async.map([_100kbObjectName, _100kbObjectNameCopy], function (objectName, cb) {
        return client.removeObject(bucketName, objectName, cb);
      }, done);
    });
  });
  describe('listIncompleteUploads removeIncompleteUpload', function () {
    step(`initiateNewMultipartUpload(bucketName, objectName, metaData, cb)_bucketName:${bucketName}, objectName:${_65mbObjectName}, metaData:${metaData}`, function (done) {
      client.initiateNewMultipartUpload(bucketName, _65mbObjectName, metaData, done);
    });
    step(`listIncompleteUploads(bucketName, prefix, recursive)_bucketName:${bucketName}, prefix:${_65mbObjectName}, recursive: true_`, function (done) {
      // MinIO's ListIncompleteUploads returns an empty list, so skip this on non-AWS.
      // See: https://github.com/minio/minio/commit/75c43bfb6c4a2ace
      if (!client.host.includes('s3.amazonaws.com')) {
        this.skip();
      }

      var found = false;
      client.listIncompleteUploads(bucketName, _65mbObjectName, true).on('error', function (e) {
        return done(e);
      }).on('data', function (data) {
        if (data.key === _65mbObjectName) found = true;
      }).on('end', function () {
        if (found) return done();
        done(new Error(`${_65mbObjectName} not found during listIncompleteUploads`));
      });
    });
    step(`listIncompleteUploads(bucketName, prefix, recursive)_bucketName:${bucketName}, recursive: true_`, function (done) {
      // MinIO's ListIncompleteUploads returns an empty list, so skip this on non-AWS.
      // See: https://github.com/minio/minio/commit/75c43bfb6c4a2ace
      if (!client.host.includes('s3.amazonaws.com')) {
        this.skip();
      }

      var found = false;
      client.listIncompleteUploads(bucketName, "", true).on('error', function (e) {
        return done(e);
      }).on('data', function (data) {
        if (data.key === _65mbObjectName) found = true;
      }).on('end', function () {
        if (found) return done();
        done(new Error(`${_65mbObjectName} not found during listIncompleteUploads`));
      });
    });
    step(`removeIncompleteUploads(bucketName, prefix)_bucketName:${bucketName}, prefix:${_65mbObjectName}_`, function (done) {
      client.removeIncompleteUpload(bucketName, _65mbObjectName).then(done).catch(done);
    });
  });
  describe('fPutObject fGetObject', function () {
    var tmpFileUpload = `${tmpDir}/${_65mbObjectName}`;
    var tmpFileDownload = `${tmpDir}/${_65mbObjectName}.download`;
    step(`fPutObject(bucketName, objectName, filePath, callback)_bucketName:${bucketName}, objectName:${_65mbObjectName}, filePath:${tmpFileUpload}_`, function (done) {
      fs.writeFileSync(tmpFileUpload, _65mb);
      client.fPutObject(bucketName, _65mbObjectName, tmpFileUpload, function () {
        setTimeout(function () {
          if (Object.values(httpAgent.sockets).length === 0) return done();
          done(new Error('http request did not release network socket'));
        }, 0);
      });
    });
    step(`fPutObject(bucketName, objectName, filePath, metaData, callback)_bucketName:${bucketName}, objectName:${_65mbObjectName}, filePath:${tmpFileUpload}, metaData: ${metaData}_`, function (done) {
      return client.fPutObject(bucketName, _65mbObjectName, tmpFileUpload, metaData, done);
    });
    step(`fGetObject(bucketName, objectName, filePath, callback)_bucketName:${bucketName}, objectName:${_65mbObjectName}, filePath:${tmpFileDownload}_`, function (done) {
      client.fGetObject(bucketName, _65mbObjectName, tmpFileDownload).then(function () {
        var md5sum = crypto.createHash('md5').update(fs.readFileSync(tmpFileDownload)).digest('hex');
        if (md5sum === _65mbmd5) return done();
        return done(new Error('md5sum mismatch'));
      }).catch(done);
    });
    step(`removeObject(bucketName, objectName, filePath, callback)_bucketName:${bucketName}, objectName:${_65mbObjectName}_`, function (done) {
      fs.unlinkSync(tmpFileDownload);
      client.removeObject(bucketName, _65mbObjectName).then(function () {
        return done();
      }).catch(done);
    });
    step(`fPutObject(bucketName, objectName, filePath, metaData)_bucketName:${bucketName}, objectName:${_65mbObjectName}, filePath:${tmpFileUpload}_`, function (done) {
      client.fPutObject(bucketName, _65mbObjectName, tmpFileUpload).then(function () {
        return done();
      }).catch(done);
    });
    step(`fGetObject(bucketName, objectName, filePath)_bucketName:${bucketName}, objectName:${_65mbObjectName}, filePath:${tmpFileDownload}_`, function (done) {
      client.fGetObject(bucketName, _65mbObjectName, tmpFileDownload).then(function () {
        return done();
      }).catch(done);
    });
    step(`removeObject(bucketName, objectName, filePath, callback)_bucketName:${bucketName}, objectName:${_65mbObjectName}_`, function (done) {
      fs.unlinkSync(tmpFileUpload);
      fs.unlinkSync(tmpFileDownload);
      client.removeObject(bucketName, _65mbObjectName, done);
    });
  });
  describe('fGetObject-resume', function () {
    var localFile = `${tmpDir}/${_5mbObjectName}`;
    var etag = '';
    step(`putObject(bucketName, objectName, stream, metaData, cb)_bucketName:${bucketName}, objectName:${_5mbObjectName}, stream:5mb_`, function (done) {
      var stream = readableStream(_5mb);
      client.putObject(bucketName, _5mbObjectName, stream, _5mb.length, {}).then(function (resp) {
        etag = resp;
        done();
      }).catch(done);
    });
    step(`fGetObject(bucketName, objectName, filePath, callback)_bucketName:${bucketName}, objectName:${_5mbObjectName}, filePath:${localFile}`, function (done) {
      var bufPart = Buffer.alloc(_100kb.length);

      _5mb.copy(bufPart, 0, 0, _100kb.length);

      var tmpFile = `${tmpDir}/${_5mbObjectName}.${etag}.part.minio`; // create a partial file

      fs.writeFileSync(tmpFile, bufPart);
      client.fGetObject(bucketName, _5mbObjectName, localFile).then(function () {
        var md5sum = crypto.createHash('md5').update(fs.readFileSync(localFile)).digest('hex');
        if (md5sum === _5mbmd5) return done();
        return done(new Error('md5sum mismatch'));
      }).catch(done);
    });
    step(`removeObject(bucketName, objectName, callback)_bucketName:${bucketName}, objectName:${_5mbObjectName}_`, function (done) {
      fs.unlinkSync(localFile);
      client.removeObject(bucketName, _5mbObjectName, done);
    });
  });
  describe('bucket policy', function () {
    var policy = `{"Version":"2012-10-17","Statement":[{"Action":["s3:GetBucketLocation","s3:ListBucket"],"Effect":"Allow","Principal":{"AWS":["*"]},"Resource":["arn:aws:s3:::${bucketName}"],"Sid":""},{"Action":["s3:GetObject"],"Effect":"Allow","Principal":{"AWS":["*"]},"Resource":["arn:aws:s3:::${bucketName}/*"],"Sid":""}]}`;
    step(`setBucketPolicy(bucketName, bucketPolicy, cb)_bucketName:${bucketName}, bucketPolicy:${policy}_`, function (done) {
      client.setBucketPolicy(bucketName, policy, function (err) {
        if (err && err.code == 'NotImplemented') return done();
        if (err) return done(err);
        done();
      });
    });
    step(`getBucketPolicy(bucketName, cb)_bucketName:${bucketName}_`, function (done) {
      client.getBucketPolicy(bucketName, function (err, response) {
        if (err && err.code == 'NotImplemented') return done();
        if (err) return done(err);

        if (!response) {
          return done(new Error(`policy is empty`));
        }

        done();
      });
    });
  });
  describe('presigned operations', function () {
    step(`presignedPutObject(bucketName, objectName, expires, cb)_bucketName:${bucketName}, objectName:${_1byteObjectName}, expires: 1000_`, function (done) {
      client.presignedPutObject(bucketName, _1byteObjectName, 1000, function (e, presignedUrl) {
        if (e) return done(e);
        var transport = http;

        var options = _.pick(url.parse(presignedUrl), ['hostname', 'port', 'path', 'protocol']);

        options.method = 'PUT';
        options.headers = {
          'content-length': _1byte.length
        };
        if (options.protocol === 'https:') transport = https;
        var request = transport.request(options, function (response) {
          if (response.statusCode !== 200) return done(new Error(`error on put : ${response.statusCode}`));
          response.on('error', function (e) {
            return done(e);
          });
          response.on('end', function () {
            return done();
          });
          response.on('data', function () {});
        });
        request.on('error', function (e) {
          return done(e);
        });
        request.write(_1byte);
        request.end();
      });
    });
    step(`presignedPutObject(bucketName, objectName, expires)_bucketName:${bucketName}, objectName:${_1byteObjectName}, expires:-123_`, function (done) {
      // negative values should trigger an error
      client.presignedPutObject(bucketName, _1byteObjectName, -123).then(function () {
        done(new Error('negative values should trigger an error'));
      }).catch(function () {
        return done();
      });
    });
    step(`presignedPutObject(bucketName, objectName)_bucketName:${bucketName}, objectName:${_1byteObjectName}_`, function (done) {
      // Putting the same object should not cause any error
      client.presignedPutObject(bucketName, _1byteObjectName).then(function () {
        return done();
      }).catch(done);
    });
    step(`presignedGetObject(bucketName, objectName, expires, cb)_bucketName:${bucketName}, objectName:${_1byteObjectName}, expires:1000_`, function (done) {
      client.presignedGetObject(bucketName, _1byteObjectName, 1000, function (e, presignedUrl) {
        if (e) return done(e);
        var transport = http;

        var options = _.pick(url.parse(presignedUrl), ['hostname', 'port', 'path', 'protocol']);

        options.method = 'GET';
        if (options.protocol === 'https:') transport = https;
        var request = transport.request(options, function (response) {
          if (response.statusCode !== 200) return done(new Error(`error on put : ${response.statusCode}`));
          var error = null;
          response.on('error', function (e) {
            return done(e);
          });
          response.on('end', function () {
            return done(error);
          });
          response.on('data', function (data) {
            if (data.toString() !== _1byte.toString()) {
              error = new Error('content mismatch');
            }
          });
        });
        request.on('error', function (e) {
          return done(e);
        });
        request.end();
      });
    });
    step(`presignedUrl(httpMethod, bucketName, objectName, expires, cb)_httpMethod:GET, bucketName:${bucketName}, objectName:${_1byteObjectName}, expires:1000_`, function (done) {
      client.presignedUrl('GET', bucketName, _1byteObjectName, 1000, function (e, presignedUrl) {
        if (e) return done(e);
        var transport = http;

        var options = _.pick(url.parse(presignedUrl), ['hostname', 'port', 'path', 'protocol']);

        options.method = 'GET';
        if (options.protocol === 'https:') transport = https;
        var request = transport.request(options, function (response) {
          if (response.statusCode !== 200) return done(new Error(`error on put : ${response.statusCode}`));
          var error = null;
          response.on('error', function (e) {
            return done(e);
          });
          response.on('end', function () {
            return done(error);
          });
          response.on('data', function (data) {
            if (data.toString() !== _1byte.toString()) {
              error = new Error('content mismatch');
            }
          });
        });
        request.on('error', function (e) {
          return done(e);
        });
        request.end();
      });
    });
    step(`presignedUrl(httpMethod, bucketName, objectName, expires, cb)_httpMethod:GET, bucketName:${bucketName}, objectName:${_1byteObjectName}, expires:86400, requestDate:StartOfDay_`, function (done) {
      var requestDate = new Date();
      requestDate.setHours(0, 0, 0, 0);
      client.presignedUrl('GET', bucketName, _1byteObjectName, 86400, requestDate, function (e, presignedUrl) {
        if (e) return done(e);
        var transport = http;

        var options = _.pick(url.parse(presignedUrl), ['hostname', 'port', 'path', 'protocol']);

        options.method = 'GET';
        if (options.protocol === 'https:') transport = https;
        var request = transport.request(options, function (response) {
          if (response.statusCode !== 200) return done(new Error(`error on put : ${response.statusCode}`));
          var error = null;
          response.on('error', function (e) {
            return done(e);
          });
          response.on('end', function () {
            return done(error);
          });
          response.on('data', function (data) {
            if (data.toString() !== _1byte.toString()) {
              error = new Error('content mismatch');
            }
          });
        });
        request.on('error', function (e) {
          return done(e);
        });
        request.end();
      });
    });
    step(`presignedGetObject(bucketName, objectName, cb)_bucketName:${bucketName}, objectName:${_1byteObjectName}_`, function (done) {
      client.presignedGetObject(bucketName, _1byteObjectName, function (e, presignedUrl) {
        if (e) return done(e);
        var transport = http;

        var options = _.pick(url.parse(presignedUrl), ['hostname', 'port', 'path', 'protocol']);

        options.method = 'GET';
        if (options.protocol === 'https:') transport = https;
        var request = transport.request(options, function (response) {
          if (response.statusCode !== 200) return done(new Error(`error on put : ${response.statusCode}`));
          var error = null;
          response.on('error', function (e) {
            return done(e);
          });
          response.on('end', function () {
            return done(error);
          });
          response.on('data', function (data) {
            if (data.toString() !== _1byte.toString()) {
              error = new Error('content mismatch');
            }
          });
        });
        request.on('error', function (e) {
          return done(e);
        });
        request.end();
      });
    });
    step(`presignedGetObject(bucketName, objectName, expires)_bucketName:${bucketName}, objectName:this.does.not.exist, expires:2938_`, function (done) {
      client.presignedGetObject(bucketName, 'this.does.not.exist', 2938).then(assert.fail).catch(function () {
        return done();
      });
    });
    step(`presignedGetObject(bucketName, objectName, expires, respHeaders, cb)_bucketName:${bucketName}, objectName:${_1byteObjectName}, expires:1000_`, function (done) {
      var respHeaders = {
        'response-content-type': 'text/html',
        'response-content-language': 'en',
        'response-expires': 'Sun, 07 Jun 2020 16:07:58 GMT',
        'response-cache-control': 'No-cache',
        'response-content-disposition': 'attachment; filename=testing.txt',
        'response-content-encoding': 'gzip'
      };
      client.presignedGetObject(bucketName, _1byteObjectName, 1000, respHeaders, function (e, presignedUrl) {
        if (e) return done(e);
        var transport = http;

        var options = _.pick(url.parse(presignedUrl), ['hostname', 'port', 'path', 'protocol']);

        options.method = 'GET';
        if (options.protocol === 'https:') transport = https;
        var request = transport.request(options, function (response) {
          if (response.statusCode !== 200) return done(new Error(`error on get : ${response.statusCode}`));

          if (respHeaders['response-content-type'] != response.headers['content-type']) {
            return done(new Error(`content-type header mismatch`));
          }

          if (respHeaders['response-content-language'] != response.headers['content-language']) {
            return done(new Error(`content-language header mismatch`));
          }

          if (respHeaders['response-expires'] != response.headers['expires']) {
            return done(new Error(`expires header mismatch`));
          }

          if (respHeaders['response-cache-control'] != response.headers['cache-control']) {
            return done(new Error(`cache-control header mismatch`));
          }

          if (respHeaders['response-content-disposition'] != response.headers['content-disposition']) {
            return done(new Error(`content-disposition header mismatch`));
          }

          if (respHeaders['response-content-encoding'] != response.headers['content-encoding']) {
            return done(new Error(`content-encoding header mismatch`));
          }

          response.on('data', function () {});
          done();
        });
        request.on('error', function (e) {
          return done(e);
        });
        request.end();
      });
    });
    step(`presignedGetObject(bucketName, objectName, cb)_bucketName:${bucketName}, objectName:${_1byteObjectName}, expires:86400, requestDate:StartOfDay_`, function (done) {
      var requestDate = new Date();
      requestDate.setHours(0, 0, 0, 0);
      client.presignedGetObject(bucketName, _1byteObjectName, 86400, {}, requestDate, function (e, presignedUrl) {
        if (e) return done(e);
        var transport = http;

        var options = _.pick(url.parse(presignedUrl), ['hostname', 'port', 'path', 'protocol']);

        options.method = 'GET';
        if (options.protocol === 'https:') transport = https;
        var request = transport.request(options, function (response) {
          if (response.statusCode !== 200) return done(new Error(`error on put : ${response.statusCode}`));
          var error = null;
          response.on('error', function (e) {
            return done(e);
          });
          response.on('end', function () {
            return done(error);
          });
          response.on('data', function (data) {
            if (data.toString() !== _1byte.toString()) {
              error = new Error('content mismatch');
            }
          });
        });
        request.on('error', function (e) {
          return done(e);
        });
        request.end();
      });
    });
    step('presignedPostPolicy(postPolicy, cb)_postPolicy:expiresin10days_', function (done) {
      var policy = client.newPostPolicy();
      policy.setKey(_1byteObjectName);
      policy.setBucket(bucketName);
      var expires = new Date();
      expires.setSeconds(24 * 60 * 60 * 10);
      policy.setExpires(expires);
      client.presignedPostPolicy(policy, function (e, data) {
        if (e) return done(e);
        var req = superagent.post(data.postURL);

        _.each(data.formData, function (value, key) {
          return req.field(key, value);
        });

        req.attach('file', Buffer.from([_1byte]), 'test');
        req.end(function (e) {
          if (e) return done(e);
          done();
        });
        req.on('error', function (e) {
          return done(e);
        });
      });
    });
    step('presignedPostPolicy(postPolicy)_postPolicy: null_', function (done) {
      client.presignedPostPolicy(null).then(function () {
        done(new Error('null policy should fail'));
      }).catch(function () {
        return done();
      });
    });
    step(`presignedUrl(httpMethod, bucketName, objectName, expires, reqParams, cb)_httpMethod:GET, bucketName:${bucketName}, expires:1000_`, function (done) {
      client.presignedUrl('GET', bucketName, '', 1000, {
        'prefix': 'data',
        'max-keys': 1000
      }, function (e, presignedUrl) {
        if (e) return done(e);
        var transport = http;

        var options = _.pick(url.parse(presignedUrl), ['hostname', 'port', 'path', 'protocol']);

        options.method = 'GET';
        options.headers = {};
        var str = '';
        if (options.protocol === 'https:') transport = https;

        var callback = function callback(response) {
          if (response.statusCode !== 200) return done(new Error(`error on put : ${response.statusCode}`));
          response.on('error', function (e) {
            return done(e);
          });
          response.on('end', function () {
            if (!str.match(`<Key>${_1byteObjectName}</Key>`)) {
              return done(new Error('Listed object does not match the object in the bucket!'));
            }

            done();
          });
          response.on('data', function (chunk) {
            str += chunk;
          });
        };

        var request = transport.request(options, callback);
        request.end();
      });
    });
    step(`presignedUrl(httpMethod, bucketName, objectName, expires, cb)_httpMethod:DELETE, bucketName:${bucketName}, objectName:${_1byteObjectName}, expires:1000_`, function (done) {
      client.presignedUrl('DELETE', bucketName, _1byteObjectName, 1000, function (e, presignedUrl) {
        if (e) return done(e);
        var transport = http;

        var options = _.pick(url.parse(presignedUrl), ['hostname', 'port', 'path', 'protocol']);

        options.method = 'DELETE';
        options.headers = {};
        if (options.protocol === 'https:') transport = https;
        var request = transport.request(options, function (response) {
          if (response.statusCode !== 204) return done(new Error(`error on put : ${response.statusCode}`));
          response.on('error', function (e) {
            return done(e);
          });
          response.on('end', function () {
            return done();
          });
          response.on('data', function () {});
        });
        request.on('error', function (e) {
          return done(e);
        });
        request.end();
      });
    });
  });
  describe('listObjects', function () {
    var listObjectPrefix = 'miniojsPrefix';
    var listObjectsNum = 10;
    var objArray = [];
    var listArray = [];
    var listPrefixArray = [];
    step(`putObject(bucketName, objectName, stream, size, metaData, callback)_bucketName:${bucketName}, stream:1b, size:1_Create ${listObjectsNum} objects`, function (done) {
      _.times(listObjectsNum, function (i) {
        return objArray.push(`${listObjectPrefix}.${i}`);
      });

      objArray = objArray.sort();
      async.mapLimit(objArray, 20, function (objectName, cb) {
        return client.putObject(bucketName, objectName, readableStream(_1byte), _1byte.length, {}, cb);
      }, done);
    });
    step(`listObjects(bucketName, prefix, recursive)_bucketName:${bucketName}, prefix: miniojsprefix, recursive:true_`, function (done) {
      client.listObjects(bucketName, listObjectPrefix, true).on('error', done).on('end', function () {
        if (_.isEqual(objArray, listPrefixArray)) return done();
        return done(new Error(`listObjects lists ${listPrefixArray.length} objects, expected ${listObjectsNum}`));
      }).on('data', function (data) {
        listPrefixArray.push(data.name);
      });
    });
    step('listObjects(bucketName, prefix, recursive)_recursive:true_', function (done) {
      try {
        client.listObjects("", "", true).on('end', function () {
          return done(new Error(`listObjects should throw exception when empty bucketname is passed`));
        });
      } catch (e) {
        if (e.name == 'InvalidBucketNameError') {
          done();
        } else {
          done(e);
        }
      }
    });
    step(`listObjects(bucketName, prefix, recursive)_bucketName:${bucketName}, recursive:false_`, function (done) {
      listArray = [];
      client.listObjects(bucketName, '', false).on('error', done).on('end', function () {
        if (_.isEqual(objArray, listArray)) return done();
        return done(new Error(`listObjects lists ${listArray.length} objects, expected ${listObjectsNum}`));
      }).on('data', function (data) {
        listArray.push(data.name);
      });
    });
    step(`listObjectsV2(bucketName, prefix, recursive, startAfter)_bucketName:${bucketName}, recursive:true_`, function (done) {
      listArray = [];
      client.listObjectsV2(bucketName, '', true, '').on('error', done).on('end', function () {
        if (_.isEqual(objArray, listArray)) return done();
        return done(new Error(`listObjects lists ${listArray.length} objects, expected ${listObjectsNum}`));
      }).on('data', function (data) {
        listArray.push(data.name);
      });
    });
    step(`listObjectsV2WithMetadata(bucketName, prefix, recursive, startAfter)_bucketName:${bucketName}, recursive:true_`, function (done) {
      listArray = [];
      client.extensions.listObjectsV2WithMetadata(bucketName, '', true, '').on('error', done).on('end', function () {
        if (_.isEqual(objArray, listArray)) return done();
        return done(new Error(`listObjects lists ${listArray.length} objects, expected ${listObjectsNum}`));
      }).on('data', function (data) {
        listArray.push(data.name);
      });
    });
    step(`removeObject(bucketName, objectName, callback)_bucketName:${bucketName}_Remove ${listObjectsNum} objects`, function (done) {
      async.mapLimit(listArray, 20, function (objectName, cb) {
        return client.removeObject(bucketName, objectName, cb);
      }, done);
    });
  });
  describe('removeObjects', function () {
    var listObjectPrefix = 'miniojsPrefix';
    var listObjectsNum = 10;
    var objArray = [];
    var objectsList = [];
    step(`putObject(bucketName, objectName, stream, size, contentType, callback)_bucketName:${bucketName}, stream:1b, size:1_Create ${listObjectsNum} objects`, function (done) {
      _.times(listObjectsNum, function (i) {
        return objArray.push(`${listObjectPrefix}.${i}`);
      });

      objArray = objArray.sort();
      async.mapLimit(objArray, 20, function (objectName, cb) {
        return client.putObject(bucketName, objectName, readableStream(_1byte), _1byte.length, '', cb);
      }, done);
    });
    step(`listObjects(bucketName, prefix, recursive)_bucketName:${bucketName}, recursive:false_`, function (done) {
      client.listObjects(bucketName, listObjectPrefix, false).on('error', done).on('end', function () {
        try {
          client.removeObjects(bucketName, '', function (e) {
            if (e) {
              done();
            }
          });
        } catch (e) {
          if (e.name === "InvalidArgumentError") {
            done();
          }
        }
      }).on('data', function (data) {
        objectsList.push(data.name);
      });
    });
    objectsList = [];
    step(`listObjects(bucketName, prefix, recursive)_bucketName:${bucketName}, recursive:false_`, function (done) {
      client.listObjects(bucketName, listObjectPrefix, false).on('error', done).on('end', function () {
        client.removeObjects(bucketName, objectsList, function (e) {
          if (e) {
            done(e);
          }

          done();
        });
      }).on('data', function (data) {
        objectsList.push(data.name);
      });
    }); // Non latin characters

    step(`putObject(bucketName, objectName, stream)_bucketName:${bucketName}, objectName:fileΩ, stream:1b`, function (done) {
      client.putObject(bucketName, 'fileΩ', _1byte).then(function () {
        return done();
      }).catch(done);
    });
    step(`removeObjects with non latin charactes`, function (done) {
      client.removeObjects(bucketName, ['fileΩ']).then(function () {
        return done();
      }).catch(done);
    });
  });
  describe('bucket notifications', function () {
    describe('#listenBucketNotification', function () {
      before(function () {
        // listenBucketNotification only works on MinIO, so skip if
        // the host is Amazon.
        if (client.host.includes('s3.amazonaws.com')) {
          this.skip();
        }
      });
      step(`listenBucketNotification(bucketName, prefix, suffix, events)_bucketName:${bucketName}, prefix:photos/, suffix:.jpg, events:bad_`, function (done) {
        var poller = client.listenBucketNotification(bucketName, 'photos/', '.jpg', ['bad']);
        poller.on('error', function (error) {
          if (error.code != 'NotImplemented') {
            assert.match(error.message, /A specified event is not supported for notifications./);
            assert.equal(error.code, 'InvalidArgument');
          }

          done();
        });
      });
      step(`listenBucketNotification(bucketName, prefix, suffix, events)_bucketName:${bucketName}, events: s3:ObjectCreated:*_`, function (done) {
        var poller = client.listenBucketNotification(bucketName, '', '', ['s3:ObjectCreated:*']);
        var records = 0;
        var pollerError = null;
        poller.on('notification', function (record) {
          records++;
          assert.equal(record.eventName, 's3:ObjectCreated:Put');
          assert.equal(record.s3.bucket.name, bucketName);
          assert.equal(record.s3.object.key, objectName);
        });
        poller.on('error', function (error) {
          pollerError = error;
        });
        setTimeout(function () {
          // Give it some time for the notification to be setup.
          if (pollerError) {
            if (pollerError.code != 'NotImplemented') {
              done(pollerError);
            } else {
              done();
            }

            return;
          }

          client.putObject(bucketName, objectName, 'stringdata', function (err) {
            if (err) return done(err);
            setTimeout(function () {
              // Give it some time to get the notification.
              poller.stop();
              client.removeObject(bucketName, objectName, function (err) {
                if (err) return done(err);
                if (!records) return done(new Error('notification not received'));
                done();
              });
            }, 10 * 1000);
          });
        }, 10 * 1000);
      }); // This test is very similar to that above, except it does not include
      // Minio.ObjectCreatedAll in the config. Thus, no events should be emitted.

      step(`listenBucketNotification(bucketName, prefix, suffix, events)_bucketName:${bucketName}, events:s3:ObjectRemoved:*`, function (done) {
        var poller = client.listenBucketNotification(bucketName, '', '', ['s3:ObjectRemoved:*']);
        poller.on('notification', assert.fail);
        poller.on('error', function (error) {
          if (error.code != 'NotImplemented') {
            done(error);
          }
        });
        client.putObject(bucketName, objectName, 'stringdata', function (err) {
          if (err) return done(err); // It polls every five seconds, so wait for two-ish polls, then end.

          setTimeout(function () {
            poller.stop();
            poller.removeAllListeners('notification'); // clean up object now

            client.removeObject(bucketName, objectName, done);
          }, 11 * 1000);
        });
      });
    });
  });
  describe('Bucket Versioning API', function () {
    //Isolate the bucket/object for easy debugging and tracking.
    var versionedBucketName = "minio-js-test-version-" + uuid.v4();
    before(function (done) {
      return client.makeBucket(versionedBucketName, '', done);
    });
    after(function (done) {
      return client.removeBucket(versionedBucketName, done);
    });
    describe('Versioning Steps test', function () {
      step("Check if versioning is enabled on a bucket", function (done) {
        client.getBucketVersioning(versionedBucketName, function (err) {
          if (err && err.code === 'NotImplemented') return done();
          if (err) return done(err);
          done();
        });
      });
      step("Enable versioning  on a bucket", function (done) {
        client.setBucketVersioning(versionedBucketName, {
          Status: "Enabled"
        }, function (err) {
          if (err && err.code === 'NotImplemented') return done();
          if (err) return done(err);
          done();
        });
      });
      step("Suspend versioning  on a bucket", function (done) {
        client.setBucketVersioning(versionedBucketName, {
          Status: "Suspended"
        }, function (err) {
          if (err && err.code === 'NotImplemented') return done();
          if (err) return done(err);
          done();
        });
      });
      step("Check if versioning is Suspended on a bucket", function (done) {
        client.getBucketVersioning(versionedBucketName, function (err) {
          if (err && err.code === 'NotImplemented') return done();
          if (err) return done(err);
          done();
        });
      });
    });
  });
  describe('Versioning tests on a buckets', function () {
    //Isolate the bucket/object for easy debugging and tracking.
    var versionedBucketName = "minio-js-test-version-" + uuid.v4();
    var versioned_100kbObjectName = 'datafile-versioned-100-kB';
    var versioned_100kb_Object = dataDir ? fs.readFileSync(dataDir + '/' + versioned_100kbObjectName) : Buffer.alloc(100 * 1024, 0);
    before(function (done) {
      return client.makeBucket(versionedBucketName, '', done);
    });
    after(function (done) {
      return client.removeBucket(versionedBucketName, done);
    });
    describe('Versioning Steps test', function () {
      var versionId;
      step(`setBucketVersioning(bucketName, versionConfig):_bucketName:${versionedBucketName},versionConfig:{Status:"Enabled"} `, function (done) {
        client.setBucketVersioning(versionedBucketName, {
          Status: "Enabled"
        }, function (err) {
          if (err && err.code === 'NotImplemented') return done();
          if (err) return done(err);
          done();
        });
      });
      step(`putObject(bucketName, objectName, stream)_bucketName:${versionedBucketName}, objectName:${versioned_100kbObjectName}, stream:100Kib_`, function (done) {
        client.putObject(versionedBucketName, versioned_100kbObjectName, versioned_100kb_Object).then(function () {
          return done();
        }).catch(done);
      });
      step(`statObject(bucketName, objectName, statOpts)_bucketName:${versionedBucketName}, objectName:${versioned_100kbObjectName}`, function (done) {
        client.statObject(versionedBucketName, versioned_100kbObjectName, {}, function (e, res) {
          versionId = res.versionId;
          done();
        });
      });
      step(`removeObject(bucketName, objectName, removeOpts)_bucketName:${versionedBucketName}, objectName:${versioned_100kbObjectName}`, function (done) {
        client.removeObject(versionedBucketName, versioned_100kbObjectName, {
          versionId: versionId
        }, function () {
          done();
        });
      });
      step(`setBucketVersioning(bucketName, versionConfig):_bucketName:${versionedBucketName},versionConfig:{Status:"Suspended"}`, function (done) {
        client.setBucketVersioning(versionedBucketName, {
          Status: "Suspended"
        }, function (err) {
          if (err && err.code === 'NotImplemented') return done();
          if (err) return done(err);
          done();
        });
      });
    });
  });
  describe('Versioning tests on a buckets: getObject, fGetObject, getPartialObject, putObject, removeObject with versionId support', function () {
    //Isolate the bucket/object for easy debugging and tracking.
    var versionedBucketName = "minio-js-test-version-" + uuid.v4();
    var versioned_100kbObjectName = 'datafile-versioned-100-kB';
    var versioned_100kb_Object = dataDir ? fs.readFileSync(dataDir + '/' + versioned_100kbObjectName) : Buffer.alloc(100 * 1024, 0);
    before(function (done) {
      return client.makeBucket(versionedBucketName, '', done);
    });
    after(function (done) {
      return client.removeBucket(versionedBucketName, done);
    });
    describe('Versioning Test for  getObject, getPartialObject, putObject, removeObject with versionId support', function () {
      var versionId = null;
      step(`Enable Versioning on Bucket: setBucketVersioning(bucketName,versioningConfig)_bucketName:${versionedBucketName},{Status:"Enabled"}`, function (done) {
        client.setBucketVersioning(versionedBucketName, {
          Status: "Enabled"
        }, function (err) {
          if (err && err.code === 'NotImplemented') return done();
          if (err) return done(err);
          done();
        });
      });
      step(`putObject(bucketName, objectName, stream)_bucketName:${versionedBucketName}, objectName:${versioned_100kbObjectName}, stream:100Kib_`, function (done) {
        client.putObject(versionedBucketName, versioned_100kbObjectName, versioned_100kb_Object).then(function () {
          var res = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

          if (res.versionId) {
            versionId = res.versionId; // In gateway mode versionId will not be returned.
          }

          done();
        }).catch(done);
      });
      step(`getObject(bucketName, objectName, getOpts)_bucketName:${versionedBucketName}, objectName:${versioned_100kbObjectName}`, function (done) {
        if (versionId) {
          client.getObject(versionedBucketName, versioned_100kbObjectName, {
            versionId: versionId
          }, function (e, dataStream) {
            var objVersion = (0, _helpers.getVersionId)(dataStream.headers);

            if (objVersion) {
              done();
            } else {
              done(new Error('versionId not found in getObject response'));
            }
          });
        } else {
          done();
        }
      });
      step(`fGetObject(bucketName, objectName, filePath, getOpts={})_bucketName:${versionedBucketName}, objectName:${versioned_100kbObjectName}`, function (done) {
        if (versionId) {
          var tmpFileDownload = `${tmpDir}/${versioned_100kbObjectName}.download`;
          client.fGetObject(versionedBucketName, versioned_100kbObjectName, tmpFileDownload, {
            versionId: versionId
          }, function () {
            done();
          });
        } else {
          done();
        }
      });
      step(`getPartialObject(bucketName, objectName, offset, length, getOpts)_bucketName:${versionedBucketName}, objectName:${versioned_100kbObjectName}`, function (done) {
        if (versionId) {
          client.getPartialObject(versionedBucketName, versioned_100kbObjectName, 10, 30, {
            versionId: versionId
          }, function (e, dataStream) {
            var objVersion = (0, _helpers.getVersionId)(dataStream.headers);

            if (objVersion) {
              done();
            } else {
              done(new Error('versionId not found in getPartialObject response'));
            }
          });
        } else {
          done();
        }
      });
      step(`removeObject(bucketName, objectName, removeOpts)_bucketName:${versionedBucketName}, objectName:${versioned_100kbObjectName},removeOpts:{versionId:${versionId}`, function (done) {
        if (versionId) {
          client.removeObject(versionedBucketName, versioned_100kbObjectName, {
            versionId: versionId
          }, function () {
            done();
          });
        } else {
          //In gateway mode, use regular delete to remove an object so that the bucket can be cleaned up.
          client.removeObject(versionedBucketName, versioned_100kbObjectName, function () {
            done();
          });
        }
      });
      step(`setBucketVersioning(bucketName, versionConfig):_bucketName:${versionedBucketName},versionConfig:{Status:"Suspended"}`, function (done) {
        client.setBucketVersioning(versionedBucketName, {
          Status: "Suspended"
        }, function (err) {
          if (err && err.code === 'NotImplemented') return done();
          if (err) return done(err);
          done();
        });
      });
    });
  });
  describe('Versioning Supported listObjects', function () {
    var versionedBucketName = "minio-js-test-version-list" + uuid.v4();
    var prefixName = "Prefix1";
    var versionedObjectName = "datafile-versioned-list-100-kB";
    var objVersionIdCounter = [1, 2, 3, 4, 5]; // This should track adding 5 versions of the same object.

    var listObjectsNum = objVersionIdCounter.length;
    var objArray = [];
    var listPrefixArray = [];
    var isVersioningSupported = false;
    var objNameWithPrefix = `${prefixName}/${versionedObjectName}`;
    before(function (done) {
      return client.makeBucket(versionedBucketName, '', function () {
        client.setBucketVersioning(versionedBucketName, {
          Status: "Enabled"
        }, function (err) {
          if (err && err.code === 'NotImplemented') return done();
          if (err) return done(err);
          isVersioningSupported = true;
          done();
        });
      });
    });
    after(function (done) {
      return client.removeBucket(versionedBucketName, done);
    });
    step(`putObject(bucketName, objectName, stream, size, metaData, callback)_bucketName:${versionedBucketName}, stream:1b, size:1_Create ${listObjectsNum} objects`, function (done) {
      if (isVersioningSupported) {
        var count = 1;
        objVersionIdCounter.forEach(function () {
          client.putObject(versionedBucketName, objNameWithPrefix, readableStream(_1byte), _1byte.length, {}, function (e, data) {
            objArray.push(data);

            if (count === objVersionIdCounter.length) {
              done();
            }

            count += 1;
          });
        });
      } else {
        done();
      }
    });
    step(`listObjects(bucketName, prefix, recursive)_bucketName:${versionedBucketName}, prefix: '', recursive:true_`, function (done) {
      if (isVersioningSupported) {
        client.listObjects(versionedBucketName, '', true, {
          IncludeVersion: true
        }).on('error', done).on('end', function () {
          if (_.isEqual(objArray.length, listPrefixArray.length)) return done();
          return done(new Error(`listObjects lists ${listPrefixArray.length} objects, expected ${listObjectsNum}`));
        }).on('data', function (data) {
          listPrefixArray.push(data);
        });
      } else {
        done();
      }
    });
    step(`listObjects(bucketName, prefix, recursive)_bucketName:${versionedBucketName}, prefix: ${prefixName}, recursive:true_`, function (done) {
      if (isVersioningSupported) {
        listPrefixArray = [];
        client.listObjects(versionedBucketName, prefixName, true, {
          IncludeVersion: true
        }).on('error', done).on('end', function () {
          if (_.isEqual(objArray.length, listPrefixArray.length)) return done();
          return done(new Error(`listObjects lists ${listPrefixArray.length} objects, expected ${listObjectsNum}`));
        }).on('data', function (data) {
          listPrefixArray.push(data);
        });
      } else {
        done();
      }
    });
    step(`removeObject(bucketName, objectName, removeOpts)_bucketName:${versionedBucketName}_Remove ${listObjectsNum} objects`, function (done) {
      if (isVersioningSupported) {
        var count = 1;
        listPrefixArray.forEach(function (item) {
          client.removeObject(versionedBucketName, item.name, {
            versionId: item.versionId
          }, function () {
            if (count === listPrefixArray.length) {
              done();
            }

            count += 1;
          });
        });
      } else {
        done();
      }
    });
  });
  describe('Versioning tests on a bucket for Deletion of Multiple versions', function () {
    //Isolate the bucket/object for easy debugging and tracking.
    var versionedBucketName = "minio-js-test-version-" + uuid.v4();
    var versioned_100kbObjectName = 'datafile-versioned-100-kB';
    var versioned_100kb_Object = dataDir ? fs.readFileSync(dataDir + '/' + versioned_100kbObjectName) : Buffer.alloc(100 * 1024, 0);
    before(function (done) {
      return client.makeBucket(versionedBucketName, '', done);
    });
    after(function (done) {
      return client.removeBucket(versionedBucketName, done);
    });
    describe('Test for removal of multiple versions', function () {
      var isVersioningSupported = false;
      var objVersionList = [];
      step(`setBucketVersioning(bucketName, versionConfig):_bucketName:${versionedBucketName},versionConfig:{Status:"Enabled"} `, function (done) {
        client.setBucketVersioning(versionedBucketName, {
          Status: "Enabled"
        }, function (err) {
          if (err && err.code === 'NotImplemented') return done();
          if (err) return done(err);
          isVersioningSupported = true;
          done();
        });
      });
      step(`putObject(bucketName, objectName, stream)_bucketName:${versionedBucketName}, objectName:${versioned_100kbObjectName}, stream:100Kib_`, function (done) {
        if (isVersioningSupported) {
          client.putObject(versionedBucketName, versioned_100kbObjectName, versioned_100kb_Object).then(function () {
            return done();
          }).catch(done);
        } else {
          done();
        }
      }); //Put two versions of the same object.

      step(`putObject(bucketName, objectName, stream)_bucketName:${versionedBucketName}, objectName:${versioned_100kbObjectName}, stream:100Kib_`, function (done) {
        //Put two versions of the same object.
        if (isVersioningSupported) {
          client.putObject(versionedBucketName, versioned_100kbObjectName, versioned_100kb_Object).then(function () {
            return done();
          }).catch(done);
        } else {
          done();
        }
      });
      step(`listObjects(bucketName, prefix, recursive)_bucketName:${versionedBucketName}, prefix: '', recursive:true_`, function (done) {
        if (isVersioningSupported) {
          client.listObjects(versionedBucketName, '', true, {
            IncludeVersion: true
          }).on('error', done).on('end', function () {
            if (_.isEqual(2, objVersionList.length)) return done();
            return done(new Error(`listObjects lists ${objVersionList.length} objects, expected ${2}`));
          }).on('data', function (data) {
            //Pass list object response as is to remove objects
            objVersionList.push(data);
          });
        } else {
          done();
        }
      });
      step(`removeObjects(bucketName, objectList, removeOpts)_bucketName:${versionedBucketName}_Remove ${objVersionList.length} objects`, function (done) {
        if (isVersioningSupported) {
          var count = 1;
          objVersionList.forEach(function () {
            //remove multiple versions of the object.
            client.removeObjects(versionedBucketName, objVersionList, function () {
              if (count === objVersionList.length) {
                done();
              }

              count += 1;
            });
          });
        } else {
          done();
        }
      });
    });
  });
  describe('Bucket Tags API', function () {
    //Isolate the bucket/object for easy debugging and tracking.
    var tagsBucketName = "minio-js-test-tags-" + uuid.v4();
    before(function (done) {
      return client.makeBucket(tagsBucketName, '', done);
    });
    after(function (done) {
      return client.removeBucket(tagsBucketName, done);
    });
    describe('set, get and remove Tags on a bucket', function () {
      step(`Set tags on a bucket_bucketName:${tagsBucketName}`, function (done) {
        client.setBucketTagging(tagsBucketName, {
          'test-tag-key': 'test-tag-value'
        }, function (err) {
          if (err) return done(err);
          done();
        });
      });
      step(`Get tags on a bucket_bucketName:${tagsBucketName}`, function (done) {
        client.getBucketTagging(tagsBucketName, function (err, tagList) {
          if (err) return done(err);

          if ((0, _helpers.isArray)(tagList)) {
            done();
          }
        });
      });
      step(`remove Tags on a bucket_bucketName:${tagsBucketName}`, function (done) {
        client.removeBucketTagging(tagsBucketName, function (err) {
          if (err) return done(err);
          done();
        });
      });
    });
  });
  describe('Object Tags API', function () {
    //Isolate the bucket/object for easy debugging and tracking.
    var tagsBucketName = "minio-js-test-tags-" + uuid.v4();
    before(function (done) {
      return client.makeBucket(tagsBucketName, '', done);
    });
    after(function (done) {
      return client.removeBucket(tagsBucketName, done);
    });
    var tagObjName = 'datafile-tags-100-kB';
    var tagObject = Buffer.alloc(100 * 1024, 0);
    describe('set, get and remove Tags on an object', function () {
      step(`putObject(bucketName, objectName, stream)_bucketName:${tagsBucketName}, objectName:${tagObjName}, stream:100Kib_`, function (done) {
        client.putObject(tagsBucketName, tagObjName, tagObject).then(function () {
          return done();
        }).catch(done);
      });
      step(`putObjectTagging  object_bucketName:${tagsBucketName}, objectName:${tagObjName},`, function (done) {
        client.setObjectTagging(tagsBucketName, tagObjName, {
          'test-tag-key-obj': 'test-tag-value-obj'
        }, function (err) {
          if (err) return done(err);
          done();
        });
      });
      step(`getObjectTagging  object_bucketName:${tagsBucketName}, objectName:${tagObjName},`, function (done) {
        client.getObjectTagging(tagsBucketName, tagObjName, function (err, tagList) {
          if (err) return done(err);

          if ((0, _helpers.isArray)(tagList)) {
            done();
          }
        });
      });
      step(`removeObjectTagging on an object_bucketName:${tagsBucketName}, objectName:${tagObjName},`, function (done) {
        client.removeObjectTagging(tagsBucketName, tagObjName, function (err) {
          if (err) return done();
          done();
        });
      });
      step(`removeObject object_bucketName:${tagsBucketName}, objectName:${tagObjName},`, function (done) {
        client.removeObject(tagsBucketName, tagObjName, function () {
          done();
        });
      });
    });
  });
  describe('Object Tags API with Versioning support', function () {
    //Isolate the bucket/object for easy debugging and tracking.
    var tagsVersionedBucketName = "minio-js-test-tags-version-" + uuid.v4();
    before(function (done) {
      return client.makeBucket(tagsVersionedBucketName, '', done);
    });
    after(function (done) {
      return client.removeBucket(tagsVersionedBucketName, done);
    });
    var tagObjName = 'datafile-versioned-100-kB';
    var tagObject = Buffer.alloc(100 * 1024, 0);
    var isVersioningSupported = false;
    var versionId = null;
    describe('set, get and remove Tags on a versioned object', function () {
      step(`Enable Versioning on Bucket: setBucketVersioning(bucketName,versioningConfig)_bucketName:${tagsVersionedBucketName},{Status:"Enabled"}`, function (done) {
        client.setBucketVersioning(tagsVersionedBucketName, {
          Status: "Enabled"
        }, function (err) {
          if (err && err.code === 'NotImplemented') return done();
          if (err) return done(err);
          isVersioningSupported = true;
          done();
        });
      });
      step(`putObject(bucketName, objectName, stream)_bucketName:${tagsVersionedBucketName}, objectName:${tagObjName}, stream:100Kib_`, function (done) {
        if (isVersioningSupported) {
          client.putObject(tagsVersionedBucketName, tagObjName, tagObject).then(function () {
            var res = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

            if (res.versionId) {
              versionId = res.versionId; // In gateway mode versionId will not be returned.
            }

            done();
          }).catch(done);
        } else {
          done();
        }
      });
      step(`Set tags on an object_bucketName:${tagsVersionedBucketName}, objectName:${tagObjName},`, function (done) {
        if (isVersioningSupported) {
          client.setObjectTagging(tagsVersionedBucketName, tagObjName, {
            'test-tag-key-obj': 'test-tag-value-obj'
          }, {
            versionId: versionId
          }, function (err) {
            if (err) return done(err);
            done();
          });
        } else {
          done();
        }
      });
      step(`Get tags on an object_bucketName:${tagsVersionedBucketName}, objectName:${tagObjName},`, function (done) {
        if (isVersioningSupported) {
          client.getObjectTagging(tagsVersionedBucketName, tagObjName, {
            versionId: versionId
          }, function (err, tagList) {
            if (err) return done(err);

            if ((0, _helpers.isArray)(tagList)) {
              done();
            }
          });
        } else {
          done();
        }
      });
      step(`remove Tags on an object_bucketName:${tagsVersionedBucketName}, objectName:${tagObjName},`, function (done) {
        if (isVersioningSupported) {
          client.removeObjectTagging(tagsVersionedBucketName, tagObjName, {
            versionId: versionId
          }, function (err) {
            if (err) return done();
            done();
          });
        } else {
          done();
        }
      });
      step(`remove Tags on an object_bucketName:${tagsVersionedBucketName}, objectName:${tagObjName},`, function (done) {
        if (isVersioningSupported) {
          client.removeObject(tagsVersionedBucketName, tagObjName, {
            versionId: versionId
          }, function () {
            done();
          });
        } else {
          done();
        }
      });
    });
  });
  describe('Bucket Lifecycle API', function () {
    var bucketName = "minio-js-test-lifecycle-" + uuid.v4();
    before(function (done) {
      return client.makeBucket(bucketName, '', done);
    });
    after(function (done) {
      return client.removeBucket(bucketName, done);
    });
    describe('Set, Get Lifecycle config Tests', function () {
      step(`Set lifecycle config on a bucket:_bucketName:${bucketName}`, function (done) {
        var lifecycleConfig = {
          Rule: [{
            "ID": "Transition and Expiration Rule",
            "Status": "Enabled",
            "Filter": {
              "Prefix": ""
            },
            "Expiration": {
              "Days": "3650"
            }
          }]
        };
        client.setBucketLifecycle(bucketName, lifecycleConfig, function (err) {
          if (err && err.code === 'NotImplemented') return done();
          if (err) return done(err);
          done();
        });
      });
      step("Set lifecycle config of a bucket", function (done) {
        client.getBucketLifecycle(bucketName, function (err) {
          if (err && err.code === 'NotImplemented') return done();
          if (err) return done(err);
          done();
        });
      });
      step("Remove lifecycle config of a bucket", function (done) {
        client.removeBucketLifecycle(bucketName, function (err) {
          if (err && err.code === 'NotImplemented') return done();
          if (err) return done(err);
          done();
        });
      });
    });
  });
  describe('Versioning Supported preSignedUrl Get, Put Tests', function () {
    /**
         * Test Steps
         * 1. Create Versioned Bucket
         * 2. presignedPutObject of 2 Versions of different size
         * 3. List and ensure that there are two versions
         * 4. presignedGetObject with versionId to ensure that we are able to get
         * 5. Remove each version
         * 6. Cleanup bucket.
         */
    var versionedBucketName = "minio-js-test-ver-presign" + uuid.v4();
    var versionedPresignObjName = 'datafile-1-b';

    var _100_byte = Buffer.alloc(100 * 1024, 0);

    var _200_byte = Buffer.alloc(200 * 1024, 0);

    var isVersioningSupported = false;
    var objectsList = [];

    function putPreSignedObject(bucketName, objectName) {
      var expires = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1000;

      var _incoming_obj = arguments.length > 3 ? arguments[3] : undefined;

      var cb = arguments.length > 4 ? arguments[4] : undefined;
      client.presignedPutObject(bucketName, objectName, expires, function (e, presignedUrl) {
        if (e) {
          cb && cb();
        }

        var mobileClientReqWithProtocol = http;

        var upldRequestOptions = _.pick(url.parse(presignedUrl), ['hostname', 'port', 'path', 'protocol']);

        upldRequestOptions.method = 'PUT';
        upldRequestOptions.headers = {
          'content-length': _incoming_obj.length
        };

        if (upldRequestOptions.protocol === 'https:') {
          mobileClientReqWithProtocol = https;
        }

        var uploadRequest = mobileClientReqWithProtocol.request(upldRequestOptions, function (response) {
          if (response.statusCode !== 200) return new Error(`error on put : ${response.statusCode}`);
          response.on('error', function () {
            cb && cb();
          });
          response.on('end', function () {
            cb && cb();
          });
          response.on('data', function () {});
        });
        uploadRequest.on('error', function () {
          cb && cb();
        });
        uploadRequest.write(_incoming_obj);
        uploadRequest.end();
      });
    }

    before(function (done) {
      return client.makeBucket(versionedBucketName, '', function () {
        client.setBucketVersioning(versionedBucketName, {
          Status: "Enabled"
        }, function (err) {
          if (err && err.code === 'NotImplemented') return done();
          if (err) return done(err);
          isVersioningSupported = true;
          done();
        });
      });
    });
    after(function (done) {
      return client.removeBucket(versionedBucketName, done);
    });
    step(`presignedPutObject(bucketName, objectName, expires=1000, _incoming_obj,cb)_bucketName:${versionedBucketName} ${versionedPresignObjName} _version 1`, function (done) {
      if (isVersioningSupported) {
        putPreSignedObject(versionedBucketName, versionedPresignObjName, 1000, _100_byte, function () {
          done();
        });
      } else {
        done();
      }
    });
    step(`presignedPutObject(bucketName, objectName, expires=1000, _incoming_obj,cb)_bucketName:${versionedBucketName} ${versionedPresignObjName} _version 2`, function (done) {
      if (isVersioningSupported) {
        putPreSignedObject(versionedBucketName, versionedPresignObjName, 1000, _200_byte, function () {
          done();
        });
      } else {
        done();
      }
    });
    step(`listObjects(bucketName, objectName, expires=1000, _incoming_obj,cb)_bucketName:${versionedBucketName} ${versionedPresignObjName} _version 2`, function (done) {
      if (isVersioningSupported) {
        var objectsStream = client.listObjects(versionedBucketName, '', true, {
          IncludeVersion: true
        });
        objectsStream.on('data', function (obj) {
          objectsList.push({
            VersionId: obj.versionId,
            Key: obj.name
          });
        });
        objectsStream.on('error', function () {
          return done();
        });
        objectsStream.on('end', function () {
          if (objectsList.length === 2) {
            // 2 versions need to be listed.
            done();
          } else {
            return done(new Error("Version count does not match for versioned presigned url test."));
          }
        });
      } else {
        done();
      }
    });
    step(`presignedGetObject(bucketName, objectName, expires, respHeaders, requestDate, versionId, cb)_bucketName:${versionedBucketName} ${versionedPresignObjName} first version`, function (done) {
      if (isVersioningSupported) {
        client.presignedGetObject(versionedBucketName, versionedPresignObjName, 1000, {
          versionId: objectsList[1].VersionId
        }, new Date(), function (e, presignedUrl) {
          if (e) {
            return done();
          }

          var mobileClientReqWithProtocol = http;

          var getReqOpts = _.pick(url.parse(presignedUrl), ['hostname', 'port', 'path', 'protocol']);

          getReqOpts.method = 'GET';

          var _100kbmd5 = crypto.createHash('md5').update(_100_byte).digest('hex');

          var hash = crypto.createHash('md5');

          if (getReqOpts.protocol === 'https:') {
            mobileClientReqWithProtocol = https;
          }

          var request = mobileClientReqWithProtocol.request(getReqOpts, function (response) {
            //if delete marker. method not allowed.
            if (response.statusCode !== 200) return new Error(`error on get : ${response.statusCode}`);
            response.on('error', function () {
              return done();
            });
            response.on('end', function () {
              var hashValue = hash.digest('hex');

              if (hashValue === _100kbmd5) {
                done();
              } else {
                return done(new Error("Unable to retrieve version of an object using presignedGetObject"));
              }
            });
            response.on('data', function (data) {
              hash.update(data);
            });
          });
          request.on('error', function () {
            return done();
          });
          request.end();
        });
      } else {
        done();
      }
    });
    step(`removeObject(bucketName, objectName, removeOpts)_bucketName:${versionedBucketName} _${versionedPresignObjName} _${objectsList.length} versions`, function (done) {
      if (isVersioningSupported) {
        var count = 0;
        objectsList.forEach(function (objItem) {
          client.removeObject(versionedBucketName, objItem.Key, {
            versionId: objItem.VersionId
          }, function (e) {
            if (e) {
              done();
            }

            count += 1;

            if (count === 2) {
              //2 versions expected to be deleted.
              done();
            }
          });
        });
      } else {
        done();
      }
    });
  });
  describe('Object Lock API Bucket Options Test', function () {
    //Isolate the bucket/object for easy debugging and tracking.
    //Gateway mode does not support this header.
    describe('Object Lock support makeBucket API Tests', function () {
      var lockEnabledBucketName = "minio-js-test-lock-mb-" + uuid.v4();
      var isFeatureSupported = false;
      step(`Check if bucket with object lock can be created:_bucketName:${lockEnabledBucketName}`, function (done) {
        client.makeBucket(lockEnabledBucketName, {
          ObjectLocking: true
        }, function (err) {
          if (err && err.code === 'NotImplemented') return done();
          isFeatureSupported = true;
          if (err) return done(err);
          done();
        });
      });
      step(`Get lock config on a bucket:_bucketName:${lockEnabledBucketName}`, function (done) {
        if (isFeatureSupported) {
          client.getObjectLockConfig(lockEnabledBucketName, function (err) {
            if (err && err.code === 'NotImplemented') return done();
            if (err) return done(err);
            done();
          });
        } else {
          done();
        }
      });
      step(`Check if bucket can be deleted:_bucketName:${lockEnabledBucketName}`, function (done) {
        client.removeBucket(lockEnabledBucketName, function (err) {
          if (isFeatureSupported) {
            if (err && err.code === 'NotImplemented') return done();
            if (err) return done(err);
            done();
          } else {
            done();
          }
        });
      });
    });
    describe('Object Lock support Set/Get API Tests', function () {
      var lockConfigBucketName = "minio-js-test-lock-conf-" + uuid.v4();
      var isFeatureSupported = false;
      step(`Check if bucket with object lock can be created:_bucketName:${lockConfigBucketName}`, function (done) {
        client.makeBucket(lockConfigBucketName, {
          ObjectLocking: true
        }, function (err) {
          if (err && err.code === 'NotImplemented') return done();
          isFeatureSupported = true;
          if (err) return done(err);
          done();
        });
      });
      step(`Update or replace lock config on a bucket:_bucketName:${lockConfigBucketName}`, function (done) {
        if (isFeatureSupported) {
          client.setObjectLockConfig(lockConfigBucketName, {
            mode: "GOVERNANCE",
            unit: 'Years',
            validity: 2
          }, function (err) {
            if (err && err.code === 'NotImplemented') return done();
            if (err) return done(err);
            done();
          });
        } else {
          done();
        }
      });
      step(`Get lock config on a bucket:_bucketName:${lockConfigBucketName}`, function (done) {
        if (isFeatureSupported) {
          client.getObjectLockConfig(lockConfigBucketName, function (err) {
            if (err && err.code === 'NotImplemented') return done();
            if (err) return done(err);
            done();
          });
        } else {
          done();
        }
      });
      step(`Set lock config on a bucket:_bucketName:${lockConfigBucketName}`, function (done) {
        if (isFeatureSupported) {
          client.setObjectLockConfig(lockConfigBucketName, {}, function (err) {
            if (err && err.code === 'NotImplemented') return done();
            if (err) return done(err);
            done();
          });
        } else {
          done();
        }
      });
      step(`Get and verify lock config on a bucket after reset/update:_bucketName:${lockConfigBucketName}`, function (done) {
        if (isFeatureSupported) {
          client.getObjectLockConfig(lockConfigBucketName, function (err) {
            if (err && err.code === 'NotImplemented') return done();
            if (err) return done(err);
            done();
          });
        } else {
          done();
        }
      });
      step(`Check if bucket can be deleted:_bucketName:${lockConfigBucketName}`, function (done) {
        client.removeBucket(lockConfigBucketName, function (err) {
          if (isFeatureSupported) {
            if (err && err.code === 'NotImplemented') return done();
            if (err) return done(err);
            done();
          } else {
            done();
          }
        });
      });
    });
  });
  describe('Object retention API Tests', function () {
    //Isolate the bucket/object for easy debugging and tracking.
    //Gateway mode does not support this header.
    describe('Object retention get/set API Test', function () {
      var objRetentionBucket = "minio-js-test-retention-" + uuid.v4();
      var retentionObjName = "RetentionObject";
      var isFeatureSupported = false;
      var versionId = null;
      step(`Check if bucket with object lock can be created:_bucketName:${objRetentionBucket}`, function (done) {
        client.makeBucket(objRetentionBucket, {
          ObjectLocking: true
        }, function (err) {
          if (err && err.code === 'NotImplemented') return done();
          isFeatureSupported = true;
          if (err) return done(err);
          done();
        });
      });
      step(`putObject(bucketName, objectName, stream)_bucketName:${objRetentionBucket}, objectName:${retentionObjName}, stream:100Kib_`, function (done) {
        //Put two versions of the same object.
        if (isFeatureSupported) {
          client.putObject(objRetentionBucket, retentionObjName, readableStream(_1byte), _1byte.length, {}).then(function () {
            return done();
          }).catch(done);
        } else {
          done();
        }
      });
      step(`statObject(bucketName, objectName, statOpts)_bucketName:${objRetentionBucket}, objectName:${retentionObjName}`, function (done) {
        if (isFeatureSupported) {
          client.statObject(objRetentionBucket, retentionObjName, {}, function (e, res) {
            versionId = res.versionId;
            done();
          });
        } else {
          done();
        }
      });
      step(`putObjectRetention(bucketName, objectName, putOpts)_bucketName:${objRetentionBucket}, objectName:${retentionObjName}`, function (done) {
        //Put two versions of the same object.
        if (isFeatureSupported) {
          var expirationDate = new Date(); //set expiry to start of next day.

          expirationDate.setDate(expirationDate.getDate() + 1);
          expirationDate.setUTCHours(0, 0, 0, 0); //Should be start of the day.(midnight)

          client.putObjectRetention(objRetentionBucket, retentionObjName, {
            governanceBypass: true,
            mode: "GOVERNANCE",
            retainUntilDate: expirationDate.toISOString(),
            versionId: versionId
          }).then(function () {
            return done();
          }).catch(done);
        } else {
          done();
        }
      });
      step(`getObjectRetention(bucketName, objectName, getOpts)_bucketName:${objRetentionBucket}, objectName:${retentionObjName}`, function (done) {
        if (isFeatureSupported) {
          client.getObjectRetention(objRetentionBucket, retentionObjName, {
            versionId: versionId
          }, function () {
            done();
          });
        } else {
          done();
        }
      });
      step(`removeObject(bucketName, objectName, removeOpts)_bucketName:${objRetentionBucket}, objectName:${retentionObjName}`, function (done) {
        if (isFeatureSupported) {
          client.removeObject(objRetentionBucket, retentionObjName, {
            versionId: versionId,
            governanceBypass: true
          }, function () {
            done();
          });
        } else {
          done();
        }
      });
      step(`removeBucket(bucketName, )_bucketName:${objRetentionBucket}`, function (done) {
        if (isFeatureSupported) {
          client.removeBucket(objRetentionBucket, function () {
            done();
          });
        } else {
          done();
        }
      });
    });
  });
  describe('Bucket Encryption Related APIs', function () {
    //Isolate the bucket/object for easy debugging and tracking.
    //this is not supported in gateway mode.
    var encBucketName = "minio-js-test-bucket-enc-" + uuid.v4();
    before(function (done) {
      return client.makeBucket(encBucketName, '', done);
    });
    after(function (done) {
      return client.removeBucket(encBucketName, done);
    });
    var encObjName = 'datafile-to-encrypt-100-kB';
    var encObjFileContent = Buffer.alloc(100 * 1024, 0);
    var isEncryptionSupported = false;
    step(`Set Encryption on a bucket:_bucketName:${encBucketName}`, function (done) {
      // setBucketEncryption succeeds in NAS mode.
      var buckEncPromise = client.setBucketEncryption(encBucketName);
      buckEncPromise.then(function () {
        done();
      }).catch(function () {
        done();
      });
    });
    step(`Get encryption of a bucket:_bucketName:${encBucketName}`, function (done) {
      var getBucEncObj = client.getBucketEncryption(encBucketName);
      getBucEncObj.then(function () {
        done();
      }).catch(function (err) {
        if (err && err.code === 'NotImplemented') {
          isEncryptionSupported = false;
          return done();
        }

        if (err) return done(err);
        done();
      });
    });
    step(`Put an object to check for default encryption bucket:_bucketName:${encBucketName}, _objectName:${encObjName}`, function (done) {
      if (isEncryptionSupported) {
        var putObjPromise = client.putObject(encBucketName, encObjName, encObjFileContent);
        putObjPromise.then(function () {
          done();
        }).catch(function () {
          done();
        });
      } else {
        done();
      }
    });
    step(`Stat of an object to check for default encryption applied on a bucket:_bucketName:${encBucketName}, _objectName:${encObjName}`, function (done) {
      if (isEncryptionSupported) {
        var statObjPromise = client.statObject(encBucketName, encObjName);
        statObjPromise.then(function () {
          done();
        }).catch(function () {
          done();
        });
      } else {
        done();
      }
    });
    step(`Stat of an object to check for default encryption applied on a bucket:_bucketName:${encBucketName}`, function (done) {
      if (isEncryptionSupported) {
        var getBuckEnc = client.getBucketEncryption(encBucketName);
        getBuckEnc.then(function () {
          done();
        }).catch(function () {
          done();
        });
      } else {
        done();
      }
    });
    step(`Remove object on a bucket:_bucketName:${encBucketName}, _objectName:${encObjName}`, function (done) {
      if (isEncryptionSupported) {
        var removeObj = client.removeObject(encBucketName, encObjName);
        removeObj.then(function () {
          done();
        }).catch(function () {
          done();
        });
      } else {
        done();
      }
    });
    step(`Remove encryption on a bucket:_bucketName:${encBucketName}`, function (done) {
      if (isEncryptionSupported) {
        var removeObj = client.removeBucketEncryption(encBucketName);
        removeObj.then(function () {
          done();
        }).catch(function () {
          done();
        });
      } else {
        done();
      }
    });
    step(`Get encryption on a bucket:_bucketName:${encBucketName}`, function (done) {
      if (isEncryptionSupported) {
        var getBuckEnc = client.getBucketEncryption(encBucketName);
        getBuckEnc.then(function () {
          done();
        }).catch(function () {
          done();
        });
      } else {
        done();
      }
    });
  });
  describe('Bucket Replication API Tests', function () {//TODO - As of now, there is no api to get arn programmatically to setup replication through APIs and verify.
    //Please refer to minio server documentation and mc cli.
    //https://docs.min.io/docs/minio-bucket-replication-guide.html
    //https://docs.min.io/minio/baremetal/replication/replication-overview.html#minio-bucket-replication-clientside
  });
  describe('Object Legal hold API Tests', function () {
    //Isolate the bucket/object for easy debugging and tracking.
    //Gateway mode does not support this header.
    var versionId = null;
    describe('Object Legal hold get/set API Test', function () {
      var objLegalHoldBucketName = "minio-js-test-legalhold-" + uuid.v4();
      var objLegalHoldObjName = "LegalHoldObject";
      var isFeatureSupported = false;
      step(`Check if bucket with object lock can be created:_bucketName:${objLegalHoldBucketName}`, function (done) {
        client.makeBucket(objLegalHoldBucketName, {
          ObjectLocking: true
        }, function (err) {
          if (err && err.code === 'NotImplemented') return done();
          isFeatureSupported = true;
          if (err) return done(err);
          done();
        });
      });
      step(`putObject(bucketName, objectName, stream)_bucketName:${objLegalHoldBucketName}, objectName:${objLegalHoldObjName}, stream:100Kib_`, function (done) {
        if (isFeatureSupported) {
          client.putObject(objLegalHoldBucketName, objLegalHoldObjName, readableStream(_1byte), _1byte.length, {}).then(function () {
            return done();
          }).catch(done);
        } else {
          done();
        }
      });
      step(`statObject(bucketName, objectName, statOpts)_bucketName:${objLegalHoldBucketName}, objectName:${objLegalHoldObjName}`, function (done) {
        if (isFeatureSupported) {
          client.statObject(objLegalHoldBucketName, objLegalHoldObjName, {}, function (e, res) {
            versionId = res.versionId;
            done();
          });
        } else {
          done();
        }
      });
      step(`setObjectLegalHold(bucketName, objectName, setOpts={})_bucketName:${objLegalHoldBucketName}, objectName:${objLegalHoldObjName}`, function (done) {
        if (isFeatureSupported) {
          client.setObjectLegalHold(objLegalHoldBucketName, objLegalHoldObjName, function () {
            done();
          });
        } else {
          done();
        }
      });
      step(`setObjectLegalHold(bucketName, objectName, setOpts={})_bucketName:${objLegalHoldBucketName}, objectName:${objLegalHoldObjName}`, function (done) {
        if (isFeatureSupported) {
          client.setObjectLegalHold(objLegalHoldBucketName, objLegalHoldObjName, {
            status: "ON",
            versionId: versionId
          }, function () {
            done();
          });
        } else {
          done();
        }
      });
      step(`getObjectLegalHold(bucketName, objectName, setOpts={})_bucketName:${objLegalHoldBucketName}, objectName:${objLegalHoldObjName}`, function (done) {
        if (isFeatureSupported) {
          client.getObjectLegalHold(objLegalHoldBucketName, objLegalHoldObjName, function () {
            done();
          });
        } else {
          done();
        }
      });
      step(`setObjectLegalHold(bucketName, objectName, setOpts={})_bucketName:${objLegalHoldBucketName}, objectName:${objLegalHoldObjName}`, function (done) {
        if (isFeatureSupported) {
          client.setObjectLegalHold(objLegalHoldBucketName, objLegalHoldObjName, {
            status: "OFF",
            versionId: versionId
          }, function () {
            done();
          });
        } else {
          done();
        }
      });
      step(`getObjectLegalHold(bucketName, objectName, setOpts={})_bucketName:${objLegalHoldBucketName}, objectName:${objLegalHoldObjName}`, function (done) {
        if (isFeatureSupported) {
          client.getObjectLegalHold(objLegalHoldBucketName, objLegalHoldObjName, {
            versionId: versionId
          }, function () {
            done();
          });
        } else {
          done();
        }
      });
      step(`removeObject(bucketName, objectName, removeOpts)_bucketName:${objLegalHoldBucketName}, objectName:${objLegalHoldObjName}`, function (done) {
        if (isFeatureSupported) {
          client.removeObject(objLegalHoldBucketName, objLegalHoldObjName, {
            versionId: versionId,
            governanceBypass: true
          }, function () {
            done();
          });
        } else {
          done();
        }
      });
      step(`removeBucket(bucketName, )_bucketName:${objLegalHoldBucketName}`, function (done) {
        if (isFeatureSupported) {
          client.removeBucket(objLegalHoldBucketName, function () {
            done();
          });
        } else {
          done();
        }
      });
    });
  });
});
//# sourceMappingURL=functional-tests.js.map
