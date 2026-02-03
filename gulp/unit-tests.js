'use strict';

var path = require('path');
var gulp = require('gulp');

var karma = require('karma');

function runTests (singleRun, done) {
  const server = new karma.Server({
    configFile: path.join(__dirname, '/../karma.conf.js'),
    singleRun: singleRun,
    autoWatch: !singleRun
  }, function() {
    done();
  });
  server.start();
}

function test(done) {
  runTests(true, done);
}

function testAuto(done) {
  runTests(false, done);
}

exports.test = gulp.series(require('./scripts').scripts, test);
exports['test:auto'] = gulp.series(require('./watch').watch, testAuto);
