/*global client, Backbone, JST, OpenLayers, proj4 */
'use strict';

client.Views.ChartView = Backbone.View.extend({

        initialize: function() {
                _.bindAll(this);
		this.model.on('change', this.render, this);
        },

	template: JST['app/scripts/templates/Chart.ejs'],

	render: function() {
		this.populateCharts();
	},

        drawCharts: function() {
                $('#chart').highcharts({
                        title: {
                                text: 'Sea Ice Concentration for September at ' + this.model.get('lat') + ' / ' + this.model.get('lon'),
                                x: -20,
                                margin: 40
                        },
                        xAxis: {
                                categories: this.dates
                        },
                        yAxis: {
                                title: {
                                        text: 'Percentage'
                                },
                                plotLines: [{
                                        value: 0,
                                        width: 1,
                                        color: '#808080'
                                }],
                                max: 100
                        },
                        tooltip: {
                                valueSuffix: '%'
                        },
                        legend: {
                                layout: 'vertical',
                                align: 'right',
                                verticalAlign: 'middle',
                                borderWidth: 0
                        },
                        series: [{
                                name: 'Concentration',
                                data: this.values
                        }]
                });
        },

	populateCharts: function() {
		this.dates = [];
		this.values = [];
		var chartscope = this;

		// This requires CORS to be enabled on the web browser and is not a long-term
		// solution. We either need everything to be hosted through the same port, or
		// figure out how to get jQuery's JSONP working.
		$.getJSON("http://icarus.snap.uaf.edu:8000/data?month=9&lon=" + this.model.get('lon') + "&lat=" + this.model.get('lat'), function(data) {
			var jsonscope = chartscope;
			$.each(data, function(key, val) {
				jsonscope.dates.push(key);
				jsonscope.values.push(parseInt(val));
			});
		}).done(this.drawCharts);
	}
});
