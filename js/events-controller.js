(function(){
  var app = angular.module('runningEventsApp', ['infinite-scroll']);

  app.config(['$httpProvider', function($httpProvider) {
    $httpProvider.defaults.useXDomain = true;
    delete $httpProvider.defaults.headers.common['X-Requested-With'];
  }]);

  app.controller('EventsController', ['$scope', '$http', '$timeout', '$q', function ($scope, $http, $timeout, $q) {

    $scope.eventsList = [];
    $scope.eventsList['eventLocation'] = "";
    $scope.totalDist = 0;
    $scope.numEvents = 0;
    $scope.geocoder = new google.maps.Geocoder();
    $scope.eventsDisplayed = []

    // get json data about running events
    var fetchCount = 0;
    // getEventsData('js/api-test.json'); // works as expected
    // getEventsData("http://jsonplaceholder.typicode.com/posts"); // works as expected
    
    // doesn't work presumably because server does not allow cross-origin resource sharing
    // or returns not formated JSON
    getEventsData("https://crossorigin.me/https://api-test.mynextrun.com/site/v1/event-stats");

    // load each location name every 2s because of google maps api restriction
    var locationsLoaded = 6;
    loadEventsLocations = setInterval(function(){
      if (locationsLoaded < $scope.eventsList.length){
        getEventLocation($scope.eventsList[locationsLoaded]);
        locationsLoaded++;
      }
      else
        clearInterval(loadEventsLocations);
    }, 2100);
    
    $scope.loadMore = function(){
      // console.log("loading more");
      var lastIndex = $scope.eventsDisplayed.length - 1;
      if (lastIndex <= $scope.eventsList.length - 1)
        $scope.eventsDisplayed.push($scope.eventsList[lastIndex + 1]);
    }

    function getEventsData(url){
      $http.get(url, {
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        }
      }).then(function(response){
        // console.log(response);
        $scope.eventsList = response.data.events;
        $scope.totalDist = response.data.distanceCount;
        $scope.numEvents = response.data.eventCount;
        $scope.eventsDisplayed = $scope.eventsList.slice(0, 6);
        $scope.eventsDisplayed.forEach(function(each){
          // console.log(each);
          getEventLocation(each);
        });

      }, function(response){
        console.log('Failed to fetch events');
        console.log(response);
        if (fetchCount < 10){
          $timeout(getEventsData(url), 200);
          fetchCount++;
        }
      });
    }

    function getEventLocation(evnt){
      var latlng = new google.maps.LatLng(evnt.latitude, evnt.longitude);
      $scope.geocoder.geocode({'location': latlng}, function(results, status) {
        if (status === google.maps.GeocoderStatus.OK) {
          evnt['eventLocation'] = results[0]['formatted_address'];
          $scope.$apply();
        } else if (status === google.maps.GeocoderStatus.OVER_QUERY_LIMIT){
          console.log('OVER_QUERY_LIMIT');
        } else {
          console.log('Geocoder failed due to: ' + status);
        }
      });
    }

    function eventsLoaded(){
      return $scope.eventsList.length > 0;
    }

  }]);

})();