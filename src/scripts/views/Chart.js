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
		
			$('#chartWrapper').show('fast');
			$('#concentrationGraphControls').show('slow');

			if( false === this.hasRendered ) {
				$('#concentrationGraphControls').on('click', function() {
					$.scrollTo($('#chartWrapper'), 500, {
						offset: -80
					} );
				});
				this.hasRendered = true;
			}

			this.populateCharts();

		}
	},

        drawCharts: function() {
		$('#plottedDataHeader').text(_.template('Plotted data for selected location: <%= lat %>°N <%= lon %>°W', {
			lat: this.formatCoord(this.model.get('lat')),
			lon: this.formatCoord(this.model.get('lon'))
		}));

		$('#chartTitle').text(_.template('Sea ice concentration for <%= month %>', {
			month: moment(this.model.get('month'), 'MM').format('MMMM')
		}));

		Highcharts.setOptions({
			colors: ['#ABABB7']
		});

                $('#chart').show().highcharts({
                        chart: {
                                type: 'line'
                        },
                        title: null,
                        xAxis: {
                                categories: this.dates,
                                tickInterval: 5
                        },
                        yAxis: {
                                title: {
                                        text: null
                                },
                                plotLines: [{
                                        value: 0,
                                        width: 1,
                                        color: '#B2E1FE'
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
                        		name: 'concentration',
                                data: this.values
                        }],
                        credits: {
                                enabled: false
                        }
                });

		// Update text in sidebar
		$('#concentrationGraphControls p').text(
			_.template(
				'Go to ice concentration for <%= month %>',
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
	
	},

	formatCoord: function(coord) {
		return Math.abs((Math.round(coord * 4) / 4)).toFixed(2);
	}

});
