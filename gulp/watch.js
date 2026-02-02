'use strict';

var path = require('path');
var gulp = require('gulp');
var conf = require('./conf');

var browserSync = require('browser-sync');

function isOnlyChange(event) {
  return event.type === 'changed';
}

const markups = require('./markups').markups;
const inject = require('./inject').inject;
const scripts = require('./scripts').scripts;
const styles = require('./styles').styles;

function watch() {
  gulp.watch([path.join(conf.paths.src, '/*.html'), 'bower.json'], inject);

  gulp.watch([
    path.join(conf.paths.src, '/app/**/*.css'),
    path.join(conf.paths.src, '/app/**/*.scss')
  ], styles);

  gulp.watch(path.join(conf.paths.src, '/app/**/*.js'), scripts);

  gulp.watch(path.join(conf.paths.src, '/app/**/*.jade'), markups);

  gulp.watch(path.join(conf.paths.src, '/app/**/*.html'), function(event) {
    browserSync.reload(event.path);
  });
}

exports.watch = gulp.series(markups, inject, watch);
