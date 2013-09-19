var http = require('http');
var pg = require('pg');
var static = require('node-static');
var express = require("express");
var app = express();

app.get('/data', function(request, response) {
  response.writeHead(200, {"Content-Type": "text/plain"});

  var conString = "postgres://sea_ice_atlas_user:*@hermes.snap.uaf.edu/sea_ice_atlas";
  var client = new pg.Client(conString);

  client.connect(function(err) {

    if(err) {
      return console.error('could not connect to postgres', err);
    }

    // Pull all dates and corresponding sea ice concentration values from PostGIS database.
    var query = client.query("SELECT date, ST_Value(rast, ST_PointFromText('POINT(-180 80.375)', 3338)) AS concentration FROM rasters", function(err, result) {

      if(err) {
        return console.error('error running query', err);
      }

      // Create and populate rows object with date/concentration pairs.
      var rows = {};
      for(var i=0; i < result.rows.length; i++) {
        var date = result.rows[i].date.toString();

        // Node.js bombs if you try to toString() a null value.
        if(result.rows[i].concentration) {
          var concentration = result.rows[i].concentration.toString();
          rows[date] = concentration;
        }
      }

      // Convert rows object to JSON.
      response.write(JSON.stringify(rows));
      response.end();
      client.end();
    });

  });
});

app.get('*', function(request, response) {
  var file = new(static.Server)("/var/www/html/charts", { 
    cache: 600, 
    headers: { 'X-Powered-By': 'node-static' } 
  });

  file.serve(request, response);
});

app.listen(8000);
console.log("Server running at http://127.0.0.1:8000/");
