(function() {
  'use strict';

  angular
    .module('redistricting', ['ngAnimate', 'ngCookies', 'ngTouch', 'ngSanitize', 'ngResource', 'ui.router', 'ui.bootstrap', 'leaflet-directive', 'ngTable']);

})();

(function() {
  'use strict';

  angular
    .module('redistricting')
    .directive('acmeNavbar', acmeNavbar);

  /** @ngInject */
  function acmeNavbar() {
    var directive = {
      restrict: 'E',
      templateUrl: 'app/components/navbar/navbar.html',
      scope: {
          creationDate: '='
      },
      controller: NavbarController,
      controllerAs: 'vm',
      bindToController: true
    };

    NavbarController.$inject = ["moment"];
    return directive;

    /** @ngInject */
    function NavbarController(moment) {
      var vm = this;

      // "vm.creation" is avaible by directive option "bindToController: true"
      vm.relativeDate = moment(vm.creationDate).fromNow();
    }
  }

})();

(function() {
  'use strict';

  angular
      .module('redistricting')
      .service('webDevTec', webDevTec);

  /** @ngInject */
  function webDevTec() {
    var data = [
      {
        'title': 'AngularJS',
        'url': 'https://angularjs.org/',
        'description': 'HTML enhanced for web apps!',
        'logo': 'angular.png'
      },
      {
        'title': 'BrowserSync',
        'url': 'http://browsersync.io/',
        'description': 'Time-saving synchronised browser testing.',
        'logo': 'browsersync.png'
      },
      {
        'title': 'GulpJS',
        'url': 'http://gulpjs.com/',
        'description': 'The streaming build system.',
        'logo': 'gulp.png'
      },
      {
        'title': 'Jasmine',
        'url': 'http://jasmine.github.io/',
        'description': 'Behavior-Driven JavaScript.',
        'logo': 'jasmine.png'
      },
      {
        'title': 'Karma',
        'url': 'http://karma-runner.github.io/',
        'description': 'Spectacular Test Runner for JavaScript.',
        'logo': 'karma.png'
      },
      {
        'title': 'Protractor',
        'url': 'https://github.com/angular/protractor',
        'description': 'End to end test framework for AngularJS applications built on top of WebDriverJS.',
        'logo': 'protractor.png'
      },
      {
        'title': 'Bootstrap',
        'url': 'http://getbootstrap.com/',
        'description': 'Bootstrap is the most popular HTML, CSS, and JS framework for developing responsive, mobile first projects on the web.',
        'logo': 'bootstrap.png'
      },
      {
        'title': 'Angular UI Bootstrap',
        'url': 'http://angular-ui.github.io/bootstrap/',
        'description': 'Bootstrap components written in pure AngularJS by the AngularUI Team.',
        'logo': 'ui-bootstrap.png'
      },
      {
        'title': 'Sass (Node)',
        'url': 'https://github.com/sass/node-sass',
        'description': 'Node.js binding to libsass, the C version of the popular stylesheet preprocessor, Sass.',
        'logo': 'node-sass.png'
      },
      {
        'key': 'jade',
        'title': 'Jade',
        'url': 'http://jade-lang.com/',
        'description': 'Jade is a high performance template engine heavily influenced by Haml and implemented with JavaScript for node.',
        'logo': 'jade.png'
      }
    ];

    this.getTec = getTec;

    function getTec() {
      return data;
    }
  }

})();

(function() {
  'use strict';

  angular
    .module('redistricting')
    .directive('acmeMalarkey', acmeMalarkey);

  /** @ngInject */
  function acmeMalarkey(malarkey) {
    var directive = {
      restrict: 'E',
      scope: {
        extraValues: '=',
      },
      template: '&nbsp;',
      link: linkFunc,
      controller: MalarkeyController,
      controllerAs: 'vm'
    };

    MalarkeyController.$inject = ["$log", "githubContributor"];
    return directive;

    function linkFunc(scope, el, attr, vm) {
      var watcher;
      var typist = malarkey(el[0], {
        typeSpeed: 40,
        deleteSpeed: 40,
        pauseDelay: 800,
        loop: true,
        postfix: ' '
      });

      el.addClass('acme-malarkey');

      angular.forEach(scope.extraValues, function(value) {
        typist.type(value).pause().delete();
      });

      watcher = scope.$watch('vm.contributors', function() {
        angular.forEach(vm.contributors, function(contributor) {
          typist.type(contributor.login).pause().delete();
        });
      });

      scope.$on('$destroy', function () {
        watcher();
      });
    }

    /** @ngInject */
    function MalarkeyController($log, githubContributor) {
      var vm = this;

      vm.contributors = [];

      activate();

      function activate() {
        return getContributors().then(function() {
          $log.info('Activated Contributors View');
        });
      }

      function getContributors() {
        return githubContributor.getContributors(10).then(function(data) {
          vm.contributors = data;

          return vm.contributors;
        });
      }
    }

  }
  acmeMalarkey.$inject = ["malarkey"];

})();

(function() {
  'use strict';

  angular
    .module('redistricting')
    .factory('githubContributor', githubContributor);

  /** @ngInject */
  function githubContributor($log, $http) {
    var apiHost = 'https://api.github.com/repos/Swiip/generator-gulp-angular';

    var service = {
      apiHost: apiHost,
      getContributors: getContributors
    };

    return service;

    function getContributors(limit) {
      if (!limit) {
        limit = 30;
      }

      return $http.get(apiHost + '/contributors?per_page=' + limit)
        .then(getContributorsComplete)
        .catch(getContributorsFailed);

      function getContributorsComplete(response) {
        return response.data;
      }

      function getContributorsFailed(error) {
        $log.error('XHR Failed for getContributors.\n' + angular.toJson(error.data, true));
      }
    }
  }
  githubContributor.$inject = ["$log", "$http"];
})();

(function() {
  'use strict';

  angular
    .module('redistricting')
    .controller('MainController', MainController);

  /** @ngInject */
  function MainController($timeout, $scope, $resource, $log, webDevTec, toastr, leafletDirective, leafletData, NgTableParams) {
    var vm = this;

    $scope.Math = window.Math;
    vm.awesomeThings = [];
    vm.classAnimation = '';
    vm.creationDate = 1444319071498;
    vm.showToastr = showToastr;

    activate();

    $scope.defaults = {
        tileLayer: 'https://api.tiles.mapbox.com/v4/mapbox.light/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWF0dG1jayIsImEiOiJjaWZpaDlyejlibDB2c3htNzFnZG5pMGV2In0.v9hKZ_mdZB8WNJHE9FJGjg',
        maxZoom: 22,
        path: {
            weight: 10,
            color: '#800000',
            opacity: 1
        }
    };

    $scope.center = {
        lat: 39.286018,
        lng: -76.726257,
        zoom: 12
    };

    function activate() {
      getWebDevTec();
      $timeout(function() {
        vm.classAnimation = 'rubberBand';
      }, 4000);
    }

    $scope.colors = ['#4D4D4D','#5DA5DA','#FAA43A','#60BD68','#F17CB0','#B2912F','#B276B2','#DECF3F','#F15854'];
    $scope.currentColor = 0;

    L.Icon.Default.imagePath = 'assets/images';

    $scope.selectedSchool = null;
    $scope.selectedPlanningBlock = null;
    $scope.selectedSchoolName = "";
    $scope.schools = [];
    $scope.blocks = [];
    $scope.planningBlockLayers = {};
    $scope.schoolColors = {};
    $scope.onBlockFeature = function(feature, layer){
      $scope.planningBlockLayers[feature.properties.PBID] = layer;
      layer.on({click: function(e){
        $scope.selectedPlanningBlock = feature.properties;
        $log.info("planning block " + feature.properties.OBJECTID + " clicked");
        layer.setStyle({fillColor: $scope.selectedSchoolColor});
        if($scope.selectedSchool === null) {
          return;
        }

        $scope.selectedSchool.properties.planningBlocks.push($scope.selectedPlanningBlock.OBJECTID);

        Enumerable.from($scope.schools).forEach(function(school){
          if(school.OBJECTID != $scope.selectedSchool.properties.OBJECTID){
            school.planningBlocks = Enumerable.from(school.planningBlocks).where(function(block){
              return parseInt(block) != parseInt($scope.selectedPlanningBlock.PBID);
            }).toArray();
          }
        });
        $scope.tableParams.reload();
      }});
    };
    $scope.selectedSchoolColor = 'blue';
    $scope.onSchoolFeature = function(feature, layer){
      $scope.schoolColors[feature.properties.NAME] = layer.options.fillColor;
      layer.on({
        click: function(e){
          $scope.selectedSchool = feature;
          $scope.selectedSchoolColor = layer.options.fillColor;
          $log.info("school " + feature.properties.NAME + " clicked");
          $scope.selectedSchoolName = feature.properties.NAME;
        }});
    };
    $scope.schoolColors = {};
    $scope.planningBlockPolygons = [];

    //add all planning blocks
    $resource('assets/planningBlocks.geo.json').get().$promise.then(function(data){
      leafletData.getMap().then(function(map) {
            L.geoJson(data, {
              onEachFeature: $scope.onBlockFeature,
              style: {
                fillOpacity: 0.5
              }
            }).addTo(map);
      });
      $scope.planningBlocks = Enumerable.from(data.features).select(function(feature){
        return feature.properties;
      }).toArray();

      //add only elementary schools
      $resource('assets/schoolLocations.geo.json').get().$promise.then(function(data){
        data.features = Enumerable.from(data.features).where(function(feature){
          return feature.properties.TYPE === 'ES' && parseFloat(feature.geometry.coordinates[1]) < 39.313 && parseFloat(feature.geometry.coordinates[0]) < -76.6565 && feature.properties.NAME !== 'NewCatonsville ES';
        }).toArray();
        $scope.schools = Enumerable.from(data.features).select(function(feature){
          feature.properties.students = 0;
          feature.properties.planningBlocks = [];
          if(feature.properties.NAME === 'Edmonson Heights ES')
            feature.properties.NAME = 'Edmondson Heights ES';
          if(feature.properties.NAME === 'Old Catonsville ES')
            feature.properties.NAME = 'Catonsville ES';

            switch(feature.properties.NAME){
              case "Catonsville ES":
                feature.properties.SRC2016 = 715;
                break;
              case "Relay ES":
                feature.properties.SRC2017 = 689;
                break;
              case "Westchester ES":
                feature.properties.SRC2016 = 699;
                break;
              case "Westowne ES":
                feature.properties.SRC2016 = 650;
                break;
              default:
                break;
            }

          return feature.properties;
        }).toArray();
        leafletData.getMap().then(function(map) {
              L.geoJson(data, {
                onEachFeature: $scope.onSchoolFeature,
                pointToLayer: function (feature, latlng) {
                  $scope.currentColor++;
                  if($scope.currentColor >= $scope.colors.length-1){
                      $scope.currentColor = 0;
                  };
                  $scope.schoolColors[feature.properties.NAME] = $scope.colors[$scope.currentColor];
                  return L.circleMarker(latlng, {
                    radius: 10,
                    fillColor: $scope.colors[$scope.currentColor],
                    color: $scope.colors[$scope.currentColor],
                    weight: 1,
                    opacity: 1,
                    fillOpacity: 1
                  });
                }
              }).addTo(map);
        });
        $scope.tableParams = new NgTableParams({}, { getData: $scope.getTableData });
      });

    });

    $scope.option1 = {};
    $scope.option2 = {};
    $scope.option3 = {};
    $scope.current = {}

    $scope.getOption = function(field, object){
      $resource('assets/option1.geo.json').get().$promise.then(function(data){
        Enumerable.from(data.features).forEach(function(feature){
          if(object[feature.properties[field]] === undefined){
            object[feature.properties[field]] = [];
          }
          object[feature.properties[field]].push(feature.properties.PBID);
        });
      });
    }
    $scope.getOption('Opt1', $scope.option1);
    $scope.getOption('Opt2', $scope.option2);
    $scope.getOption('Opt3', $scope.option3);
    $scope.getOption('ES1516', $scope.current);

    $scope.loadOption = function(option){
      Enumerable.from($scope.schools).forEach(function(school){
        Enumerable.from(Object.keys(option)).forEach(function(schoolName){
          if(schoolName === school.NAME){
            school.planningBlocks = option[school.NAME];

            Enumerable.from(school.planningBlocks).forEach(function(planningBlock){
              $scope.planningBlockLayers[planningBlock].setStyle({fillColor: $scope.schoolColors[school.NAME]});
            });
          }
        });
      });
      $scope.tableParams.reload();
    };

    $scope.loadOption1 = function(){
      $scope.loadOption($scope.option1);
    };
    $scope.loadOption2 = function(){
      $scope.loadOption($scope.option2);
    };
    $scope.loadOption3 = function(){
      $scope.loadOption($scope.option3);
    };
    $scope.loadCurrent = function(){
      $scope.loadOption($scope.current);
    };

    $scope.getTableData = function getData($defer, params){
        $scope.schools = Enumerable.from($scope.schools).select(function(school){
          school.students = school.planningBlocks.length === 0 ? 0 : Enumerable.from(school.planningBlocks).sum(function(block){
            var block = Enumerable.from($scope.planningBlocks).firstOrDefault(function(planningBlock){
              return planningBlock.PBID === block;
            });
            if(block != null)
              return parseInt(block.K5LiveAtt);
            return 0;
          });

          switch(school.NAME){
            case "Arbutus ES":
              school.students += 22;
              break;
            case "Catonsville ES":
              school.students += 30;
              break;
            case "Edmondson Heights ES":
              school.students += 4;
              break;
            case "Halethorpe ES":
              school.students += 35;
              break;
            case "Hillcrest ES":
              school.students += 19;
              break;
            case "Johnnycake ES":
              school.students += 35;
              break;
            case "Lansdowne ES":
              school.students += 11;
              break;
            case "Relay ES":
              school.students += 60;
              break;
            case "Westchester ES":
              school.students += 13;
              break;
            case "Westowne ES":
              school.students += 40;
              break;
            case "Woodbridge ES":
              school.students += 41;
              break;
            default:
              break;
          }

          return school;
        }).toArray();
        $defer.resolve($scope.schools);
    };

    function showToastr() {
      toastr.info('Fork <a href="https://github.com/Swiip/generator-gulp-angular" target="_blank"><b>generator-gulp-angular</b></a>');
      vm.classAnimation = '';
    }

    function getWebDevTec() {
      vm.awesomeThings = webDevTec.getTec();

      angular.forEach(vm.awesomeThings, function(awesomeThing) {
        awesomeThing.rank = Math.random();
      });
    }
  }
  MainController.$inject = ["$timeout", "$scope", "$resource", "$log", "webDevTec", "toastr", "leafletDirective", "leafletData", "NgTableParams"];
})();


(function() {
  'use strict';

  angular
    .module('redistricting')
    .run(runBlock);

  /** @ngInject */
  function runBlock($log) {

    $log.debug('runBlock end');
  }
  runBlock.$inject = ["$log"];

})();

(function() {
  'use strict';

  angular
    .module('redistricting')
    .config(routeConfig);

  /** @ngInject */
  function routeConfig($stateProvider, $urlRouterProvider) {
    $stateProvider
      .state('home', {
        url: '/',
        templateUrl: 'app/main/main.html',
        controller: 'MainController',
        controllerAs: 'main'
      });

    $urlRouterProvider.otherwise('/');
  }
  routeConfig.$inject = ["$stateProvider", "$urlRouterProvider"];

})();

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

(function() {
  'use strict';

  angular
    .module('redistricting')
    .config(config);

  /** @ngInject */
  function config($logProvider, toastr) {
    // Enable log
    $logProvider.debugEnabled(true);

    // Set options third-party lib
    toastr.options.timeOut = 3000;
    toastr.options.positionClass = 'toast-top-right';
    toastr.options.preventDuplicates = true;
    toastr.options.progressBar = true;
  }
  config.$inject = ["$logProvider", "toastr"];

})();

angular.module("redistricting").run(["$templateCache", function($templateCache) {$templateCache.put("app/main/main.html","<div class=\"container-fluid\"><div class=\"row\"><div class=\"col-md-6\"><leaflet defaults=\"defaults\" lf-center=\"center\" width=\"100%\" height=\"600px\"></leaflet></div><div class=\"row\"><div class=\"col-md-6\"><div class=\"row\"><form class=\"form-inline\"><div class=\"form-group\"><button ng-click=\"loadCurrent()\" class=\"btn btn-primary\">Current</button> <button ng-click=\"loadOption1()\" class=\"btn btn-primary\">Option 1</button> <button ng-click=\"loadOption2()\" class=\"btn btn-primary\">Option 2</button> <button ng-click=\"loadOption3()\" class=\"btn btn-primary\">Option 3</button></div></form></div></div><div class=\"col-md-6\"><div class=\"row\"><table ng-table=\"tableParams\" class=\"table table-condensed table-bordered\"><tr ng-repeat=\"school in $data\" ng-class=\"{\'selected-row\':selectedSchoolName === school.NAME}\"><td title=\"\'Color\'\"><div style=\"height:20px; width:20px; background:{{schoolColors[school.NAME]}}; display:table\"><div></div></div></td><td title=\"\'School\'\" sortable=\"\'NAME\'\">{{school.NAME}}</td><td title=\"\'2015 Cap.\'\" sortable=\"\'school.SRC\'\">{{school.SRC}}</td><td title=\"\'2016 Cap.\'\" sortable=\"\'school.SRC2016 !== undefined ? school.SRC2016 : school.SRC\'\">{{school.SRC2016 !== undefined ? school.SRC2016 : school.SRC}}</td><td title=\"\'2017 Cap.\'\" sortable=\"\'school.SRC2017 !== undefined ? school.SRC2017 : school.SRC2016 !== undefined ? school.SRC2016 : school.SRC\'\">{{school.SRC2017 !== undefined ? school.SRC2017 : school.SRC2016 !== undefined ? school.SRC2016 : school.SRC}}</td><td title=\"\'2015 %\'\" sortable=\"\'school.SRC\'\"><em ng-class=\"{\'text-danger\':school.students / school.SRC > 1}\">{{Math.round(school.students / school.SRC * 100)}}%</em></td><td title=\"\'2016 %.\'\" sortable=\"\'school.SRC2016 !== undefined ? school.SRC2016 : school.SRC\'\"><em ng-class=\"{\'text-danger\':school.students / (school.SRC2016 !== undefined ? school.SRC2016 : school.SRC) > 1}\">{{Math.round(school.students / (school.SRC2016 !== undefined ? school.SRC2016 : school.SRC)*100)}}%</em></td><td title=\"\'2017 %\'\" sortable=\"\'school.SRC2017 !== undefined ? school.SRC2017 : school.SRC2016 !== undefined ? school.SRC2016 : school.SRC\'\"><em ng-class=\"{\'text-danger\':school.students / (school.SRC2017 !== undefined ? school.SRC2017 : school.SRC2016 !== undefined ? school.SRC2016 : school.SRC) > 1}\">{{Math.round(school.students / (school.SRC2017 !== undefined ? school.SRC2017 : school.SRC2016 !== undefined ? school.SRC2016 : school.SRC)*100)}}%</em></td><td title=\"\'Students\'\" sortable=\"\'school.students\'\">{{school.students}}</td></tr></table></div></div></div></div></div>");
$templateCache.put("app/components/navbar/navbar.html","<nav class=\"navbar navbar-static-top navbar-inverse\"><div class=\"container-fluid\"><div class=\"navbar-header\"><a class=\"navbar-brand\" href=\"https://github.com/Swiip/generator-gulp-angular\"><span class=\"glyphicon glyphicon-home\"></span> Gulp Angular</a></div><div class=\"collapse navbar-collapse\" id=\"bs-example-navbar-collapse-6\"><ul class=\"nav navbar-nav\"><li class=\"active\"><a ng-href=\"#\">Home</a></li><li><a ng-href=\"#\">About</a></li><li><a ng-href=\"#\">Contact</a></li></ul><ul class=\"nav navbar-nav navbar-right acme-navbar-text\"><li>Application was created {{ vm.relativeDate }}.</li></ul></div></div></nav>");}]);