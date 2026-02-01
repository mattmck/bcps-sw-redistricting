'use strict';

var path = require('path');
var gulp = require('gulp');
var conf = require('./conf');
var gulpFilter = require('gulp-filter').default || require('gulp-filter');
var rev = (require('gulp-rev').default || require('gulp-rev'));
var revReplace = (require('gulp-rev-replace').default || require('gulp-rev-replace'));
var ngAnnotate = (require('gulp-ng-annotate').default || require('gulp-ng-annotate'));
var csso = (require('gulp-csso').default || require('gulp-csso'));
var minifyHtml = require('gulp-minify-html');
var angularTemplatecache = require('gulp-angular-templatecache');
var size = (require('gulp-size').default || require('gulp-size'));

var $ = require('gulp-load-plugins')({
  pattern: ['gulp-*', 'main-bower-files', 'uglify-save-license', 'del']
});

function partials() {
  return gulp.src([
    path.join(conf.paths.src, '/app/**/*.html'),
    path.join(conf.paths.tmp, '/serve/app/**/*.html')
  ])
    .pipe(minifyHtml({
      empty: true,
      spare: true,
      quotes: true
    }))
    .pipe(angularTemplatecache('templateCacheHtml.js', {
      module: 'redistricting',
      root: 'app'
    }))
    .pipe(gulp.dest(conf.paths.tmp + '/partials/'));
}

function html() {
  var partialsInjectFile = gulp.src(path.join(conf.paths.tmp, '/partials/templateCacheHtml.js'), { read: false });
  var partialsInjectOptions = {
    starttag: '<!-- inject:partials -->',
    ignorePath: path.join(conf.paths.tmp, '/partials'),
    addRootSlash: false
  };

  var htmlFilter = gulpFilter('*.html', { restore: true });
  var jsFilter = gulpFilter('**/*.js', { restore: true });
  var cssFilter = gulpFilter('**/*.css', { restore: true });

  return gulp.src(path.join(conf.paths.tmp, '/serve/*.html'))
    .pipe($.inject(partialsInjectFile, partialsInjectOptions))
    .pipe($.useref())
    .pipe(rev())
    .pipe(jsFilter)
    .pipe(ngAnnotate())
    //.pipe($.uglify({ preserveComments: $.uglifySaveLicense })).on('error', conf.errorHandler('Uglify'))
    .pipe(jsFilter.restore)
    .pipe(cssFilter)
    .pipe($.replace('../../bower_components/bootstrap-sass-official/assets/fonts/bootstrap/', '../fonts/'))
    .pipe(csso())
    .pipe(cssFilter.restore)
    .pipe(revReplace())
    .pipe(htmlFilter)
    .pipe(minifyHtml({
      empty: true,
      spare: true,
      quotes: true,
      conditionals: true
    }))
    .pipe(htmlFilter.restore)
    .pipe(gulp.dest(path.join(conf.paths.dist, '/')))
    .pipe(size({ title: path.join(conf.paths.dist, '/'), showFiles: true }));
}

// Only applies for fonts from bower dependencies
// Custom fonts are handled by the "other" task
function fonts() {
  return gulp.src($.mainBowerFiles())
    .pipe(gulpFilter('**/*.{eot,svg,ttf,woff,woff2}'))
    .pipe($.flatten())
    .pipe(gulp.dest(path.join(conf.paths.dist, '/fonts/')));
}

function other() {
  var fileFilter = gulpFilter(function (file) {
    return file.stat.isFile();
  });

  return gulp.src([
    path.join(conf.paths.src, '/**/*'),
    path.join('!' + conf.paths.src, '/**/*.{html,css,js,scss,jade}')
  ])
    .pipe(fileFilter)
    .pipe(gulp.dest(path.join(conf.paths.dist, '/')));
}

function clean() {
  return $.del([path.join(conf.paths.dist, '/'), path.join(conf.paths.tmp, '/')]);
}

const htmlTask = gulp.series(require('./inject').inject, partials, html);
const build = gulp.series(gulp.parallel(htmlTask, fonts, other));

exports.partials = gulp.series(require('./markups').markups, partials);
exports.html = htmlTask;
exports.fonts = fonts;
exports.other = other;
exports.clean = clean;
exports.build = build;
