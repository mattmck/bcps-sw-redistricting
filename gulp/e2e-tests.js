'use strict';

var gulp = require('gulp');

// Note: gulp-protractor is deprecated, these tasks are stubs for compatibility
function webdriverUpdate(done) {
  console.log('webdriver-update: gulp-protractor is deprecated, use protractor directly');
  done();
}

function webdriverStandalone(done) {
  console.log('webdriver-standalone: gulp-protractor is deprecated, use protractor directly');
  done();
}

function runProtractor (done) {
  console.log('protractor: gulp-protractor is deprecated, use protractor directly');
  done();
}

const protractorSrc = gulp.series(
  require('./server')['serve:e2e'],
  webdriverUpdate,
  runProtractor
);

const protractorDist = gulp.series(
  require('./server')['serve:e2e-dist'],
  webdriverUpdate,
  runProtractor
);

exports['webdriver-update'] = webdriverUpdate;
exports['webdriver-standalone'] = webdriverStandalone;
exports['protractor'] = protractorSrc;
exports['protractor:src'] = protractorSrc;
exports['protractor:dist'] = protractorDist;
