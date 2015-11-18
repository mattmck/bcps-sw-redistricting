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
  function MainController($timeout, $scope, $resource, $log, $anchorScroll, $location, webDevTec, toastr, leafletDirective, leafletData, NgTableParams) {
    var vm = this;

    $scope.Math = window.Math;
    vm.awesomeThings = [];
    vm.classAnimation = '';
    vm.creationDate = 1444319071498;
    vm.showToastr = showToastr;

    activate();

    $scope.defaults = {
        tileLayer: 'https://api.tiles.mapbox.com/v4/mapbox.streets/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWF0dG1jayIsImEiOiJjaWZpaDlyejlibDB2c3htNzFnZG5pMGV2In0.v9hKZ_mdZB8WNJHE9FJGjg',
        maxZoom: 22,
        path: {
            weight: 10,
            color: '#800000',
            opacity: 1
        }
    };

    $scope.center = {
        lat: 39.271697,
        lng: -76.730514,
        zoom: 12
    };

    function activate() {
      getWebDevTec();
      $timeout(function() {
        vm.classAnimation = 'rubberBand';
      }, 4000);
    }

    $scope.distance = function(lat1, lon1, lat2, lon2, unit) {
    	var radlat1 = Math.PI * lat1/180
    	var radlat2 = Math.PI * lat2/180
    	var radlon1 = Math.PI * lon1/180
    	var radlon2 = Math.PI * lon2/180
    	var theta = lon1-lon2
    	var radtheta = Math.PI * theta/180
    	var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    	dist = Math.acos(dist)
    	dist = dist * 180/Math.PI
    	dist = dist * 60 * 1.1515
    	if (unit=="K") { dist = dist * 1.609344 }
    	if (unit=="N") { dist = dist * 0.8684 }
    	return dist
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
      layer.bindLabel('Planning Block: '+feature.properties.PBID);
      layer.on({click: function(e){
        $scope.selectedPlanningBlock = feature.properties;
        $log.info("planning block " + feature.properties.OBJECTID + " clicked");
        layer.setStyle({fillColor: $scope.selectedSchoolColor});
        if($scope.selectedSchool === null) {
          return;
        }

        $scope.selectedSchool.properties.planningBlocks.push($scope.selectedPlanningBlock.PBID);

        Enumerable.from($scope.schools).forEach(function(school){
          if(school.OBJECTID !== $scope.selectedSchool.properties.OBJECTID){
            school.planningBlocks = Enumerable.from(school.planningBlocks).where(function(block){
              return parseInt(block) != parseInt($scope.selectedPlanningBlock.PBID);
            }).toArray();
          }
        });
        $scope.tableParams.reload();
      }});
    };

    $scope.hideSnapshot = true;
    $scope.snapshotInProgress = false;
    $scope.selectedSchoolColor = 'blue';
    $scope.onSchoolFeature = function(feature, layer){
      $scope.schoolColors[feature.properties.NAME] = layer.options.fillColor;
      layer.bindLabel(feature.properties.NAME);
      layer.on({
        click: function(e){
          $scope.selectedSchool = feature;
          $scope.selectedSchoolColor = layer.options.fillColor;
          $log.info("school " + feature.properties.NAME + " clicked");
          $scope.selectedSchoolName = feature.properties.NAME;
        }});
        $resource('assets/'+feature.properties.NAME.replace(' ','_')+'.walking.geo.json').get().$promise.then(function(data){
          leafletData.getMap().then(function(map) {
                L.geoJson(data, {
                  style: {
                    color: $scope.shadeBlendConvert(-0.5, layer.options.fillColor)
                  }
                }).addTo(map);
          });
        });
    };
    $scope.schoolColors = {};
    $scope.planningBlockPolygons = [];

    $scope.shadeBlendConvert = function(p, from, to) {
      if(typeof(p)!="number"||p<-1||p>1||typeof(from)!="string"||(from[0]!='r'&&from[0]!='#')||(typeof(to)!="string"&&typeof(to)!="undefined"))return null; //ErrorCheck
      if(!$scope.sbcRip)$scope.sbcRip=function(d){
          var l=d.length,RGB=new Object();
          if(l>9){
              d=d.split(",");
              if(d.length<3||d.length>4)return null;//ErrorCheck
              RGB[0]=i(d[0].slice(4)),RGB[1]=i(d[1]),RGB[2]=i(d[2]),RGB[3]=d[3]?parseFloat(d[3]):-1;
          }else{
              switch(l){case 8:case 6:case 3:case 2:case 1:return null;} //ErrorCheck
              if(l<6)d="#"+d[1]+d[1]+d[2]+d[2]+d[3]+d[3]+(l>4?d[4]+""+d[4]:""); //3 digit
              d=i(d.slice(1),16),RGB[0]=d>>16&255,RGB[1]=d>>8&255,RGB[2]=d&255,RGB[3]=l==9||l==5?r(((d>>24&255)/255)*10000)/10000:-1;
          }
          return RGB;}
      var i=parseInt,r=Math.round,h=from.length>9,h=typeof(to)=="string"?to.length>9?true:to=="c"?!h:false:h,b=p<0,p=b?p*-1:p,to=to&&to!="c"?to:b?"#000000":"#FFFFFF",f=$scope.sbcRip(from),t=$scope.sbcRip(to);
      if(!f||!t)return null; //ErrorCheck
      if(h)return "rgb("+r((t[0]-f[0])*p+f[0])+","+r((t[1]-f[1])*p+f[1])+","+r((t[2]-f[2])*p+f[2])+(f[3]<0&&t[3]<0?")":","+(f[3]>-1&&t[3]>-1?r(((t[3]-f[3])*p+f[3])*10000)/10000:t[3]<0?f[3]:t[3])+")");
      else return "#"+(0x100000000+(f[3]>-1&&t[3]>-1?r(((t[3]-f[3])*p+f[3])*255):t[3]>-1?r(t[3]*255):f[3]>-1?r(f[3]*255):255)*0x1000000+r((t[0]-f[0])*p+f[0])*0x10000+r((t[1]-f[1])*p+f[1])*0x100+r((t[2]-f[2])*p+f[2])).toString(16).slice(f[3]>-1||t[3]>-1?1:3);
  };

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
      $scope.rawPlanningBlocks = data.features;

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

        $scope.tableParams = new NgTableParams({}, { getData: $scope.getTableData, counts: [] });
      });
    });

    $scope.current = {};
// 09-30 options
    $scope.option1 = {};
    $scope.option2 = {};
    $scope.option3 = {};
    $scope.get0930Option = function(field, object){
      $resource('assets/150930.geo.json').get().$promise.then(function(data){
        Enumerable.from(data.features).forEach(function(feature){
          if(object[feature.properties[field]] === undefined){
            object[feature.properties[field]] = [];
          }
          object[feature.properties[field]].push(feature.properties.PBID);
        });
      });
    }
    //$scope.get0930Option('ES1516', $scope.current);
    $scope.get0930Option('Opt1', $scope.option1);
    $scope.get0930Option('Opt2', $scope.option2);
    $scope.get0930Option('Opt3', $scope.option3);

// 10-14 options
    $scope.optionA = {};
    $scope.optionB = {};
    $scope.optionC = {};
    $scope.optionD = {};
    $scope.optionE = {};
    $scope.get1014Option = function(field, object){
      $resource('assets/151014.geo.json').get().$promise.then(function(data){
        Enumerable.from(data.features).forEach(function(feature){
          if(object[feature.properties[field]] === undefined){
            object[feature.properties[field]] = [];
          }
          object[feature.properties[field]].push(feature.properties.PBID);
        });
      });
    }
    //$scope.get1014Option('ES1516', $scope.current);
    $scope.get1014Option('OptA', $scope.optionA);
    $scope.get1014Option('OptB', $scope.optionB);
    $scope.get1014Option('OptC', $scope.optionC);
    $scope.get1014Option('OptD', $scope.optionD);
    $scope.get1014Option('OptE', $scope.optionE);

// 10-21 options
    $scope.optionA1021 = {};
    $scope.optionB1021 = {};
    $scope.optionC1021 = {};
    $scope.optionD1021 = {};
    $scope.optionE1021 = {};
    $scope.optionF1021 = {};
    $scope.optionG1021 = {};
    $scope.get1021Option = function(field, object){
      $resource('assets/151021.geo.json').get().$promise.then(function(data){
        Enumerable.from(data.features).forEach(function(feature){
          if(object[feature.properties[field]] === undefined){
            object[feature.properties[field]] = [];
          }
          object[feature.properties[field]].push(feature.properties.PBID);
        });
      });
    }
    //$scope.get1021Option('ES1516', $scope.current);
    $scope.get1021Option('OptA', $scope.optionA1021);
    $scope.get1021Option('OptB', $scope.optionB1021);
    $scope.get1021Option('OptC', $scope.optionC1021);
    $scope.get1021Option('OptD', $scope.optionD1021);
    $scope.get1021Option('OptE', $scope.optionE1021);
    $scope.get1021Option('OptF', $scope.optionF1021);
    $scope.get1021Option('OptG', $scope.optionG1021);

// 11-11 options
    $scope.optionA1111 = {};
    $scope.optionB1111 = {};
    $scope.optionC1111 = {};
    $scope.optionD1111 = {};
    $scope.optionE1111 = {};
    $scope.optionF1111 = {};
    $scope.optionG1111 = {};
    $scope.optionH1111 = {};
    $scope.optionI1111 = {};
    $scope.optionJ1111 = {};
    $scope.optionK1111 = {};
    $scope.optionL1111 = {};
    $scope.get1111Option = function(field, object){
      $resource('assets/151111.geo.json').get().$promise.then(function(data){
        Enumerable.from(data.features).forEach(function(feature){
          if(object[feature.properties[field]] === undefined){
            object[feature.properties[field]] = [];
          }
          object[feature.properties[field]].push(feature.properties.PBID);
        });
      });
    }
    //$scope.get1111Option('ES1516', $scope.current);
    $scope.get1111Option('OptA', $scope.optionA1111);
    $scope.get1111Option('OptB', $scope.optionB1111);
    $scope.get1111Option('OptC', $scope.optionC1111);
    $scope.get1111Option('OptD', $scope.optionD1111);
    $scope.get1111Option('OptE', $scope.optionE1111);
    $scope.get1111Option('OptF', $scope.optionF1111);
    $scope.get1111Option('OptG', $scope.optionG1111);
    $scope.get1111Option('OptH', $scope.optionH1111);
    $scope.get1111Option('OptI', $scope.optionI1111);
    $scope.get1111Option('OptJ', $scope.optionJ1111);
    $scope.get1111Option('OptK', $scope.optionK1111);
    $scope.get1111Option('OptL', $scope.optionL1111);

// 11-18 options
    $scope.option11118 = {};
    $scope.option21118 = {};
    $scope.option31118 = {};
    $scope.option41118 = {};
    $scope.get1118Option = function(field, object){
      $resource('assets/151118.geo.json').get().$promise.then(function(data){
        Enumerable.from(data.features).forEach(function(feature){
          if(object[feature.properties[field]] === undefined){
            object[feature.properties[field]] = [];
          }
          object[feature.properties[field]].push(feature.properties.PBID);
        });
      });
    }
    $scope.get1118Option('ES1516', $scope.current);
    $scope.get1118Option('NovOpt1', $scope.option11118);
    $scope.get1118Option('NovOpt2', $scope.option21118);
    $scope.get1118Option('NovOpt3', $scope.option31118);
    $scope.get1118Option('NovOpt4', $scope.option41118);

    $scope.loadOption = function(option){
      Enumerable.from($scope.schools).forEach(function(school){
        Enumerable.from(Object.keys(option)).forEach(function(schoolName){
          if(schoolName === school.NAME){
            school.planningBlocks = option[school.NAME];

            Enumerable.from(school.planningBlocks).forEach(function(planningBlock){
              if($scope.planningBlockLayers[planningBlock] !== undefined)
                $scope.planningBlockLayers[planningBlock].setStyle({fillColor: $scope.schoolColors[school.NAME]});
            });
          }
        });
      });
      $scope.tableParams.reload();
    };

    $scope.takeSnapshot = function(){
      $scope.snapshotInProgress = true;
      leafletData.getMap().then(function(map){
        leafletImage(map, function(err, canvas) {
          var img = document.createElement('img');
          var dimensions = map.getSize();
          img.width = dimensions.x;
          img.height = dimensions.y;
          img.src = canvas.toDataURL();
          $scope.imageUrl = img.src;
          document.getElementById('snapshot').innerHTML = '';
          document.getElementById('snapshot').appendChild(img);
          $scope.hideSnapshot = false;
          $scope.snapshotInProgress = false;
          $location.hash('snapshot');
          $anchorScroll();
        });
      });
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

    $scope.loadOptionA = function(){
      $scope.loadOption($scope.optionA);
    };
    $scope.loadOptionB = function(){
      $scope.loadOption($scope.optionB);
    };
    $scope.loadOptionC = function(){
      $scope.loadOption($scope.optionC);
    };
    $scope.loadOptionD = function(){
      $scope.loadOption($scope.optionD);
    };
    $scope.loadOptionE = function(){
      $scope.loadOption($scope.optionE);
    };

    $scope.loadOptionA1021 = function(){
      $scope.loadOption($scope.optionA1021);
    };
    $scope.loadOptionB1021 = function(){
      $scope.loadOption($scope.optionB1021);
    };
    $scope.loadOptionC1021 = function(){
      $scope.loadOption($scope.optionC1021);
    };
    $scope.loadOptionD1021 = function(){
      $scope.loadOption($scope.optionD1021);
    };
    $scope.loadOptionE1021 = function(){
      $scope.loadOption($scope.optionE1021);
    };
    $scope.loadOptionF1021 = function(){
      $scope.loadOption($scope.optionF1021);
    };
    $scope.loadOptionG1021 = function(){
      $scope.loadOption($scope.optionG1021);
    };

    $scope.loadOptionA1111 = function(){
      $scope.loadOption($scope.optionA1111);
    };
    $scope.loadOptionB1111 = function(){
      $scope.loadOption($scope.optionB1111);
    };
    $scope.loadOptionC1111 = function(){
      $scope.loadOption($scope.optionC1111);
    };
    $scope.loadOptionD1111 = function(){
      $scope.loadOption($scope.optionD1111);
    };
    $scope.loadOptionE1111 = function(){
      $scope.loadOption($scope.optionE1111);
    };
    $scope.loadOptionF1111 = function(){
      $scope.loadOption($scope.optionF1111);
    };
    $scope.loadOptionG1111 = function(){
      $scope.loadOption($scope.optionG1111);
    };
    $scope.loadOptionH1111 = function(){
      $scope.loadOption($scope.optionH1111);
    };
    $scope.loadOptionI1111 = function(){
      $scope.loadOption($scope.optionI1111);
    };
    $scope.loadOptionJ1111 = function(){
      $scope.loadOption($scope.optionJ1111);
    };
    $scope.loadOptionK1111 = function(){
      $scope.loadOption($scope.optionK1111);
    };
    $scope.loadOptionL1111 = function(){
      $scope.loadOption($scope.optionL1111);
    };

    $scope.loadOption11118 = function(){
      $scope.loadOption($scope.option11118);
    };
    $scope.loadOption21118 = function(){
      $scope.loadOption($scope.option21118);
    };
    $scope.loadOption31118 = function(){
      $scope.loadOption($scope.option31118);
    };
    $scope.loadOption41118 = function(){
      $scope.loadOption($scope.option41118);
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
              school.students += 17 + 11 + 0;
              break;
            case "Catonsville ES":
              school.students += 29 + 21 + 1;
              break;
            case "Edmondson Heights ES":
              school.students += 5 + 43 + 27;
              break;
            case "Halethorpe ES":
              school.students += 37 + 30 + 0;
              break;
            case "Hillcrest ES":
              school.students += 14 + 0 + 0;
              break;
            case "Johnnycake ES":
              school.students += 38 + 29 + 13;
              break;
            case "Lansdowne ES":
              school.students += 12 + 27 + 0;
              break;
            case "Relay ES":
              school.students += 45 + 0 + 1;
              break;
            case "Westchester ES":
              school.students += 11 + 11 + 0;
              break;
            case "Westowne ES":
              school.students += 30 + 39 + 0;
              break;
            case "Woodbridge ES":
              school.students += 28 + 21 + 1;
              break;
            default:
              break;
          }

          return school;
        }).toArray();

        Enumerable.from($scope.schools).forEach(function(school){
          school.walkablePlanningBlocks = Enumerable.from(school.planningBlocks).count(function(block){
            var block = Enumerable.from($scope.rawPlanningBlocks).firstOrDefault(function(planningBlock){
              return planningBlock.properties.PBID === block;
            });
            if(block === null)
              return false;
            return Enumerable.from(block.geometry.coordinates).all(function(coordinates){
              return Enumerable.from(coordinates).all(function(coordinate){
                var distance = $scope.distance(coordinate[1], coordinate[0], school.Y, school.X, 'M');
                return distance < 1;
              });
            });
          });
          school.walkablePercent = school.walkablePlanningBlocks / school.planningBlocks.length;
        });

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

    setTimeout($scope.loadCurrent, 2000);
  }
  MainController.$inject = ["$timeout", "$scope", "$resource", "$log", "$anchorScroll", "$location", "webDevTec", "toastr", "leafletDirective", "leafletData", "NgTableParams"];
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

angular.module("redistricting").run(["$templateCache", function($templateCache) {$templateCache.put("app/main/main.html","<div class=\"container-fluid\"><div class=\"row\"><div class=\"col-md-12\"><leaflet defaults=\"defaults\" lf-center=\"center\" width=\"100%\" height=\"400px\"></leaflet></div></div><div class=\"row\"><div class=\"col-md-12\"><div class=\"panel panel-default\"><div class=\"panel-body\"><button ng-click=\"takeSnapshot()\" class=\"btn btn-primary\"><span ng-hide=\"snapshotInProgress\">Take Snapshot</span><i class=\"fa fa-cog fa-spin\" ng-hide=\"!snapshotInProgress\"></i></button> <button ng-click=\"loadCurrent()\" class=\"btn btn-primary\">Current Districting</button></div></div></div></div><div class=\"row col-xs-12\"><div class=\"panel panel-default\"><div class=\"panel-heading\"><h4 class=\"panel-title\">11/18/2015 Meeting</h4></div><div class=\"panel-body\"><button ng-click=\"loadOption11118()\" class=\"btn btn-primary\">Option 1</button> <button ng-click=\"loadOption21118()\" class=\"btn btn-primary\">Option 2</button> <button ng-click=\"loadOption31118()\" class=\"btn btn-primary\">Option 3</button> <button ng-click=\"loadOption41118()\" class=\"btn btn-primary\">Option 4</button></div></div></div><div class=\"row col-md-12\"><table ng-table=\"tableParams\" class=\"table table-condensed table-bordered\"><tr ng-repeat=\"school in $data\" ng-class=\"{\'selected-row\':selectedSchoolName === school.NAME}\"><td title=\"\'Color\'\"><div style=\"height:20px; width:20px; background:{{schoolColors[school.NAME]}}; display:table\"><div></div></div></td><td title=\"\'School\'\" sortable=\"\'NAME\'\">{{school.NAME}}</td><td title=\"\'2015 Cap.\'\" sortable=\"\'school.SRC\'\">{{school.SRC}}</td><td title=\"\'2016 Cap.\'\" sortable=\"\'school.SRC2016 !== undefined ? school.SRC2016 : school.SRC\'\">{{school.SRC2016 !== undefined ? school.SRC2016 : school.SRC}}</td><td title=\"\'2017 Cap.\'\" sortable=\"\'school.SRC2017 !== undefined ? school.SRC2017 : school.SRC2016 !== undefined ? school.SRC2016 : school.SRC\'\">{{school.SRC2017 !== undefined ? school.SRC2017 : school.SRC2016 !== undefined ? school.SRC2016 : school.SRC}}</td><td title=\"\'2015 %\'\" sortable=\"\'school.SRC\'\"><em ng-class=\"{\'text-danger\':school.students / school.SRC > 1}\">{{Math.round(school.students / school.SRC * 100)}}%</em></td><td title=\"\'2016 %.\'\" sortable=\"\'school.SRC2016 !== undefined ? school.SRC2016 : school.SRC\'\"><em ng-class=\"{\'text-danger\':school.students / (school.SRC2016 !== undefined ? school.SRC2016 : school.SRC) > 1}\">{{Math.round(school.students / (school.SRC2016 !== undefined ? school.SRC2016 : school.SRC)*100)}}%</em></td><td title=\"\'2017 %\'\" sortable=\"\'school.SRC2017 !== undefined ? school.SRC2017 : school.SRC2016 !== undefined ? school.SRC2016 : school.SRC\'\"><em ng-class=\"{\'text-danger\':school.students / (school.SRC2017 !== undefined ? school.SRC2017 : school.SRC2016 !== undefined ? school.SRC2016 : school.SRC) > 1}\">{{Math.round(school.students / (school.SRC2017 !== undefined ? school.SRC2017 : school.SRC2016 !== undefined ? school.SRC2016 : school.SRC)*100)}}%</em></td><td title=\"\'Students\'\" sortable=\"\'school.students\'\">{{school.students}}</td><td title=\"\'% Walkable\'\" sortable=\"\'school.walkablePercent\'\">{{Math.round(school.walkablePercent*100)}}%</td></tr></table></div><div class=\"row col-xs-12\"><div class=\"panel panel-default\"><div class=\"panel-heading\"><h4 class=\"panel-title\">9/30/2015 Meeting</h4></div><div class=\"panel-body\"><button ng-click=\"loadOption1()\" class=\"btn btn-primary\">Option 1</button> <button ng-click=\"loadOption2()\" class=\"btn btn-primary\">Option 2</button> <button ng-click=\"loadOption3()\" class=\"btn btn-primary\">Option 3</button></div></div><div class=\"panel panel-default\"><div class=\"panel-heading\"><h4 class=\"panel-title\">10/14/2015 Meeting</h4></div><div class=\"panel-body\"><button ng-click=\"loadOptionA()\" class=\"btn btn-primary\">Option A</button> <button ng-click=\"loadOptionB()\" class=\"btn btn-primary\">Option B</button> <button ng-click=\"loadOptionC()\" class=\"btn btn-primary\">Option C</button> <button ng-click=\"loadOptionD()\" class=\"btn btn-primary\">Option D</button> <button ng-click=\"loadOptionE()\" class=\"btn btn-primary\">Option E</button></div></div><div class=\"panel panel-default\"><div class=\"panel-heading\"><h4 class=\"panel-title\">10/28/2015 Meeting</h4></div><div class=\"panel-body\"><button ng-click=\"loadOptionA1021()\" class=\"btn btn-primary\">Option A</button> <button ng-click=\"loadOptionB1021()\" class=\"btn btn-primary\">Option B</button> <button ng-click=\"loadOptionC1021()\" class=\"btn btn-primary\">Option C</button> <button ng-click=\"loadOptionD1021()\" class=\"btn btn-primary\">Option D</button> <button ng-click=\"loadOptionE1021()\" class=\"btn btn-primary\">Option E</button> <button ng-click=\"loadOptionF1021()\" class=\"btn btn-primary\">Option F</button> <button ng-click=\"loadOptionG1021()\" class=\"btn btn-primary\">Option G</button></div></div><div class=\"panel panel-default\"><div class=\"panel-heading\"><h4 class=\"panel-title\">11/11/2015 Meeting</h4></div><div class=\"panel-body\"><button ng-click=\"loadOptionA1111()\" class=\"btn btn-primary\">Option A</button> <button ng-click=\"loadOptionB1111()\" class=\"btn btn-primary\">Option B</button> <button ng-click=\"loadOptionC1111()\" class=\"btn btn-primary\">Option C</button> <button ng-click=\"loadOptionD1111()\" class=\"btn btn-primary\">Option D</button> <button ng-click=\"loadOptionE1111()\" class=\"btn btn-primary\">Option E</button> <button ng-click=\"loadOptionF1111()\" class=\"btn btn-primary\">Option F</button> <button ng-click=\"loadOptionG1111()\" class=\"btn btn-primary\">Option G</button> <button ng-click=\"loadOptionH1111()\" class=\"btn btn-primary\">Option H</button> <button ng-click=\"loadOptionI1111()\" class=\"btn btn-primary\">Option I</button> <button ng-click=\"loadOptionJ1111()\" class=\"btn btn-primary\">Option J</button> <button ng-click=\"loadOptionK1111()\" class=\"btn btn-primary\">Option K</button> <button ng-click=\"loadOptionL1111()\" class=\"btn btn-primary\">Option L</button></div></div></div><div ng-hide=\"hideSnapshot\" id=\"snapshot\"></div></div>");
$templateCache.put("app/components/navbar/navbar.html","<nav class=\"navbar navbar-static-top navbar-inverse\"><div class=\"container-fluid\"><div class=\"navbar-header\"><a class=\"navbar-brand\" href=\"https://github.com/Swiip/generator-gulp-angular\"><span class=\"glyphicon glyphicon-home\"></span> Gulp Angular</a></div><div class=\"collapse navbar-collapse\" id=\"bs-example-navbar-collapse-6\"><ul class=\"nav navbar-nav\"><li class=\"active\"><a ng-href=\"#\">Home</a></li><li><a ng-href=\"#\">About</a></li><li><a ng-href=\"#\">Contact</a></li></ul><ul class=\"nav navbar-nav navbar-right acme-navbar-text\"><li>Application was created {{ vm.relativeDate }}.</li></ul></div></div></nav>");}]);