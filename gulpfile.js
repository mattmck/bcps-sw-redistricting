/**
 *  Welcome to your gulpfile!
 *  The gulp tasks are splitted in several files in the gulp directory
 *  because putting all here was really too long
 */

'use strict';

const gulp = require('gulp');
const wrench = require('wrench');
const connect = require('gulp-connect');

/**
 *  This will load all js or coffee files in the gulp directory
 *  in order to load all gulp tasks
 */
const modules = wrench.readdirSyncRecursive('./gulp').filter(function(file) {
  return (/\.(js|coffee)$/i).test(file);
}).map(function(file) {
  return require('./gulp/' + file);
});

// Re-export all tasks from modules
modules.forEach(function(module) {
  if (module && typeof module === 'object') {
    Object.keys(module).forEach(function(key) {
      exports[key] = module[key];
    });
  }
});

function webserver(cb) {
  connect.server({
    livereload: true,
    root: ['dist']
  });
  cb();
}

/**
 *  Default task clean temporaries directories and launch the
 *  main optimization build task
 */
const defaultTask = gulp.series(
  require('./gulp/build').clean,
  require('./gulp/build').build
);

exports.webserver = webserver;
exports.default = defaultTask;
