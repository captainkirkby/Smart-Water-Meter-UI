var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var CnnPool = require('./Routes/CnnPool.js');

var app = express();

// Static Routes
app.use(express.static(path.join(__dirname, 'public')));

// Setup Routes
app.use(bodyParser.json());
app.use(CnnPool.router);
app.use('/Water', require('./Routes/Water.js'));

// Route of last resort 
app.use(function(req, res, next) {
   req.cnn.release();
   res.status(404).end();
});

// Handle command line invocation
process.argv.forEach(function(element, index) {
   if (element === '-p' && index <= process.argv.length - 2) {
      app.port_num = parseInt(process.argv[index + 1], 10);
   }
});

if (app.port_num > 0) {
   app.listen(app.port_num, function () {
      console.log('App Listening on port ' + app.port_num);
   });
}
