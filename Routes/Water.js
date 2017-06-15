var async = require('async');
var Express = require('express');
var router = Express.Router({caseSensitive: true});

// Base URL is /Water

var MAX_DB_SELECT = '1000';

var routingFunction = function(attribute, many) {
   return function(req, res) {
      var start = parseInt(req.query.start, 10);
      var stop = parseInt(req.query.stop, 10);
      var qry = 'select whenRecorded, ' + attribute + ' from FlowData ';
   
      if (many && start && stop && start < stop) {
         qry += 'where whenRecorded between ? and ? ';
      }
   
      qry += 'order by whenRecorded desc limit ';

      qry += many ? MAX_DB_SELECT : '1';
   
      async.waterfall([
      function(cb) {
         // Do query
         console.log(qry);
         req.cnn.chkQry(qry, [new Date(start), new Date(stop)], cb);
      },
      function(estimates, fields, cb) {
         // send query results as a json array
         res.json(estimates);
         cb();
      }],
      function(err) {
         // release connection
         console.log("Releasing Connection");
         req.cnn.release();
      });
   };
};

router.get('/Estimate', routingFunction('estimatedFlow', true));
router.get('/Estimate/Current', routingFunction('estimatedFlow', false));
router.get('/Actual', routingFunction('actualFlow', true));
router.get('/Actual/Current', routingFunction('actualFlow', false));

module.exports = router;
