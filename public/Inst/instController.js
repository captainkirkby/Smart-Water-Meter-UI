app.controller('instController',
 ['$scope', '$http', '$interval',
 function($scope, $http, $interval) {
   var low = 10;
   var high = 300;
   var REFRESH_RATE = 1000;      // ms
   var waiting;
   var updateInterval;
   
   // Function to get most recent flow value from the database and display it
   var update = function() {
      waiting = true;
      $http.get('/Water/Estimate/Current')
      .then(function(res) {
         // Only display flow to 2 decimal places
         $scope.flow = Math.round(res.data[0].estimatedFlow * 100) / 100;
         waiting = false;
         console.log($scope.flow);
      })
      .catch(function(err) {
         if (err) {
            console.log(err);
         }
      });
   };

   // Default is empty string
   $scope.flow = "";

   // Once every second, update $scope.flow
   update();
   updateInterval = $interval(function() {
      if (!waiting) {
         update();
      }
   }, REFRESH_RATE);
   
   // Don't keep updating when the window is closed
   $scope.$on("$destroy", function(){
      $interval.cancel(updateInterval);
   });

   // Color the flow text according to its flow.
   // Flows closer to high are darker, flows closer to low are lighter
   d3.select(".inst-flow")
   .style("font-size", function() {
      var sz, norm;
      var lowSize = 10;
      var highSize = 20;
      
      norm = (($scope.flow - low) / (high - low));
      sz = norm * (highSize - lowSize) + lowSize;

      return sz + "vw";
   })
   .style("color", function() {
      var norm, r, g, b;

      norm = (($scope.flow - low) / (high - low));
      r = Math.floor(255 * (norm));
      g = Math.floor(255 * (1 - norm));
      b = 255;

      return "rgb(" + r + "," + g + "," + b + ")";
   });
}]);
