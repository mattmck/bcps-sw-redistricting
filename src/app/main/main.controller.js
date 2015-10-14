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
        tileLayer: 'https://api.tiles.mapbox.com/v4/mapbox.streets/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWF0dG1jayIsImEiOiJjaWZpaDlyejlibDB2c3htNzFnZG5pMGV2In0.v9hKZ_mdZB8WNJHE9FJGjg',
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
  }
})();
