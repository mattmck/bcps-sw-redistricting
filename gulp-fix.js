#!/usr/bin/env node

/**
 * Gulp wrapper script to fix compatibility issues with modern Node.js
 */

// Load the graceful-fs fix first
require('./fix-graceful-fs');

// Override require for graceful-fs to use our patched version
const Module = require('module');
const originalRequire = Module.prototype.require;

Module.prototype.require = function(id) {
  if (id === 'graceful-fs') {
    return require('./fix-graceful-fs');
  }
  return originalRequire.apply(this, arguments);
};

// Now run gulp
require('./node_modules/.bin/gulp');