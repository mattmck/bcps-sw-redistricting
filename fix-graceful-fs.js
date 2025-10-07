/**
 * Fix for graceful-fs compatibility with Node.js 16+
 * This patches the graceful-fs module to work with modern Node.js versions
 */

const fs = require('fs');
const gracefulFs = require('graceful-fs');

// Patch graceful-fs to fix primordials issue
if (!global.primordials) {
  try {
    const util = require('util');
    global.primordials = {
      Array: Array,
      ArrayIsArray: Array.isArray,
      ArrayPrototype: Array.prototype,
      ArrayPrototypeFilter: Array.prototype.filter,
      ArrayPrototypeForEach: Array.prototype.forEach,
      ArrayPrototypeIncludes: Array.prototype.includes,
      ArrayPrototypeIndexOf: Array.prototype.indexOf,
      ArrayPrototypeJoin: Array.prototype.join,
      ArrayPrototypeMap: Array.prototype.map,
      ArrayPrototypePop: Array.prototype.pop,
      ArrayPrototypePush: Array.prototype.push,
      ArrayPrototypeShift: Array.prototype.shift,
      ArrayPrototypeSlice: Array.prototype.slice,
      ArrayPrototypeSort: Array.prototype.sort,
      ArrayPrototypeSplice: Array.prototype.splice,
      ArrayPrototypeUnshift: Array.prototype.unshift,
      FunctionPrototypeCall: Function.prototype.call,
      JSONStringify: JSON.stringify,
      ObjectAssign: Object.assign,
      ObjectCreate: Object.create,
      ObjectDefineProperty: Object.defineProperty,
      ObjectGetOwnPropertyDescriptor: Object.getOwnPropertyDescriptor,
      ObjectGetOwnPropertyNames: Object.getOwnPropertyNames,
      ObjectGetPrototypeOf: Object.getPrototypeOf,
      ObjectHasOwnProperty: Object.prototype.hasOwnProperty,
      ObjectKeys: Object.keys,
      ObjectSetPrototypeOf: Object.setPrototypeOf,
      Promise: Promise,
      PromiseResolve: Promise.resolve,
      RegExpPrototypeTest: RegExp.prototype.test,
      SafeSet: Set,
      String: String,
      StringPrototypeSlice: String.prototype.slice,
      StringPrototypeToLowerCase: String.prototype.toLowerCase,
      Symbol: Symbol,
      SymbolFor: Symbol.for,
      SymbolIterator: Symbol.iterator,
      TypedArrayPrototypeSet: function(arr, offset) { this.set(arr, offset); },
      Uint8Array: Uint8Array,
    };
  } catch (e) {
    console.warn('Warning: Could not set up primordials compatibility layer:', e.message);
  }
}

// Re-export graceful-fs
module.exports = gracefulFs;