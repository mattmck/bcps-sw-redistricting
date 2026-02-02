(function() {
  'use strict';

  angular
    .module('redistricting')
    .constant('CONFIG', {
      MAPBOX_ACCESS_TOKEN: import.meta.env.VITE_MAPBOX_ACCESS_TOKEN
    });
})();
