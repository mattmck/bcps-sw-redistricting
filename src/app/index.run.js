(function() {
  'use strict';

  angular
    .module('redistricting')
    .run(runBlock);

  /** @ngInject */
  function runBlock($log) {

    $log.debug('runBlock end');
  }

})();
