/*global client, Backbone, _, JST, OpenLayers, proj4 */
'use strict';

client.Views.ChartView = Backbone.View.extend({

	hasRendered: false,

        initialize: function() {
                _.bindAll(this, 'render', 'drawCharts', 'populateCharts');
        },

	render: function() {

		if(
			false === _.isUndefined(this.model.get('lat'))
			&& false === _.isNaN(this.model.get('lat'))
			&& false === _.isUndefined(this.model.get('lon'))
			&& false === _.isNaN(this.model.get('lon'))
		) {
			console.log('Chart: rendering')
		
			if( false===this.hasRendered ) {
				$('#concentrationGraphControls').on('click', function() {
					$.scrollTo($('#chartWrapper'), 500, {
						offset: -80
					} );
				});
			}
			$('#chartWrapper').show('fast');
			$('#concentrationGraphControls').show('slow');
			this.populateCharts();

		}
	},

        drawCharts: function() {

	        	function formatCoord(coord) {
	                	return Math.abs(Math.round(coord*10)/10).toFixed(1);
	        	};

                $('#chart').show().highcharts({
                        chart: {
                                type: 'column'
                        },
                        title: {
                                text: 'Sea Ice Concentration for ' + moment(this.model.get('month'), 'MM').format('MMMM') + ' at ' + formatCoord(this.model.get('lat')) + 'N ' + formatCoord(this.model.get('lon')) + 'W',
                                x: -20,
                                margin: 20
                        },
                        xAxis: {
                                categories: this.dates,
                                tickInterval: 5
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
                                min: 0,
                                max: 100
                        },
                        tooltip: {
                                valueSuffix: '%'
                        },
                        legend: {
                                enabled: false
                        },
                        series: [{
                                data: this.values
                        }],
                        credits: {
                                enabled: false
                        }
                });

		// Update text in sidebar
		$('#concentrationGraphControls p').text(
			_.template(
				'<%= month %> Average Concentration',
				{ month: moment(this.model.get('month'), 'MM').format('MMMM') }
			)
		);

        },

	populateCharts: function() {

		this.dates = [];
		this.values = [];
		var getUrl = _.template('/data/concentration?month=<%= month %>&lon=<%= lon %>&lat=<%= lat %>', this.model.toJSON());
		$.getJSON(getUrl, _.bind(function(data) {
	
			_.each(data, function(e, i) {
				this.dates.push(i);
				this.values.push(parseInt(e));
			}, this);
	
		}, this)).done(this.drawCharts);
	
	}
});
