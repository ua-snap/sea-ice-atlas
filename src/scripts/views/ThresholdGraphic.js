/*global client, Backbone, _, JST, OpenLayers, proj4 */
'use strict';

client.Views.ThresholdGraphicView = Backbone.View.extend({

	hasRendered: false,

        initialize: function() {
                _.bindAll(this, 'render', 'drawGraphic', 'loadData');
		this.model.on('change', this.render, this);
        },

	render: function() {
		if( false === this.hasRendered ) {
			$("#thresholdSlider").slider();
			$("#thresholdSlider").on('slide', function(slideEvt) {
				$("#thresholdSliderLabel").text(slideEvt.value);
			});
			$('#thresholdGraphicControls').on('click', function() {
				$.scrollTo($('#graphicWrapper'), 500, {
					offset: -80
				} );
			});
	        }
	        $('#thresholdGraphicControls').show('slow');

	},

        drawGraphic: function() {
        		return;
		
        },

	loadData: function() {
		return;
		if(
			false === _.isUndefined(this.model.get('lat'))
			&& false === _.isNaN(this.model.get('lat'))
			&& false === _.isUndefined(this.model.get('lon'))
			&& false === _.isNaN(this.model.get('lon'))
		) {
			this.dates = [];
			this.values = [];
			var getUrl = _.template('/data/threshold?month=<%= month %>&lon=<%= lon %>&lat=<%= lat %>', this.model.toJSON());
			$.getJSON(getUrl, _.bind(function(data) {
		
				_.each(data, function(e, i) {
					this.dates.push(i);
					this.values.push(parseInt(e));
				}, this);
		
			}, this)).done(this.drawCharts);
		}
	}
});
