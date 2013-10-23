/*global client, Backbone, _, JST, OpenLayers, proj4 */
'use strict';

client.Views.ChartView = Backbone.View.extend({

        initialize: function() {
                _.bindAll(this, 'render', 'drawCharts', 'populateCharts');
		this.model.on('change', this.render, this);
        },

	render: function() {
		this.populateCharts();
	},

        drawCharts: function() {
		
                $('#chart').highcharts({
                        title: {
                                text: 'Sea Ice Concentration for ' + moment(this.model.get('month'), 'MM').format('MMMM') + ' at ' + this.model.get('lat') + ' / ' + this.model.get('lon'),
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

		if(
			false === _.isUndefined(this.model.get('lat'))
			&& false === _.isNaN(this.model.get('lat'))
			&& false === _.isUndefined(this.model.get('lon'))
			&& false === _.isNaN(this.model.get('lon'))
		) {
			this.dates = [];
			this.values = [];
			var getUrl = _.template('/data?month=<%= month %>&lon=<%= lon %>&lat=<%= lat %>', this.model.toJSON());
			$.getJSON(getUrl, _.bind(function(data) {
		
				_.each(data, function(e, i) {
					this.dates.push(i);
					this.values.push(parseInt(e));
				}, this);
		
			}, this)).done(this.drawCharts);
		}
	}
});
