/* global malarkey:false, toastr:false, moment:false, L:true */
(function() {
  'use strict';

  angular
    .module('redistricting')
    .constant('malarkey', malarkey)
    .constant('toastr', toastr)
    .constant('moment', moment)
    .constant('L', L);

})();
