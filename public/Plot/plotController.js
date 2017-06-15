app.controller('plotController',
 ['$scope', '$http', '$interval',
 function($scope, $http, $interval) {
   // Setup D3.js figure
   var svg = d3.select("div#container")
    .append("svg")
    .attr("preserveAspectRatio", "xMinYMin meet")
    .attr("viewBox", "0 0 960 500")
    .classed("svg-content", true);

   var margin = {top: 20, right: 20, bottom: 30, left: 50};
   var width = 960 - margin.left - margin.right;
   var height = 500 - margin.top - margin.bottom;
   var g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
   
   var parseTime = d3.utcParse("%Y-%m-%dT%H:%M:%S.%LZ");
   
   var x = d3.scaleTime().rangeRound([0, width]);
   var y = d3.scaleLinear().rangeRound([height, 0]);
   var estimatedFlowLine = d3.area()
    .x(function(d) { return x(d.whenRecorded); })
    .y1(function(d) { return y(d.estimatedFlow); });
   var actualFlowLine = d3.line()
    .x(function(d) { return x(d.whenRecorded); })
    .y(function(d) { return y(d.actualFlow); });

   var estData, actData;
   var waiting = false;
   var UPDATE_RATE = 5000;
   var updateInterval;

   var lastFetchNum = 0;

   // Function to update the plot with new data from server
   var update = function() {
      var retVal;

      // Get estimate data from server
      waiting = true;
      $http.get('/Water/Estimate')
      .then(function(res) {
         estData = res.data;
         estData.forEach(function(data) {
            data.whenRecorded = parseTime(data.whenRecorded);
            data.estimatedFlow = +data.estimatedFlow;
         });

         // Only do the rest of this if there's actually new data
         // Get actual data from server
         if (lastFetchNum < estData.length) {
            console.log('Updating Screen! ' + lastFetchNum + ' < ' + estData.length);
            retVal = $http.get('/Water/Actual');
         }
         else {
            console.log('No Update ' + lastFetchNum + ' >= ' + estData.length);
            retVal = Promise.reject(new Error('No New Data'));
         }

         lastFetchNum = estData.length;
         return retVal;
      })
      // Plot the new data
      .then(function(res) {
         actData = res.data;
         actData.forEach(function(data) {
            data.whenRecorded = parseTime(data.whenRecorded);
            data.actualFlow = +data.actualFlow;
         });

         var xrange = d3.extent(estData, function(d) { return d.whenRecorded; });
         // var yrange = d3.extent(plotData, function(d) { return d.estimatedFlow; })
         var yrange = [0, 300];

         x.domain(xrange);
         y.domain(yrange);

         var t = d3.transition().duration(750).ease(d3.easeLinear);

         g.select(".area")
          .transition(t)
            .style("fill-opacity", 1e-6)
            .remove();

         g.append("path")
            .datum(estData)
            .style("fill-opacity", 1e-6)
            .attr("class", "area")
            .attr("d", estimatedFlowLine)
          .transition(t)
            .style("fill-opacity", 1);

         g.select(".actual")
          .transition(t)
            .style("stroke-opacity", 1e-6)
            .remove();

         g.append("path")
            .datum(actData)
            .style("stroke-opacity", 1e-6)
            .attr("fill", "none")
            .attr("class", "actual")
            .attr("stroke", "black")
            .attr("stroke-linejoin", "round")
            .attr("stroke-linecap", "round")
            .attr("stroke-width", 1.5)
            .attr("d", actualFlowLine)
          .transition(t)
            .style("stroke-opacity", 1);
      })
		.catch(function(err) {
			console.log("In error catch block: " + err);
         waiting = false;
		});
   };

   // Setup the plot axes and initial line graph
   var initialize = function() {
      waiting = true;
      g.selectAll("path").remove();
      $http.get('/Water/Estimate')
      .then(function(res) {
         estData = res.data;
         estData.forEach(function(data) {
            data.whenRecorded = parseTime(data.whenRecorded);
            data.estimatedFlow = +data.estimatedFlow;
         });
         lastFetchNum = estData.length;
         return $http.get('/Water/Actual');
      })
      .then(function(res) {
         actData = res.data;
         actData.forEach(function(data) {
            data.whenRecorded = parseTime(data.whenRecorded);
            data.actualFlow = +data.actualFlow;
         });

         var xrange = d3.extent(estData, function(d) { return d.whenRecorded; });
         // var yrange = d3.extent(plotData, function(d) { return d.estimatedFlow; })
         var yrange = [0, 300];

         x.domain(xrange);
         y.domain(yrange);

         estimatedFlowLine.y0(y(0));

         svg.append("linearGradient")
          .attr("id", "temperature-gradient")
          .attr("gradientUnits", "userSpaceOnUse")
          .attr("x1", 0).attr("y1", 0)
          .attr("x2", 0).attr("y2", height)
          .selectAll("stop")
          .data([
            {offset: "0%", color: "#FF00FF"},   // Magenta
            {offset: "50%", color: "#8080FF"},  // Blue
            {offset: "100%", color: "#00FFFF"}  // Cyan
          ])
          .enter().append("stop")
          .attr("offset", function(d) { return d.offset; })
          .attr("stop-color", function(d) { return d.color; });

         g.append("g")
          .attr("transform", "translate(0," + height + ")")
          .call(d3.axisBottom(x))
          .select(".domain");

         g.append("g")
          .call(d3.axisLeft(y))
          .append("text")
          .attr("fill", "#000")
          .attr("transform", "rotate(-90)")
          .attr("y", 6)
          .attr("dy", "0.71em")
          .attr("text-anchor", "end")
          .text("Water Usage (GPH)");

         g.append("path")
          .datum(estData)
          .attr("class", "area")
          .attr("d", estimatedFlowLine);

         g.append("path")
          .datum(actData)
          .attr("fill", "none")
          .attr("class", "actual")
          .attr("stroke", "black")
          .attr("stroke-linejoin", "round")
          .attr("stroke-linecap", "round")
          .attr("stroke-width", 1.5)
          .attr("d", actualFlowLine);

         waiting = false;
      });
   };

   initialize();
   updateInterval = $interval(function() {
      if (!waiting) {
         update();
         console.log("Updating");
      }
   }, UPDATE_RATE);

   $scope.$on("$destroy", function(){
      $interval.cancel(updateInterval);
   });
}]);
