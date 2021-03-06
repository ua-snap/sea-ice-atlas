var pg = require('pg');
var moment = require('moment');
var _ = require('underscore');

exports.data = {};

// Fetch the concentration values from the DB; used in two routes below.
function fetchConcentration(request, response, callback) {

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
		var startYear = request.app.get('config').get('startYear');
		var endYear = request.app.get('config').get('endYear');
		var table = request.app.get('config').get('database:table');

		// Strangely, JavaScript doesn't have a better way to pad ints with zeros.
		month = String('0' + month).slice(-2);

		// Pull all dates and corresponding sea ice concentration values for the second
		// week of a particular month from PostGIS database.
		var query = client.query({
			name: "concentration",
			text: "SELECT year, concentration FROM (SELECT date, COALESCE(ST_Value(rast, 1, ST_SetSRID(ST_Point($1, $2), 4326)), 0) AS concentration FROM " + table + ") AS allvalues CROSS JOIN generate_series($3::int, $4::int) AS year WHERE date::text LIKE year || '-' || $5 || '-15' ORDER BY year",
			values: [lon, lat, startYear, endYear, month]
		}, function(err, result) {

			if(err) {
				response.writeHead(500, {"Content-Type": "text/plain"});
				response.write(JSON.stringify(err));
				response.end();
				return console.error('error running query', err);
			}

			// Create and populate rows object with date/concentration pairs.
			var rows = {};
			for(var i=0; i < result.rows.length; i++) {
				var date = result.rows[i].year.toString();
				var concentration = result.rows[i].concentration.toString();
				rows[date] = concentration;
			}

			client.end();

			// Invoke callback to handle data response
			callback(rows);

		});

	});
}

// This is the route to the sea ice concentration PostGIS JSON API.
exports.data.concentration = function(request, response) {

	var rows = fetchConcentration(request, response, function(rows) {	
		// Convert rows object to JSON.
		response.writeHead(200, {"Content-Type": "application/json"});
		response.write(JSON.stringify(rows));
		response.end();	
	});
};

// This is the route to the sea ice concentration PostGIS JSON API, returned as CSV.
exports.data.concentrationCsv = function(request, response) {

	var rows = fetchConcentration(request, response, function(rows) {	
		
		var lon = parseFloat(request.query.lon);
		var lat = parseFloat(request.query.lat);
		
		// Wiggle the JSON format to play nice with json2csv
		var rowsCsv = [];
		rowsCsv.push({
			"header1" : "Date",
			"header2" : "% Ice Concentration at " + lat + "N, " + lon + "E"
		});
		_.each(rows, function(e, i, l) {
			rowsCsv.push({"date":i, "concentration":e});
		})

		response.csv(rowsCsv);
		
	});
};

// This is the route to the "open water" threshold PostGIS JSON API.
exports.data.openwater = function(request, response) {

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
		var lon = parseFloat(request.query.lon);
		var lat = parseFloat(request.query.lat);
		var concentration = parseInt(request.query.concentration,10)
		var table = request.app.get('config').get('database:table');

		// Pull presence of sea ice concentration over a certain threshold from 
		// PostGIS database as boolean values, based on second week of every
		// month of every year.
		var query = client.query( {
			name: "openwater",
			text: "SELECT date, (CASE WHEN concentration >= $1 THEN true ELSE false END) AS ice FROM (SELECT to_char(date, 'YYYY-MM') AS date, COALESCE(ST_Value(rast, 1, ST_SetSRID(ST_Point($2, $3), 4326)), 0) AS concentration FROM "+table+" ) AS partitioned ORDER BY date",
			values: [concentration, lon, lat]
		}, function(err, result) {

			if(err) {
				response.writeHead(500, {"Content-Type": "text/plain"});
				response.write(JSON.stringify(err));
				response.end();
				return console.error('error running query', err);
			}

			response.writeHead(200, {"Content-Type": "application/json"});

			// Create and populate year attribute of iceBooleans object with
			// month/ice pairs.
			var iceBooleans = {};
			for(var i=0; i < result.rows.length; i++) {
				var year = result.rows[i].date.toString().substring(0, 4);
				var month = result.rows[i].date.toString().substring(5, 7);
				var ice = result.rows[i].ice;

				if(iceBooleans[year] == null) {
					iceBooleans[year] = [];
				}

				iceBooleans[year].push([month, ice]);
			}

			client.end();


			// Now that the month/ice pairs are groups by year, start doing the
			// per-year processing to determine ice/water date ranges.
			var dateRanges = [];
			var iceBegin = false;
			var iceEnd = false;
			var month;

			for(year in iceBooleans) {
				iceBegin = false;
				iceEnd = false;
				
				for(var i=0; i < iceBooleans[year].length; i++) {
					month = iceBooleans[year][i][0];
					ice = iceBooleans[year][i][1];

					if(!iceBegin && ice) {
						iceBegin = moment(year + '-' + month, 'YYYY-MM').startOf('month').format('YYYY-MM-DD');
					}

					if(iceBegin && !ice) {
						dateRanges.push([iceBegin, iceEnd]);
						iceBegin = false;
						iceEnd = false;
						continue;
					}

					iceEnd = moment(year + '-' + month, 'YYYY-MM').endOf('month').format('YYYY-MM-DD');

					if(iceBegin && month == 12) {
						dateRanges.push([iceBegin, iceEnd]);
					}
				}
			}

			// The structure of the dateRanges object is conducive to D3
			// Gantt Chart processing. Output it as JSON.
			response.write(JSON.stringify(dateRanges));
			response.end();
		});

	});
};
