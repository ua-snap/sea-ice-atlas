var pg = require('pg');

// This is the route to the PostGIS JSON API.
exports.data = function(request, response) {

	var client = new pg.Client(
		request.app.get('config').get('database')
	);

	client.connect(function(err) {

		if(err) {
			response.writeHead(500, {"Content-Type": "text/plain"});
			response.write(JSON.stringify(err));
			response.end();
			return console.error('could not connect to postgres', err);
		}

		// Get the month GET parameter.
		var month = parseInt(request.query.month, 10);
		var lon = parseFloat(request.query.lon);
		var lat = parseFloat(request.query.lat);

		// Strangely, JavaScript doesn't have a better way to pad ints with zeros.
		month = String('0' + month).slice(-2);

		// Pull all dates and corresponding sea ice concentration values from PostGIS database.
		var query = client.query("SELECT date, concentration FROM (SELECT year AS date, nth_value(concentration, 2) OVER (PARTITION BY year) AS concentration FROM (SELECT date, COALESCE(ST_Value(rast, 1, ST_SetSRID(ST_Point(" + lon + ", " + lat + "), 3338)), 0) AS concentration FROM rasters) AS allvalues CROSS JOIN generate_series(1953, 2012) AS year WHERE date::text LIKE year || '-" + month + "-%' ORDER BY year) AS partitioned GROUP BY date, concentration ORDER BY date;", function(err, result) {

			if(err) {
				response.writeHead(500, {"Content-Type": "text/plain"});
				response.write(JSON.stringify(err));
				response.end();
				return console.error('error running query', err);
			}

			response.writeHead(200, {"Content-Type": "application/json"});

			// Create and populate rows object with date/concentration pairs.
			var rows = {};
			for(var i=0; i < result.rows.length; i++) {
				var date = result.rows[i].date.toString();
				var concentration = result.rows[i].concentration.toString();
				rows[date] = concentration;
			}

			client.end();

			// Convert rows object to JSON.
			response.write(JSON.stringify(rows));
			response.end();
		});

	});
};
