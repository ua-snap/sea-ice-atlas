var http = require('http');
var pg = require('pg');
var static = require('node-static');
var express = require("express");
var app = express();

// This is the route to the PostGIS JSON API.
app.get('/data', function(request, response) {
  response.writeHead(200, {"Content-Type": "text/plain"});

  var conString = "postgres://sea_ice_atlas_user:*@hermes.snap.uaf.edu/sea_ice_atlas";
  var client = new pg.Client(conString);

  client.connect(function(err) {

    if(err) {
      return console.error('could not connect to postgres', err);
    }

    // Get the month GET parameter.
    var month = parseInt(request.query.month);

    // Strangely, JavaScript doesn't have a better way to pad ints with zeros.
    month = String('0' + month).slice(-2);

    // Pull all dates and corresponding sea ice concentration values from PostGIS database.
    var query = client.query("SELECT year AS date, min(concentration) AS concentration FROM (SELECT date, ST_Value(rast, 1, ST_SetSRID(ST_Point(-180, 80.375), 3338)) AS concentration FROM rasters) AS allvalues CROSS JOIN generate_series(1953, 2012) AS year WHERE date::text LIKE year || '-" + month  + "-%' GROUP BY year ORDER BY year", function(err, result) {

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

// This is default route, which serves static files.
app.get('*', function(request, response) {
  var file = new(static.Server)("/home/craig/sea-ice-atlas/charts/client", { 
    cache: 600, 
    headers: { 'X-Powered-By': 'node-static' } 
  });

  file.serve(request, response);
});

app.listen(8000);
console.log("Server running at http://127.0.0.1:8000/");
